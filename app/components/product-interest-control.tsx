"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "./ui-icon";
import {
  PRODUCT_SELECTION_CHANGED_EVENT,
  normalizeProductIds,
  readSelectedProductIds,
  writeSelectedProductIds,
} from "./product-selection-storage";

type ProductInterestControlProps = {
  productId: string;
  productTitle: string;
};

export function ProductInterestControl({ productId, productTitle }: ProductInterestControlProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSelectedProductIds(readSelectedProductIds());
    });

    function syncSelection(event: Event) {
      const detail = (event as CustomEvent<{ productIds?: string[] }>).detail;
      setSelectedProductIds(normalizeProductIds(detail?.productIds ?? readSelectedProductIds()));
    }

    window.addEventListener(PRODUCT_SELECTION_CHANGED_EVENT, syncSelection);
    window.addEventListener("storage", syncSelection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(PRODUCT_SELECTION_CHANGED_EVENT, syncSelection);
      window.removeEventListener("storage", syncSelection);
    };
  }, []);

  const isSelected = selectedProductIds.includes(productId);
  const checkoutProductIds = useMemo(
    () => normalizeProductIds(isSelected ? selectedProductIds : [...selectedProductIds, productId]),
    [isSelected, productId, selectedProductIds],
  );
  const checkoutHref = `/?productIds=${encodeURIComponent(checkoutProductIds.join(","))}#contact`;

  function toggleSelection() {
    const nextProductIds = isSelected
      ? selectedProductIds.filter((item) => item !== productId)
      : [...selectedProductIds, productId];
    setSelectedProductIds(writeSelectedProductIds(nextProductIds));
  }

  function prepareCheckout() {
    setSelectedProductIds(writeSelectedProductIds(checkoutProductIds));
  }

  return (
    <>
      <button
        className={`product-interest-toggle ${isSelected ? "is-selected" : ""}`}
        type="button"
        aria-pressed={isSelected}
        aria-label={isSelected ? `Прибрати з оформлення: ${productTitle}` : `Додати до оформлення: ${productTitle}`}
        title={isSelected ? "Обрано" : "Додати до оформлення"}
        onClick={toggleSelection}
      >
        <Icon name={isSelected ? "check" : "plus"} />
      </button>
      <a className="product-order-link" href={checkoutHref} onClick={prepareCheckout}>
        Оформлення
      </a>
    </>
  );
}
