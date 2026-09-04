"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const ORDER_ATTENTION_WAIT_MS = 5000;
const ORDER_ATTENTION_PULSE_MS = 1500;
const ORDER_ATTENTION_SLOT_MS = 1500;
const ORDER_ATTENTION_SLOT_COUNT = 8;

export function ProductInterestControl({ productId, productTitle }: ProductInterestControlProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isOrderPointerOver, setIsOrderPointerOver] = useState(false);
  const [isOrderFocused, setIsOrderFocused] = useState(false);
  const [isOrderAttentionActive, setIsOrderAttentionActive] = useState(false);
  const orderAttentionOffsetMs = useRef<number | null>(null);

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

  useEffect(() => {
    const isOrderHovered = isOrderPointerOver || isOrderFocused;
    if (isOrderHovered) return;

    let pulseTimer: ReturnType<typeof setTimeout> | undefined;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    if (orderAttentionOffsetMs.current === null) {
      orderAttentionOffsetMs.current = Math.floor(Math.random() * ORDER_ATTENTION_SLOT_COUNT) * ORDER_ATTENTION_SLOT_MS;
    }

    function schedulePulse(delayMs: number) {
      pulseTimer = setTimeout(() => {
        setIsOrderAttentionActive(true);
        resetTimer = setTimeout(() => {
          setIsOrderAttentionActive(false);
          schedulePulse(ORDER_ATTENTION_WAIT_MS);
        }, ORDER_ATTENTION_PULSE_MS);
      }, delayMs);
    }

    schedulePulse(ORDER_ATTENTION_WAIT_MS + orderAttentionOffsetMs.current);
    return () => {
      if (pulseTimer) clearTimeout(pulseTimer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [isOrderFocused, isOrderPointerOver]);

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
      <a
        className={`product-order-link ${isOrderAttentionActive ? "is-attention" : ""}`}
        href={checkoutHref}
        onBlur={() => setIsOrderFocused(false)}
        onClick={prepareCheckout}
        onFocus={() => {
          setIsOrderAttentionActive(false);
          setIsOrderFocused(true);
        }}
        onMouseEnter={() => {
          setIsOrderAttentionActive(false);
          setIsOrderPointerOver(true);
        }}
        onMouseLeave={() => setIsOrderPointerOver(false)}
      >
        Оформлення
      </a>
    </>
  );
}
