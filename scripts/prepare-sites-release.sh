#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-$PWD}"
project_dir="$(cd "$project_dir" && pwd)"

if [[ -z "${SITES_REMOTE_URL:-}" || -z "${SITES_SOURCE_TOKEN:-}" ]]; then
  echo "Set SITES_REMOTE_URL and SITES_SOURCE_TOKEN for the temporary Sites source credential." >&2
  exit 2
fi

command -v git >/dev/null || { echo "git is required" >&2; exit 2; }
command -v rsync >/dev/null || { echo "rsync is required" >&2; exit 2; }

if [[ -n "$(git -C "$project_dir" status --porcelain)" ]]; then
  echo "The project worktree must be clean before syncing Sites source." >&2
  exit 2
fi

version="$(node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version" 2>/dev/null)"
source_commit="$(git -C "$project_dir" rev-parse HEAD)"
source_tree="$(git -C "$project_dir" rev-parse HEAD^{tree})"
sites_branch="${SITES_BRANCH:-main}"
archive_path="${2:-$project_dir/work/sites/kaminchyk-v${version}-sites.tar.gz}"
temporary_directory="$(mktemp -d -t kaminchyk-sites)"
trap 'rm -rf "$temporary_directory"' EXIT

git -c http.version=HTTP/1.1 \
  -c http.postBuffer=524288000 \
  -c http.maxRequestBuffer=104857600 \
  -c "http.extraHeader=Authorization: Bearer ${SITES_SOURCE_TOKEN}" \
  clone --branch "$sites_branch" --single-branch "$SITES_REMOTE_URL" "$temporary_directory/source"

rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='out/' \
  --exclude='dist/' \
  --exclude='work/' \
  --exclude='.codegraph/' \
  --exclude='.worker-dist/' \
  --exclude='.sites-runtime/' \
  "$project_dir/" "$temporary_directory/source/"

git -C "$temporary_directory/source" add -A
if git -C "$temporary_directory/source" diff --cached --quiet; then
  sites_commit="$(git -C "$temporary_directory/source" rev-parse HEAD)"
else
  git -C "$temporary_directory/source" \
    -c user.name="Kaminchyk Sites Sync" \
    -c user.email="sites-sync@localhost" \
    commit -m "Sync Sites source to v${version}"
  sites_commit="$(git -C "$temporary_directory/source" rev-parse HEAD)"
fi

sites_tree="$(git -C "$temporary_directory/source" rev-parse HEAD^{tree})"
if [[ "$sites_tree" != "$source_tree" ]]; then
  echo "Sites source tree does not match the local project tree." >&2
  exit 1
fi

git -C "$temporary_directory/source" \
  -c http.version=HTTP/1.1 \
  -c http.postBuffer=524288000 \
  -c http.maxRequestBuffer=104857600 \
  -c "http.extraHeader=Authorization: Bearer ${SITES_SOURCE_TOKEN}" \
  push origin "$sites_branch"

package_script="${SITES_PACKAGE_SCRIPT:-}"
if [[ -z "$package_script" && -d "$HOME/.codex/plugins/cache/openai-bundled/sites" ]]; then
  package_script="$(find "$HOME/.codex/plugins/cache/openai-bundled/sites" -path '*/skills/sites-hosting/scripts/package-site.sh' -print -quit)"
fi
if [[ -n "$package_script" ]]; then
  bash "$package_script" "$project_dir" "$archive_path"
else
  echo "Sites package helper not found; archive was not created." >&2
fi

printf 'Local commit: %s\nSites source commit: %s\nSites archive: %s\n' "$source_commit" "$sites_commit" "$archive_path"
