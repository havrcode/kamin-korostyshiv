import assert from "node:assert/strict";
import test from "node:test";
import { categories, interestOptions, products, publishedCategories, publishedProducts, resolveProductSelection, resolveProductSelections } from "../app/data/catalog.ts";

test("resolves a product into a valid category option and a separate snapshot", () => {
  const selection = resolveProductSelection(
    "prod-table-bench-1",
    "Стіл з лавкою № 1",
  );

  assert.ok(selection);
  assert.equal(selection.productId, "prod-table-bench-1");
  assert.equal(selection.categoryValue, "Стіл або лавка з граніту");
  assert.ok(interestOptions.includes(selection.categoryValue));
  assert.match(selection.label, /Стіл з лавкою № 1/);
});

test("rejects an unknown product instead of trusting the URL", () => {
  assert.equal(resolveProductSelection("prod-invented", "Вигаданий товар"), null);
});

test("summarizes several selected products for one lead", () => {
  const selection = resolveProductSelections([
    "prod-table-2",
    "prod-bench-2",
    "prod-table-2",
    "prod-invented",
  ]);

  assert.ok(selection);
  assert.deepEqual(selection.productIds, ["prod-table-2", "prod-bench-2"]);
  assert.equal(selection.primaryProductId, "prod-table-2");
  assert.equal(selection.categoryValue, "Стіл або лавка з граніту");
  assert.equal(selection.label, "Оформлення: 2 товари");
  assert.match(selection.messageLine, /Столи та лавки: Стіл № 2/);
  assert.match(selection.messageLine, /Столи та лавки: Лавка № 2/);
});

test("exposes only explicitly published catalog records", () => {
  assert.ok(categories.every((category) => typeof category.published === "boolean"));
  assert.ok(products.every((product) => typeof product.published === "boolean"));
  assert.deepEqual(publishedCategories, categories.filter((category) => category.published));
  assert.ok(publishedProducts.every((product) => product.published));
  assert.ok(publishedProducts.every((product) => publishedCategories.some((category) => category.id === product.categoryId)));
  assert.equal(publishedCategories.length, 5);
  assert.equal(publishedProducts.length, 38);
  assert.equal(resolveProductSelection("prod-family-triple", "Родинна «На трьох»"), null);
  assert.ok(publishedProducts.some((product) => product.id === "prod-bathroom-countertop"));
  assert.ok(publishedProducts.some((product) => product.id === "prod-fireplace-mantel"));
  assert.ok(publishedProducts.some((product) => product.id === "prod-stone-backsplash"));
  assert.ok(!publishedCategories.some((category) => /пам’ятник|Меморіальні/.test(category.title)));
});
