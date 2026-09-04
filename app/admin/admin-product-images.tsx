"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { publishedProducts } from "../data/catalog";

type ProductImage = {
  id: string;
  public_url: string;
  alt: string | null;
  sort_order: number;
  published: boolean;
  width: number;
  height: number;
  original_bytes: number;
  created_at: number;
};

const imageProducts = publishedProducts.map((product) => ({ id: product.id, title: product.title }));

function responseError(payload: unknown): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { code?: unknown } }).error;
    if (typeof error?.code === "string") return error.code;
  }
  return "MEDIA_REQUEST_FAILED";
}

export function AdminProductImages() {
  const [productId, setProductId] = useState(imageProducts[0]?.id ?? "");
  const [images, setImages] = useState<ProductImage[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [files, setFiles] = useState<File[]>([]);
  const [publish, setPublish] = useState(false);
  const [focusY, setFocusY] = useState("50");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadImages = useCallback(async () => {
    if (!productId) return;
    setState("loading");
    try {
      const response = await fetch(`/api/v1/admin/product-images?productId=${encodeURIComponent(productId)}`, {
        headers: { Accept: "application/json" },
      });
      const payload = await response.json() as { ok?: boolean; images?: ProductImage[] };
      if (!response.ok || !payload.ok || !payload.images) {
        setState(response.status === 404 || response.status === 503 ? "unavailable" : "error");
        return;
      }
      setImages(payload.images);
      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, [productId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadImages());
    return () => window.cancelAnimationFrame(frame);
  }, [loadImages]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const available = Math.max(0, 5 - images.length);
    const selected = files.slice(0, available);
    if (selected.length === 0) {
      setFeedback("Для цього товару вже використано ліміт у 5 активних фото.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("productId", productId);
        form.append("file", file, file.name);
        form.append("published", String(publish));
        form.append("focusY", focusY);
        const response = await fetch("/api/v1/admin/product-images", { method: "POST", body: form });
        const payload = await response.json() as unknown;
        if (!response.ok) throw new Error(responseError(payload));
      }
      setFiles([]);
      setFeedback(`Завантажено фото: ${selected.length}.`);
      await loadImages();
    } catch (uploadError) {
      setFeedback(uploadError instanceof Error ? uploadError.message : "IMAGE_SAVE_FAILED");
      await loadImages();
    } finally {
      setBusy(false);
    }
  }

  async function replaceImage(image: ProductImage, file: File) {
    setBusy(true);
    setFeedback("");
    try {
      const form = new FormData();
      form.append("productId", productId);
      form.append("file", file, file.name);
      form.append("replaceImageId", image.id);
      form.append("published", String(image.published));
      form.append("focusY", focusY);
      const response = await fetch("/api/v1/admin/product-images", { method: "POST", body: form });
      const payload = await response.json() as unknown;
      if (!response.ok) throw new Error(responseError(payload));
      setFeedback("Фото замінено.");
      await loadImages();
    } catch (replaceError) {
      setFeedback(replaceError instanceof Error ? replaceError.message : "IMAGE_SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(image: ProductImage) {
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/admin/product-images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !image.published }),
      });
      if (!response.ok) throw new Error("IMAGE_UPDATE_FAILED");
      setImages((current) => current.map((item) => item.id === image.id ? { ...item, published: !item.published } : item));
    } catch (toggleError) {
      setFeedback(toggleError instanceof Error ? toggleError.message : "IMAGE_UPDATE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(image: ProductImage) {
    if (!window.confirm("Сховати це фото з каталогу? Оригінал залишиться для відновлення.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/admin/product-images/${image.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("IMAGE_DELETE_FAILED");
      setImages((current) => current.filter((item) => item.id !== image.id));
    } catch (removeError) {
      setFeedback(removeError instanceof Error ? removeError.message : "IMAGE_DELETE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-media">
      <div className="admin-media-heading">
        <div>
          <p className="eyebrow"><span></span>Фото товарів</p>
          <h2>Оригінали та WebP</h2>
          <p>До 5 фото на товар. PNG, JPG або HEIC обробляються Worker у WebP; нове фото можна залишити прихованим до перевірки.</p>
        </div>
        <label>
          <span>Товар</span>
          <select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={busy}>
            {imageProducts.map((product) => <option value={product.id} key={product.id}>{product.title}</option>)}
          </select>
        </label>
      </div>

      <form className="admin-media-form" onSubmit={(event) => void upload(event)}>
        <label className="admin-media-file">
          <span>Додати фото</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            disabled={busy || images.length >= 5}
          />
          <small>{files.length ? `Обрано: ${files.length}` : "Оригінал не перезаписується"}</small>
        </label>
        <label>
          <span>Фокус по вертикалі, %</span>
          <input type="number" min="0" max="100" step="1" value={focusY} onChange={(event) => setFocusY(event.target.value)} disabled={busy} />
          <small>50 — центр; менше — більше простору знизу.</small>
        </label>
        <label className="admin-media-check">
          <input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} disabled={busy} />
          <span>Одразу показати в каталозі</span>
        </label>
        <button className="button dark" type="submit" disabled={busy || images.length >= 5 || files.length === 0}>{busy ? "Обробляємо…" : "Завантажити фото"}</button>
      </form>

      {feedback && <p className="admin-media-feedback">{feedback}</p>}
      {state === "loading" && <div className="admin-state">Завантажуємо фото…</div>}
      {state === "unavailable" && <div className="admin-state"><b>Фото API ще не підключений</b><p>Потрібні production D1, два R2 bindings і Images binding з `worker/wrangler.production.jsonc`.</p></div>}
      {state === "error" && <div className="admin-state"><b>Фото не підтверджені</b><p>Спробуйте оновити список після перевірки Worker.</p></div>}
      {state === "ready" && images.length === 0 && <div className="admin-state">Фото для цього товару ще не завантажені.</div>}
      {state === "ready" && images.length > 0 && (
        <div className="admin-media-grid">
          {images.map((image) => (
            <article className="admin-media-card" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin previews use the public WebP URL returned by the Worker. */}
              <img src={image.public_url} alt={image.alt ?? ""} width={image.width} height={image.height} loading="lazy" />
              <div>
                <small>{image.width}×{image.height} · {(image.original_bytes / 1024 / 1024).toFixed(1)} MB</small>
                <strong>{image.published ? "Опубліковано" : "Приховано"}</strong>
                <div className="admin-media-actions">
                  <button type="button" onClick={() => void togglePublished(image)} disabled={busy}>{image.published ? "Сховати" : "Показати"}</button>
                  <button type="button" onClick={() => void removeImage(image)} disabled={busy}>Видалити</button>
                  <label className="admin-media-replace">
                    Замінити
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void replaceImage(image, file);
                        event.currentTarget.value = "";
                      }}
                      disabled={busy}
                    />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
