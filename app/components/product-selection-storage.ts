export const PRODUCT_SELECTION_CHANGED_EVENT = "kaminchyk:selected-products";
export const PRODUCT_SELECTION_STORAGE_KEY = "kaminchyk:selectedProductIds.v1";

const PRODUCT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;
const MAX_SELECTED_PRODUCTS = 30;

export function normalizeProductIds(productIds: readonly string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawId of productIds) {
    const productId = rawId.trim();
    if (!PRODUCT_ID_PATTERN.test(productId) || seen.has(productId)) continue;
    seen.add(productId);
    normalized.push(productId);
    if (normalized.length >= MAX_SELECTED_PRODUCTS) break;
  }

  return normalized;
}

export function readSelectedProductIds() {
  try {
    const value = window.localStorage.getItem(PRODUCT_SELECTION_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? normalizeProductIds(parsed.filter((item): item is string => typeof item === "string"))
      : [];
  } catch {
    return [];
  }
}

export function writeSelectedProductIds(productIds: readonly string[]) {
  const normalized = normalizeProductIds(productIds);

  try {
    if (normalized.length > 0) {
      window.localStorage.setItem(PRODUCT_SELECTION_STORAGE_KEY, JSON.stringify(normalized));
    } else {
      window.localStorage.removeItem(PRODUCT_SELECTION_STORAGE_KEY);
    }
  } catch {
    // Якщо localStorage недоступний, URL все одно передасть поточний вибір у форму.
  }

  window.dispatchEvent(
    new CustomEvent(PRODUCT_SELECTION_CHANGED_EVENT, { detail: { productIds: normalized } }),
  );

  return normalized;
}
