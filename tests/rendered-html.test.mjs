import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the public contact foundation", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="uk">/);
  assert.match(html, /<title>Kaminchyk/);
  assert.match(html, /https:\/\/kamin-korostyshiv\.dev-mr-serg\.chatgpt\.site\/og-kaminchyk\.jpg/);
  assert.doesNotMatch(html, /localhost:3000/);
  assert.match(html, /href="tel:\+380660570987"/);
  assert.match(html, /\+380 66 057 09 87/);
  assert.match(html, /Kaminchyk-K-full-light\.png/);
  assert.match(html, /href="https:\/\/t\.me\/\+380660570987"/);
  assert.match(html, /href="viber:\/\/chat\?number=%2B380660570987"/);
  assert.match(html, /Швидкий зв’язок/);
  assert.match(html, /Тестовий режим: форма не надсилає й не зберігає персональні дані/);
  assert.doesNotMatch(html, /заявку (?:успішно )?надіслано/i);
  assert.doesNotMatch(html, /challenges\.cloudflare\.com\/turnstile/);
});

test("renders the complete static catalog, products, privacy and admin shell", async () => {
  const catalog = await readFile(new URL("../out/catalog/index.html", import.meta.url), "utf8");
  const product = await readFile(new URL("../out/catalog/rodynni-pamiatnyky/rodynna-na-trokh/index.html", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../out/privacy/index.html", import.meta.url), "utf8");
  const admin = await readFile(new URL("../out/admin/index.html", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../out/sitemap.xml", import.meta.url), "utf8");

  assert.match(catalog, /Візуалізація/);
  assert.match(catalog, /Після прорахунку/);
  assert.match(product, /Родинна «На трьох»/);
  assert.match(product, /prod-family-triple/);
  assert.match(product, /Ручна перевірка/);
  assert.match(privacy, /На публічному Sites серверне надсилання форми вимкнене/);
  assert.match(admin, /Cloudflare Access/);
  assert.match(sitemap, /rodynna-na-trokh/);
});

test("uses a static Next export without Vinext", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const hosting = JSON.parse(
    await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  );

  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(hosting.static.directory, "out");
  assert.equal(packageJson.devDependencies?.vinext, undefined);
  assert.equal(packageJson.devDependencies?.vite, undefined);
  assert.equal(packageJson.devDependencies?.["@cloudflare/vite-plugin"], undefined);
});

test("centers the animated hero facts without a transform conflict", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const heroFactsRule = css.match(/\.hero-facts\s*\{[^}]+\}/)?.[0] ?? "";

  assert.match(heroFactsRule, /inset-inline:\s*0/);
  assert.match(heroFactsRule, /margin-inline:\s*auto/);
  assert.doesNotMatch(heroFactsRule, /translateX/);
});

test("keeps the desktop contact strip compact without changing mobile controls", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const desktopStart = css.indexOf("@media (min-width: 721px)");
  const mobileStart = css.indexOf("@media (max-width: 720px)");
  const desktopCss = css.slice(desktopStart, mobileStart);
  const mobileCss = css.slice(mobileStart);

  assert.notEqual(desktopStart, -1);
  assert.notEqual(mobileStart, -1);
  assert.match(desktopCss, /\.hero-phone small\s*\{\s*display:\s*none/);
  assert.match(desktopCss, /\.floating-contact\s*\{\s*display:\s*none/);
  assert.match(desktopCss, /border-left:\s*1px solid rgba\(255,255,255,\.18\)/);
  assert.match(mobileCss, /\.hero-contact-bar\s*\{\s*width:\s*min\(100%, 360px\)/);
  assert.match(mobileCss, /\.floating-contact\s*\{[^}]*width:\s*50px/);
});
