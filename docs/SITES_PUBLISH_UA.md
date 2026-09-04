# Публікація на ChatGPT Sites

Це робочий сценарій для цього проєкту. Запускати його треба з кореня:
`/Users/Serhiy/Documents/Codex/kamin-korostyshiv`.

## 1. Підготувати реліз

```bash
git status -sb
git fetch origin --prune --tags
git switch main
git pull --ff-only origin main
npm run lint
npm run typecheck
npm test
```

Для маленької зміни повний `npm test` можна замінити на достатню цільову
перевірку. Перед Sites-публікацією релізний build і перевірки мають бути
успішними.

## 2. Оновити GitHub

Після перевірок створити коміт і відправити саме його у приватний GitHub:

```bash
git add <потрібні-файли>
git commit -m "Release vX.Y.Z опис"
git push origin main
```

Перевірити, що локальний і віддалений `main` збігаються:

```bash
git fetch origin --prune --tags
git diff --quiet HEAD origin/main
git log --oneline --decorate -10
```

Старі теги не пересувати. GitHub Actions створює незмінний `v<version>` після
успішної перевірки.

## 3. Синхронізувати джерело Sites

Sites використовує окремий внутрішній Git remote. Його короткоживучі URL і
токен видає Sites connector; їх не записувати в `.env`, Git, документи або
історію shell.

У Codex виконати скрипт із тимчасовими змінними:

```bash
export SITES_REMOTE_URL='тимчасовий-url-внутрішнього-sites-repo'
export SITES_SOURCE_TOKEN='тимчасовий-токен'
bash scripts/prepare-sites-release.sh "$PWD"
```

Скрипт:

- вимагає чисте локальне дерево;
- клонує гілку `main` у тимчасову папку;
- копіює актуальне дерево проєкту через `rsync`;
- не переносить `.git`, `node_modules`, `.next`, `out`, `work`, `.codegraph`
  та інші важкі/локальні каталоги;
- вмикає `HTTP/1.1`, `http.postBuffer=524288000` і
  `http.maxRequestBuffer=104857600`;
- перевіряє, що дерево внутрішнього Sites-коміту дорівнює дереву локального
  коміту;
- робить звичайний fast-forward push без `--force`;
- готує архів `work/sites/kaminchyk-vX.Y.Z-sites.tar.gz`, якщо доступний
  офіційний Sites package helper.

В кінці скрипт виводить `Sites source commit` та шлях до архіву. Саме цей
коміт і архів передаються у наступні Sites connector calls.

## 4. Створити й розгорнути версію

У Sites connector послідовність така:

1. `sites.save_site_version` для проєкту з `.openai/hosting.json`, передавши
   виведений Sites source commit та підготовлений архів.
2. `sites.deploy_site_version` для створеної версії.
3. `sites.get_deployment_status` до стану `succeeded` або явної помилки.
4. Відкрити public URL і перевірити головну, `/catalog/`, категорію, товар і
   форму.

Для поточного проєкту Sites project id зберігається в
`.openai/hosting.json`. Токен у цьому файлі не зберігається.

## 5. Важливі межі

- `out/` є локальним результатом `npm run build`, а не Git-джерелом.
- `work/` містить оригінали, референси й архіви та не публікується на Sites.
- Sites — demo/release preview. Production-заявки вмикаються у власному
  Cloudflare Worker, описаному в `docs/CLOUDFLARE_SETUP_UA.md`.
- Якщо проблема повторюється, спочатку перевірити `git tree`, розмір архіву й
  HTTP/1.1 buffer. Force-push не потрібен для нормального сценарію.
