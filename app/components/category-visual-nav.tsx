"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getProductsByCategory, publishedCategories } from "../data/catalog";

export type CategoryVisualNavProps = {
  activeSlug?: string;
  linkMode?: "anchors" | "pages";
};

export function CategoryVisualNav({ activeSlug, linkMode = "pages" }: CategoryVisualNavProps) {
  const [currentSlug, setCurrentSlug] = useState(activeSlug ?? (linkMode === "anchors" ? publishedCategories[0]?.slug ?? "" : ""));
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    if (!activeSlug) return;
    const frame = window.requestAnimationFrame(() => setCurrentSlug(activeSlug));
    return () => window.cancelAnimationFrame(frame);
  }, [activeSlug]);

  useEffect(() => {
    if (linkMode !== "anchors") return;

    let frame = 0;

    function updateActiveCategory() {
      const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      let nextSlug = publishedCategories[0]?.slug ?? "";

      for (const category of publishedCategories) {
        const section = document.getElementById(category.slug);
        if (!section) continue;
        if (section.getBoundingClientRect().top <= navBottom + 88) {
          nextSlug = category.slug;
        }
      }

      setCurrentSlug(nextSlug);
    }

    function queueUpdate() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveCategory);
    }

    queueUpdate();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [linkMode]);

  useEffect(() => {
    if (!currentSlug) return;
    linkRefs.current.get(currentSlug)?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [currentSlug]);

  return (
    <nav ref={navRef} className="catalog-category-nav content-wrap" aria-label="Категорії каталогу">
      {publishedCategories.map((category) => {
        const isActive = category.slug === currentSlug;
        const href = linkMode === "anchors" ? `#${category.slug}` : `/catalog/${category.slug}/`;

        return (
          <Link
            className={isActive ? "is-active" : undefined}
            href={href}
            key={category.id}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setCurrentSlug(category.slug)}
            ref={(element) => {
              if (element) {
                linkRefs.current.set(category.slug, element);
              } else {
                linkRefs.current.delete(category.slug);
              }
            }}
            style={{
              "--category-position": category.imagePosition,
              "--category-mobile-position": category.mobileImagePosition,
            } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static export already serves prepared WebP thumbnails. */}
            <img src={category.image} alt="" width="160" height="110" loading="lazy" />
            <span>
              <b>{category.title}</b>
              <small>{getProductsByCategory(category.id).length} позицій</small>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
