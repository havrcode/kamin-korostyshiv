import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell } from "../components/catalog-shell";
import { ProductCard } from "../components/product-card";
import { StructuredData } from "../components/structured-data";
import { getProductsByCategory, publishedCategories } from "../data/catalog";
import { siteConfig } from "../site-config";

export const metadata: Metadata = {
  title: "Каталог виробів із граніту та мармуру — Kaminchyk",
  description: siteConfig.description,
  alternates: { canonical: "/catalog/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Каталог виробів із граніту та мармуру — Kaminchyk",
    description: siteConfig.description,
    url: "/catalog/",
  },
};

export default function CatalogPage() {
  const siteUrl = siteConfig.publicUrl;
  const catalogStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/catalog/#page`,
    url: new URL("/catalog/", siteUrl).toString(),
    name: metadata.title,
    inLanguage: "uk-UA",
    description: siteConfig.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: publishedCategories.length,
      itemListElement: publishedCategories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.title,
        image: new URL(category.image, siteUrl).toString(),
        url: new URL(`/catalog/${category.slug}/`, siteUrl).toString(),
      })),
    },
  };

  return (
    <CatalogShell categoryNav={{ linkMode: "anchors" }}>
      <StructuredData data={catalogStructuredData} />
      <section className="catalog-masthead content-wrap">
        <p className="eyebrow"><span></span>Каталог напрямків</p>
        <h1>Вироби з каменю<br />без <em>вигаданих цін.</em></h1>
        <p>Оберіть готовий напрямок як основу. Розміри, камінь, обробку, доставку й монтаж майстер уточнить перед кошторисом.</p>
        <aside><b>Важливо</b><span>{siteConfig.catalogNotice} Для кожної позиції вартість уточнюється у продавця.</span></aside>
      </section>

      {publishedCategories.map((category) => {
        const categoryProducts = getProductsByCategory(category.id);
        return (
          <section className="catalog-group content-wrap" id={category.slug} key={category.id}>
            <header>
              <div><p className="eyebrow"><span></span>{category.tag}</p><h2>{category.title}</h2></div>
              <div><p>{category.text}</p><a className="text-link" href={`/catalog/${category.slug}/`}>Уся категорія</a></div>
            </header>
            <div className="product-grid">{categoryProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
          </section>
        );
      })}

      <section className="catalog-cta">
        <div className="content-wrap"><div><p className="eyebrow light"><span></span>Не знайшли точну форму?</p><h2>Почнемо з вашого<br /><em>ескізу або прикладу.</em></h2></div><div><p>Опишіть задачу, а майстер допоможе вибрати конструкцію й матеріал без поспішних рішень.</p><Link className="button primary" href="/#contact">Запросити прорахунок</Link></div></div>
      </section>
    </CatalogShell>
  );
}
