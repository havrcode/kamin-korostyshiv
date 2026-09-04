"use client";

import { useEffect, useState } from "react";

type ProductImageResponse = { ok?: boolean; images?: Array<{ product_id?: string; public_url?: string }> };

let publishedImagesRequest: Promise<Map<string, string>> | null = null;

function requestPublishedImage(productId: string): Promise<string | null> {
  if (!publishedImagesRequest) {
    publishedImagesRequest = fetch("/api/v1/catalog/product-images", {
      headers: { Accept: "application/json" },
    })
    .then(async (response) => {
      if (!response.ok) return new Map();
      const payload = await response.json() as ProductImageResponse;
      const images = new Map<string, string>();
      if (payload.ok) {
        for (const image of payload.images ?? []) {
          if (image.product_id && image.public_url && !images.has(image.product_id)) {
            images.set(image.product_id, image.public_url);
          }
        }
      }
      return images;
    })
      .catch(() => new Map());
  }
  return publishedImagesRequest.then((images) => images.get(productId) ?? null);
}

export function CatalogProductImage({
  alt,
  fallback,
  height,
  loading = "lazy",
  productId,
  width,
}: {
  alt: string;
  fallback: string;
  height: number;
  loading?: "eager" | "lazy";
  productId: string;
  width: number;
}) {
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let mounted = true;
    void requestPublishedImage(productId).then((publishedImage) => {
      if (mounted && publishedImage) setSrc(publishedImage);
    });
    return () => {
      mounted = false;
    };
  }, [productId]);

  // eslint-disable-next-line @next/next/no-img-element -- static fallback and runtime R2 URL share the same responsive frame.
  return <img src={src} alt={alt} width={width} height={height} loading={loading} />;
}
