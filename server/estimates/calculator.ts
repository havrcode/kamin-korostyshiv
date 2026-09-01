export type MoneyMinor = number;

export interface PrivatePriceItem {
  code: string;
  publicName: string;
  unit: string;
  costMinor: MoneyMinor;
  markupBps: number;
  active: boolean;
}

export interface PrivatePriceBook {
  version: string;
  currency: "UAH";
  roundingMinor: number;
  items: readonly PrivatePriceItem[];
}

export interface EstimateRequestedItem {
  code: string;
  quantity: number;
}

export interface EstimateRequest {
  items: readonly EstimateRequestedItem[];
  manualReviewReasons?: readonly string[];
}

export interface InternalEstimateLine {
  code: string;
  publicName: string;
  unit: string;
  quantity: number;
  unitCostMinor: number;
  totalCostMinor: number;
  markupBps: number;
  clientUnitMinor: number;
  clientTotalMinor: number;
}

export interface ClientEstimateLine {
  name: string;
  unit: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface InternalEstimate {
  priceBookVersion: string;
  currency: "UAH";
  costTotalMinor: number;
  clientTotalMinor: number;
  lines: InternalEstimateLine[];
  requiresManualReview: boolean;
  manualReviewReasons: string[];
}

export interface ClientEstimate {
  priceBookVersion: string;
  currency: "UAH";
  totalMinor: number;
  lines: ClientEstimateLine[];
  preliminary: true;
  requiresManualReview: boolean;
  notice: string;
}

function safeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`INVALID_${field}`);
  return value;
}

function roundUp(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function calculateInternalEstimate(
  request: EstimateRequest,
  priceBook: PrivatePriceBook,
): InternalEstimate {
  const roundingMinor = Math.max(1, safeInteger(priceBook.roundingMinor, "ROUNDING"));
  const priceMap = new Map(priceBook.items.filter((item) => item.active).map((item) => [item.code, item]));
  const reasons = [...(request.manualReviewReasons ?? [])];
  const lines: InternalEstimateLine[] = [];

  for (const requested of request.items) {
    if (!Number.isFinite(requested.quantity) || requested.quantity <= 0 || requested.quantity > 10_000) {
      reasons.push(`Некоректна кількість для ${requested.code}`);
      continue;
    }
    const item = priceMap.get(requested.code);
    if (!item) {
      reasons.push(`Немає актуальної закупівельної ціни: ${requested.code}`);
      continue;
    }
    const cost = safeInteger(item.costMinor, "COST");
    const markupBps = safeInteger(item.markupBps, "MARKUP");
    const quantity = Math.round(requested.quantity * 1000) / 1000;
    const clientUnitMinor = roundUp(cost * (1 + markupBps / 10_000), roundingMinor);
    lines.push({
      code: item.code,
      publicName: item.publicName,
      unit: item.unit,
      quantity,
      unitCostMinor: cost,
      totalCostMinor: Math.round(cost * quantity),
      markupBps,
      clientUnitMinor,
      clientTotalMinor: Math.round(clientUnitMinor * quantity),
    });
  }

  return {
    priceBookVersion: priceBook.version,
    currency: priceBook.currency,
    costTotalMinor: lines.reduce((sum, line) => sum + line.totalCostMinor, 0),
    clientTotalMinor: lines.reduce((sum, line) => sum + line.clientTotalMinor, 0),
    lines,
    requiresManualReview: reasons.length > 0,
    manualReviewReasons: reasons,
  };
}

/** Єдина дозволена проєкція кошторису для клієнта. */
export function toClientEstimate(internal: InternalEstimate): ClientEstimate {
  return {
    priceBookVersion: internal.priceBookVersion,
    currency: internal.currency,
    totalMinor: internal.clientTotalMinor,
    lines: internal.lines.map((line) => ({
      name: line.publicName,
      unit: line.unit,
      quantity: line.quantity,
      unitPriceMinor: line.clientUnitMinor,
      totalMinor: line.clientTotalMinor,
    })),
    preliminary: true,
    requiresManualReview: internal.requiresManualReview,
    notice: "Попередній кошторис діє лише після ручної перевірки майстром.",
  };
}
