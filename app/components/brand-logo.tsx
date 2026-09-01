/* eslint-disable @next/next/no-img-element -- використовуємо затверджені PNG без перетворень або повторного кодування. */

import { siteConfig } from "../site-config";

export function BrandLogo({
  tone = "light",
  emblemOnly = false,
  className = "",
}: {
  tone?: "dark" | "light";
  emblemOnly?: boolean;
  className?: string;
}) {
  const src = emblemOnly
    ? tone === "light" ? siteConfig.brand.logo.emblemLight : siteConfig.brand.logo.emblemDark
    : tone === "light" ? siteConfig.brand.logo.light : siteConfig.brand.logo.dark;

  return (
    <img
      className={`brand-logo-image ${emblemOnly ? "is-emblem" : "is-full"} ${className}`.trim()}
      src={src}
      alt={emblemOnly ? `${siteConfig.brand.name} — емблема K` : siteConfig.brand.name}
      width={emblemOnly ? 393 : 1392}
      height={423}
    />
  );
}
