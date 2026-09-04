import type { CatalogProduct } from "../data/catalog";
import { getCategoryById } from "../data/catalog";
import { ProductInterestControl } from "./product-interest-control";
import { CatalogProductImage } from "./catalog-product-image";
import { Icon } from "./ui-icon";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const category = getCategoryById(product.categoryId);
  if (!category) return null;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <a className="product-image" href={`/catalog/${category.slug}/${product.slug}/`}>
          <CatalogProductImage productId={product.id} fallback={product.image} alt={product.imageAlt} width={1200} height={800} />
          {product.visualization && <span>Візуалізація</span>}
        </a>
        <ProductInterestControl productId={product.id} productTitle={product.title} />
      </div>
      <div className="product-card-copy">
        <p>{category.title}</p>
        <h2><a href={`/catalog/${category.slug}/${product.slug}/`}>{product.title}</a></h2>
        <span>{product.summary}</span>
        <div><b>{product.priceLabel}</b><a href={`/catalog/${category.slug}/${product.slug}/`} aria-label={`Докладніше: ${product.title}`}><Icon name="arrow" /></a></div>
      </div>
    </article>
  );
}
