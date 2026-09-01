"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui-icon";
import { siteConfig } from "../site-config";

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Clipboard timeout")), 600);
        }),
      ]);
      return true;
    } catch {
      // Старі браузери та webview можуть блокувати Clipboard API без відповіді.
    }
  }

  const input = document.createElement("textarea");
  try {
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

export function MessengerLinks({ className = "" }: { className?: string }) {
  const [viberState, setViberState] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyViberNumber() {
    const copied = await copyText(siteConfig.messengers.viber.copyNumber);
    setViberState(copied ? "copied" : "failed");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setViberState("idle"), 2600);
  }

  const viberLabel = viberState === "copied"
    ? "Номер скопійовано"
    : viberState === "failed"
      ? siteConfig.phone.display
      : siteConfig.messengers.viber.label;

  return (
    <div className={`messenger-links ${className}`.trim()} aria-label="Написати в месенджер">
      <a href={siteConfig.messengers.telegram.href} target="_blank" rel="noreferrer">
        <Icon name="telegram" />
        <span>{siteConfig.messengers.telegram.label}</span>
      </a>
      {siteConfig.messengers.viber.href ? (
        <a href={siteConfig.messengers.viber.href} target="_blank" rel="noreferrer">
          <Icon name="viber" />
          <span>{siteConfig.messengers.viber.label}</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void copyViberNumber()}
          aria-label={`Скопіювати номер ${siteConfig.phone.display} для Viber`}
          title="Скопіювати номер для Viber"
        >
          <Icon name="viber" />
          <span>{viberLabel}</span>
        </button>
      )}
    </div>
  );
}
