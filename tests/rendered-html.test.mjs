import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the public contact foundation", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();

  assert.match(html, /<html lang="uk">/);
  assert.match(html, /<title>Камінь Коростишів/);
  assert.match(html, /href="tel:\+380660570987"/);
  assert.match(html, /\+380 66 057 09 87/);
  assert.match(html, /Попередня версія: ця форма ще не надсилає персональні дані/);
  assert.doesNotMatch(html, /заявку (?:успішно )?надіслано/i);
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
