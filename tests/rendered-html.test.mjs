import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the public contact foundation", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="uk">/);
  assert.match(html, /<title>Камінь Коростишів/);
  assert.match(html, /https:\/\/kamin-korostyshiv\.dev-mr-serg\.chatgpt\.site\/og\.png/);
  assert.doesNotMatch(html, /localhost:3000/);
  assert.match(html, /href="tel:\+380660570987"/);
  assert.match(html, /\+380 66 057 09 87/);
  assert.match(html, /Попередня версія: ця форма ще не надсилає персональні дані/);
  assert.doesNotMatch(html, /заявку (?:успішно )?надіслано/i);
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
