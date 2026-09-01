import assert from "node:assert/strict";
import test from "node:test";
import { interestOptions, resolveProductSelection } from "../app/data/catalog.ts";

test("resolves a product into a valid category option and a separate snapshot", () => {
  const selection = resolveProductSelection(
    "prod-family-triple",
    "Композиція на три портрети — Родинна «На трьох»",
  );

  assert.ok(selection);
  assert.equal(selection.productId, "prod-family-triple");
  assert.equal(selection.categoryValue, "Подвійний або родинний пам’ятник");
  assert.ok(interestOptions.includes(selection.categoryValue));
  assert.match(selection.label, /Родинна «На трьох»/);
});

test("rejects an unknown product instead of trusting the URL", () => {
  assert.equal(resolveProductSelection("prod-invented", "Вигаданий товар"), null);
});
