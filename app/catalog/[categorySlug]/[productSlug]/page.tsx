import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogShell } from "../../../components/catalog-shell";
import { ProductInterestControl } from "../../../components/product-interest-control";
import { CatalogProductImage } from "../../../components/catalog-product-image";
import { StructuredData } from "../../../components/structured-data";
import { Icon } from "../../../components/ui-icon";
import { deliveryOptions, getCategory, getProduct, getProductSeoProfile, publishedCategories, publishedProducts } from "../../../data/catalog";
import { siteConfig } from "../../../site-config";

export function generateStaticParams() {
  return publishedProducts.flatMap((product) => {
    const category = publishedCategories.find((item) => item.id === product.categoryId);
    return category ? [{ categorySlug: category.slug, productSlug: product.slug }] : [];
  });
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; productSlug: string }> }): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const category = getCategory(categorySlug);
  const product = category && getProduct(category.id, productSlug);
  if (!category || !product) return {};
  const seo = getProductSeoProfile(product);
  const description = seo.description;
  return {
    title: `${seo.title} — Kaminchyk`,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/catalog/${category.slug}/${product.slug}/` },
    openGraph: {
      title: `${seo.title} — Kaminchyk`,
      description,
      url: `/catalog/${category.slug}/${product.slug}/`,
      images: [{ url: product.image, width: 1200, height: 800, alt: product.imageAlt }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ categorySlug: string; productSlug: string }> }) {
  const { categorySlug, productSlug } = await params;
  const category = getCategory(categorySlug);
  const product = category && getProduct(category.id, productSlug);
  if (!category || !product) notFound();
  const interest = `${product.shortTitle} — ${product.title}`;
  const productUrl = `/catalog/${category.slug}/${product.slug}/`;
  const siteUrl = siteConfig.publicUrl;
  const productStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${new URL(productUrl, siteUrl).toString()}#product`,
        name: product.title,
        alternateName: getProductSeoProfile(product).alternateNames,
        description: product.description,
        inLanguage: "uk-UA",
        image: [new URL(product.image, siteUrl).toString()],
        sku: product.id,
        brand: { "@type": "Brand", name: siteConfig.brand.name },
        category: category.title,
        material: product.materials,
        url: new URL(productUrl, siteUrl).toString(),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Каталог", item: new URL("/catalog/", siteUrl).toString() },
          { "@type": "ListItem", position: 2, name: category.title, item: new URL(`/catalog/${category.slug}/`, siteUrl).toString() },
          { "@type": "ListItem", position: 3, name: product.title, item: new URL(productUrl, siteUrl).toString() },
        ],
      },
    ],
  };

  return (
    <CatalogShell categoryNav={{ activeSlug: category.slug }}>
      <StructuredData data={productStructuredData} />
      <article className="product-detail content-wrap">
        <nav aria-label="Хлібні крихти"><Link href="/catalog/">Каталог</Link><span>→</span><Link href={`/catalog/${category.slug}/`}>{category.title}</Link><span>→</span><span>{product.title}</span></nav>
        <div className="product-detail-grid">
          <figure><CatalogProductImage productId={product.id} fallback={product.image} alt={product.imageAlt} width={1200} height={800} loading="eager" /><ProductInterestControl productId={product.id} productTitle={product.title} />{product.visualization && <figcaption>Візуалізація концепції</figcaption>}</figure>
          <div className="product-detail-copy">
            <p className="eyebrow"><span></span>{category.title}</p>
            <h1>{product.title}</h1>
            <p className="product-summary">{product.summary}</p>
            <p>{product.description}</p>
            <div className="quote-label"><small>Режим ціни</small><b>{product.priceLabel}</b><span>Без вигаданих цифр до погодження матеріалів і розмірів</span></div>
            <a className="button dark" href={`/?interest=${encodeURIComponent(interest)}&productIds=${product.id}#contact`}>Мене цікавить цей виріб <Icon name="arrow" /></a>
          </div>
        </div>
        <div className="product-specs">
          <section><h2>Можливі матеріали</h2><ul>{product.materials.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>
          <section><h2>Що можна змінити</h2><ul>{product.options.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>
          <section><h2>Доставка</h2><ul>{deliveryOptions.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>
          {product.requiresManualReview && <section className="review-card"><h2>Ручна перевірка</h2><p>Майстер окремо підтверджує розміри, товщини, сумісність деталей, художнє оформлення, доступ до ділянки, доставку й монтаж.</p></section>}
        </div>
      </article>
    </CatalogShell>
  );
}
