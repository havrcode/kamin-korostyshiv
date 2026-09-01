import assert from "node:assert/strict";
import test from "node:test";
import { calculateInternalEstimate, toClientEstimate } from "../server/estimates/calculator.ts";

const privateBook = {
  version: "test-book-v1",
  currency: "UAH" as const,
  roundingMinor: 1000,
  items: [
    { code: "STONE-A", publicName: "Кам’яна деталь", unit: "шт.", costMinor: 12_345, markupBps: 2500, active: true },
    { code: "WORK-A", publicName: "Обробка", unit: "робота", costMinor: 5_000, markupBps: 4000, active: true },
  ],
};

test("calculates from a private versioned price book and rounds client prices", () => {
  const estimate = calculateInternalEstimate({ items: [{ code: "STONE-A", quantity: 2 }] }, privateBook);
  assert.equal(estimate.costTotalMinor, 24_690);
  assert.equal(estimate.lines[0].clientUnitMinor, 16_000);
  assert.equal(estimate.clientTotalMinor, 32_000);
  assert.equal(estimate.requiresManualReview, false);
});

test("client projection never contains cost or markup fields", () => {
  const internal = calculateInternalEstimate({ items: [{ code: "WORK-A", quantity: 1 }] }, privateBook);
  const client = toClientEstimate(internal);
  const serialized = JSON.stringify(client);
  assert.doesNotMatch(serialized, /cost|markup/i);
  assert.equal(client.totalMinor, internal.clientTotalMinor);
});

test("missing prices require manual review instead of inventing a fallback", () => {
  const estimate = calculateInternalEstimate({ items: [{ code: "UNKNOWN", quantity: 1 }] }, privateBook);
  assert.equal(estimate.lines.length, 0);
  assert.equal(estimate.requiresManualReview, true);
  assert.match(estimate.manualReviewReasons[0], /Немає актуальної/);
});
