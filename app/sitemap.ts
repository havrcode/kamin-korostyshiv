import type { MetadataRoute } from "next";
import { publishedCategories, publishedProducts } from "./data/catalog";
import { siteConfig } from "./site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-05T00:00:00Z");
  const absoluteUrl = (path: string) => new URL(path, siteConfig.publicUrl).toString();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/catalog/"), lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/privacy/"), lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const category of publishedCategories) {
    entries.push({
      url: absoluteUrl(`/catalog/${category.slug}/`),
      lastModified: updated,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [absoluteUrl(category.image)],
    });
  }
  for (const product of publishedProducts) {
    const category = publishedCategories.find((item) => item.id === product.categoryId);
    if (category) {
      entries.push({
        url: absoluteUrl(`/catalog/${category.slug}/${product.slug}/`),
        lastModified: updated,
        changeFrequency: "monthly",
        priority: 0.7,
        images: [absoluteUrl(product.image)],
      });
    }
  }
  return entries;
}
