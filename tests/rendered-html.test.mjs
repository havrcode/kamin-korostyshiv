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
  assert.match(html, /visual-decor\.webp/);
  assert.match(html, /visual-home-interior-v2\.webp/);
  assert.match(html, /visual-lamps\.webp/);
  assert.match(html, /visual-table-bench-v2\.webp/);
  assert.match(html, /visual-vases\.webp/);
  assert.match(html, /href="https:\/\/t\.me\/\+380660570987"/);
  assert.doesNotMatch(html, /viber:\/\/chat\?number=/);
  assert.match(html, /Скопіювати номер \+380 66 057 09 87 для Viber/);
  assert.match(html, /Швидкий зв’язок/);
  assert.match(html, /Тестовий режим: форма не надсилає й не зберігає персональні дані/);
  assert.doesNotMatch(html, /заявку (?:успішно )?надіслано/i);
  assert.doesNotMatch(html, /challenges\.cloudflare\.com\/turnstile/);
});

test("renders the complete static catalog, products, privacy and admin shell", async () => {
  const catalog = await readFile(new URL("../out/catalog/index.html", import.meta.url), "utf8");
  const tables = await readFile(new URL("../out/catalog/stoly-ta-lavky/index.html", import.meta.url), "utf8");
  const product = await readFile(new URL("../out/catalog/stoly-ta-lavky/stil-z-lavkoiu-1/index.html", import.meta.url), "utf8");
  const lamps = await readFile(new URL("../out/catalog/lampadky/index.html", import.meta.url), "utf8");
  const lamp = await readFile(new URL("../out/catalog/lampadky/lampadka-6/index.html", import.meta.url), "utf8");
  const vases = await readFile(new URL("../out/catalog/vazy/index.html", import.meta.url), "utf8");
  const vase = await readFile(new URL("../out/catalog/vazy/vaza-6/index.html", import.meta.url), "utf8");
  const decor = await readFile(new URL("../out/catalog/dekor-z-kameniu/index.html", import.meta.url), "utf8");
  const decorProduct = await readFile(new URL("../out/catalog/dekor-z-kameniu/baliasyna-1/index.html", import.meta.url), "utf8");
  const home = await readFile(new URL("../out/catalog/kamin-dlia-domu/index.html", import.meta.url), "utf8");
  const homeProduct = await readFile(new URL("../out/catalog/kamin-dlia-domu/stilnytsia-z-vyrizom/index.html", import.meta.url), "utf8");
  const bathroomProduct = await readFile(new URL("../out/catalog/kamin-dlia-domu/stilnytsia-u-vannu/index.html", import.meta.url), "utf8");
  const backsplashProduct = await readFile(new URL("../out/catalog/kamin-dlia-domu/kamianyi-fartukh/index.html", import.meta.url), "utf8");
  const privacy = await readFile(new URL("../out/privacy/index.html", import.meta.url), "utf8");
  const admin = await readFile(new URL("../out/admin/index.html", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../out/sitemap.xml", import.meta.url), "utf8");

  assert.match(catalog, /Візуалізація/);
  assert.match(catalog, /catalog-category-nav/);
  assert.match(catalog, /href="#stoly-ta-lavky"/);
  assert.match(catalog, /Камінь для дому/);
  assert.match(catalog, /Вартість уточнюється/);
  assert.match(catalog, /Столи та лавки/);
  assert.match(catalog, /Лампадка № 6/);
  assert.match(catalog, /Ваза № 6/);
  assert.match(catalog, /Підвіконня пряме/);
  assert.match(catalog, /Стільниця з вирізом/);
  assert.match(catalog, /Стільниця у ванну/);
  assert.match(catalog, /Камінна полиця/);
  assert.match(catalog, /Кам’яний фартух/);
  assert.doesNotMatch(catalog, /Одинарні пам’ятники|Родинні пам’ятники|Меморіальні комплекси/);
  for (const image of [
    "stil-z-lavkoiu-1.webp",
    "stil-z-lavkoiu-2.webp",
    "stil-z-lavkoiu-3.webp",
    "stil-z-lavkoiu-4.webp",
    "stil-z-lavkoiu-5.webp",
    "stil-1.webp",
    "stil-2.webp",
    "stil-3.webp",
    "stil-4.webp",
    "lavka-1.webp",
    "lavka-2.webp",
    "lavka-3.webp",
    "lavka-4.webp",
    "lavka-5.webp",
  ]) {
    assert.match(tables, new RegExp(`/products/table-benches/${image}`));
  }
  for (const image of [
    "lampadka-1-black.webp",
    "lampadka-1-bronze.webp",
    "lampadka-1-gray.webp",
    "lampadka-2.webp",
    "lampadka-3.webp",
    "lampadka-4.webp",
    "lampadka-6.webp",
  ]) {
    assert.match(lamps, new RegExp(`/products/lamps/${image}`));
  }
  assert.match(lamp, /\/products\/lamps\/lampadka-6\.webp/);
  assert.match(lamp, /prod-lamp-6/);
  for (const image of ["vaza-1.webp", "vaza-2.webp", "vaza-3.webp", "vaza-4.webp", "vaza-5.webp", "vaza-6.webp"]) {
    assert.match(vases, new RegExp(`/products/vases/${image}`));
  }
  assert.match(vase, /\/products\/vases\/vaza-6\.webp/);
  assert.match(vase, /prod-vase-6/);
  assert.match(decor, /\/products\/decor\/baliasyna-1\.webp/);
  assert.match(decor, /\/products\/decor\/kulia-1\.webp/);
  assert.match(decorProduct, /\/products\/decor\/baliasyna-1\.webp/);
  assert.match(decorProduct, /prod-baluster-1/);
  for (const image of [
    "pidvikonnia-priame.webp",
    "pidvikonnia-zaokruhlene.webp",
    "pidvikonnia-z-profilem.webp",
    "stilnytsia-priama.webp",
    "stilnytsia-z-vyrizom.webp",
    "stilnytsia-kutova.webp",
    "stilnytsia-u-vannu.webp",
    "kaminna-polytsia.webp",
    "kamianyi-fartukh.webp",
  ]) {
    assert.match(home, new RegExp(`/products/home/${image}`));
  }
  assert.match(homeProduct, /\/products\/home\/stilnytsia-z-vyrizom\.webp/);
  assert.match(homeProduct, /prod-countertop-sink/);
  assert.match(bathroomProduct, /\/products\/home\/stilnytsia-u-vannu\.webp/);
  assert.match(bathroomProduct, /prod-bathroom-countertop/);
  assert.match(backsplashProduct, /\/products\/home\/kamianyi-fartukh\.webp/);
  assert.match(backsplashProduct, /prod-stone-backsplash/);
  assert.match(product, /Стіл з лавкою № 1/);
  assert.match(product, /catalog-category-nav/);
  assert.match(product, /aria-current="page"/);
  assert.match(product, /\/products\/table-benches\/stil-z-lavkoiu-1\.webp/);
  assert.match(product, /prod-table-bench-1/);
  assert.match(product, /productIds=prod-table-bench-1#contact/);
  assert.match(product, /Оформлення/);
  assert.match(product, /Ручна перевірка/);
  assert.match(tables, /aria-label="Додати до оформлення: Стіл № 2"/);
  assert.match(tables, /catalog-category-nav/);
  assert.match(tables, /href="\/catalog\/vazy\/"/);
  assert.match(tables, /productIds=prod-table-2#contact/);
  assert.match(tables, /Оформлення/);
  assert.match(privacy, /На публічному Sites серверне надсилання форми вимкнене/);
  assert.match(admin, /Cloudflare Access/);
  assert.match(sitemap, /stil-z-lavkoiu-1/);
  assert.match(sitemap, /stilnytsia-u-vannu/);
  assert.match(sitemap, /kamianyi-fartukh/);
  assert.doesNotMatch(sitemap, /odynarni-pamiatnyky|rodynni-pamiatnyky|memorialni-kompleksy/);
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

test("locks the hero line breaks and uses responsive category focal points", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /hero-memorial\.webp/);
  assert.match(
    html,
    /Майстерність<\/em><br\/><span class="hero-detail-line">у деталях\.<\/span>/,
  );
  assert.match(html, /--category-position:50% 50%/);
  assert.match(html, /--category-mobile-position:50% 50%/);
  assert.match(css, /object-position:\s*var\(--category-position/);
  assert.match(css, /object-position:\s*var\(--category-mobile-position/);
  assert.match(css, /min-height:\s*350px/);
});

test("keeps messenger controls consistent and balances the desktop footer", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.messenger-links :is\(a, button\)/);
  assert.match(css, /\.footer-actions\s*\{[^}]*justify-self:\s*start/);
  assert.match(css, /grid-template-columns:\s*minmax\(210px, \.78fr\)/);
});
