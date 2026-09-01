/* eslint-disable @next/next/no-img-element -- Оптимізований WebP потрібен статичному export. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogShell } from "../../../components/catalog-shell";
import { Icon } from "../../../components/ui-icon";
import { categories, getCategory, getProduct, products } from "../../../data/catalog";

export function generateStaticParams() {
  return products.flatMap((product) => {
    const category = categories.find((item) => item.id === product.categoryId);
    return category ? [{ categorySlug: category.slug, productSlug: product.slug }] : [];
  });
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string; productSlug: string }> }): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const category = getCategory(categorySlug);
  const product = category && getProduct(category.id, productSlug);
  if (!category || !product) return {};
  return {
    title: `${product.title} — Камінь Коростишів`,
    description: product.summary,
    alternates: { canonical: `/catalog/${category.slug}/${product.slug}/` },
    openGraph: { title: product.title, description: product.summary, images: [{ url: product.image, width: 1200, height: 800, alt: product.imageAlt }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ categorySlug: string; productSlug: string }> }) {
  const { categorySlug, productSlug } = await params;
  const category = getCategory(categorySlug);
  const product = category && getProduct(category.id, productSlug);
  if (!category || !product) notFound();
  const interest = `${product.shortTitle} — ${product.title}`;

  return (
    <CatalogShell>
      <article className="product-detail content-wrap">
        <nav aria-label="Хлібні крихти"><Link href="/catalog/">Каталог</Link><span>→</span><Link href={`/catalog/${category.slug}/`}>{category.title}</Link><span>→</span><span>{product.title}</span></nav>
        <div className="product-detail-grid">
          <figure><img src={product.image} alt={product.imageAlt} width="1200" height="800" />{product.visualization && <figcaption>Візуалізація концепції · не фотографія виконаної роботи</figcaption>}</figure>
          <div className="product-detail-copy">
            <p className="eyebrow"><span></span>{category.title}</p>
            <h1>{product.title}</h1>
            <p className="product-summary">{product.summary}</p>
            <p>{product.description}</p>
            <div className="quote-label"><small>Режим ціни</small><b>{product.priceLabel}</b><span>Без вигаданих цифр до погодження матеріалів і розмірів</span></div>
            <a className="button dark" href={`/?interest=${encodeURIComponent(interest)}&productId=${product.id}#contact`}>Мене цікавить цей виріб <Icon name="arrow" /></a>
          </div>
        </div>
        <div className="product-specs">
          <section><h2>Можливі матеріали</h2><ul>{product.materials.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>
          <section><h2>Що можна змінити</h2><ul>{product.options.map((item) => <li key={item}><Icon name="check" />{item}</li>)}</ul></section>
          <section className="review-card"><h2>Ручна перевірка</h2><p>Майстер окремо підтверджує розміри, товщини, сумісність деталей, художнє оформлення, доступ до ділянки, доставку й монтаж.</p></section>
        </div>
      </article>
    </CatalogShell>
  );
}
