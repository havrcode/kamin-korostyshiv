import type { Metadata } from "next";
import { CatalogShell } from "../components/catalog-shell";
import { AdminLeads } from "./admin-leads";
import { AdminProductImages } from "./admin-product-images";

export const metadata: Metadata = {
  title: "Адмінка — Kaminchyk",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminPage() {
  return (
    <CatalogShell>
      <section className="admin-page content-wrap">
        <p className="eyebrow"><span></span>Захищений робочий простір</p>
        <h1>Заявки</h1>
        <p>Це готовий модуль заявок: у production маршрут закриває Cloudflare Access, а API не повертає даних без чинного підписаного Access JWT та дозволеної email-адреси.</p>
        <AdminLeads />
        <AdminProductImages />
        <section className="admin-catalog-status">
          <p className="eyebrow"><span></span>Наступний етап</p>
          <h2>Runtime-каталог</h2>
          <p>Фото вже підготовлені до production API. Перемикання видимості категорій і товарів залишиться наступним окремим кроком, бо публічний frontend зараз генерується як static export.</p>
        </section>
      </section>
    </CatalogShell>
  );
}
