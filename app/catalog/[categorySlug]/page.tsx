import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogShell } from "../../components/catalog-shell";
import { ProductCard } from "../../components/product-card";
import { StructuredData } from "../../components/structured-data";
import { getCategory, getProductsByCategory, publishedCategories } from "../../data/catalog";
import { siteConfig } from "../../site-config";

export function generateStaticParams() {
  return publishedCategories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) return {};
  const description = `${category.text}. Виготовлення, доставка та монтаж виробів із натурального каменю в Коростишеві.`;
  return {
    title: `${category.title} — каталог Kaminchyk`,
    description,
    alternates: { canonical: `/catalog/${category.slug}/` },
    openGraph: {
      title: `${category.title} — Kaminchyk`,
      description,
      url: `/catalog/${category.slug}/`,
      images: [{ url: category.image, width: 1200, height: 800, alt: category.title }],
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = getCategory(categorySlug);
  if (!category) notFound();
  const categoryProducts = getProductsByCategory(category.id);
  const categoryUrl = `/catalog/${category.slug}/`;
  const siteUrl = siteConfig.publicUrl;
  const categoryStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}${categoryUrl}#page`,
        url: new URL(categoryUrl, siteUrl).toString(),
        name: category.title,
        description: category.text,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: categoryProducts.length,
          itemListElement: categoryProducts.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            url: new URL(`${categoryUrl}${product.slug}/`, siteUrl).toString(),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Каталог", item: new URL("/catalog/", siteUrl).toString() },
          { "@type": "ListItem", position: 2, name: category.title, item: new URL(categoryUrl, siteUrl).toString() },
        ],
      },
    ],
  };

  return (
    <CatalogShell categoryNav={{ activeSlug: category.slug }}>
      <StructuredData data={categoryStructuredData} />
      <section className="category-masthead content-wrap">
        <nav aria-label="Хлібні крихти"><Link href="/catalog/">Каталог</Link><span>→</span><span>{category.title}</span></nav>
        <p className="eyebrow"><span></span>{category.tag}</p>
        <h1>{category.title}</h1>
        <p>{category.text}. Кожен варіант є відправною точкою: форму, пропорції, матеріал і комплектацію можна змінювати після консультації.</p>
      </section>
      <section className="content-wrap category-products">
        <div className="product-grid">{categoryProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
      </section>
      <section className="manual-review content-wrap"><div><b>Чому потрібне ручне уточнення</b><p>Навантаження, сумісність стели й підставки, товщини, фундамент, стан ділянки, доставка, підйом і монтаж не можна безпечно визначити лише за фотографією.</p></div><a className="button dark" href={`/?interest=${encodeURIComponent(category.formValue)}#contact`}>Обговорити категорію</a></section>
    </CatalogShell>
  );
}
