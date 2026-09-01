/* eslint-disable @next/next/no-img-element -- WebP-файли вже оптимізовані для статичного export. */

import type { CatalogProduct } from "../data/catalog";
import { getCategoryById } from "../data/catalog";
import { Icon } from "./ui-icon";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const category = getCategoryById(product.categoryId);
  if (!category) return null;

  return (
    <article className="product-card">
      <a className="product-image" href={`/catalog/${category.slug}/${product.slug}/`}>
        <img src={product.image} alt={product.imageAlt} width="1200" height="800" loading="lazy" />
        {product.visualization && <span>Візуалізація</span>}
      </a>
      <div className="product-card-copy">
        <p>{category.title}</p>
        <h2><a href={`/catalog/${category.slug}/${product.slug}/`}>{product.title}</a></h2>
        <span>{product.summary}</span>
        <div><b>{product.priceLabel}</b><a href={`/catalog/${category.slug}/${product.slug}/`} aria-label={`Докладніше: ${product.title}`}><Icon name="arrow" /></a></div>
      </div>
    </article>
  );
}
