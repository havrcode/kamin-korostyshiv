import type { MetadataRoute } from "next";
import { publishedCategories, publishedProducts } from "./data/catalog";
import { siteConfig } from "./site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-02T00:00:00Z");
  const entries: MetadataRoute.Sitemap = [
    { url: siteConfig.publicUrl, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.publicUrl}/catalog/`, lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.publicUrl}/privacy/`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const category of publishedCategories) {
    entries.push({ url: `${siteConfig.publicUrl}/catalog/${category.slug}/`, lastModified: updated, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const product of publishedProducts) {
    const category = publishedCategories.find((item) => item.id === product.categoryId);
    if (category) entries.push({ url: `${siteConfig.publicUrl}/catalog/${category.slug}/${product.slug}/`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 });
  }
  return entries;
}
