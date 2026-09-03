import type { CSSProperties } from "react";
import Link from "next/link";
import { getProductsByCategory, publishedCategories } from "../data/catalog";

export type CategoryVisualNavProps = {
  activeSlug?: string;
  linkMode?: "anchors" | "pages";
};

export function CategoryVisualNav({ activeSlug, linkMode = "pages" }: CategoryVisualNavProps) {
  return (
    <nav className="catalog-category-nav content-wrap" aria-label="Категорії каталогу">
      {publishedCategories.map((category) => {
        const isActive = category.slug === activeSlug;
        const href = linkMode === "anchors" ? `#${category.slug}` : `/catalog/${category.slug}/`;

        return (
          <Link
            className={isActive ? "is-active" : undefined}
            href={href}
            key={category.id}
            aria-current={isActive ? "page" : undefined}
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
