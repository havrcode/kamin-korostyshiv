import type { Metadata } from "next";
import { CatalogShell } from "../components/catalog-shell";
import { AdminLeads } from "./admin-leads";

export const metadata: Metadata = {
  title: "Адмінка — Камінь Коростишів",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminPage() {
  return (
    <CatalogShell>
      <section className="admin-page content-wrap">
        <p className="eyebrow"><span></span>Захищений робочий простір</p>
        <h1>Заявки</h1>
        <p>У production цей маршрут закриває Cloudflare Access. Навіть якщо HTML сторінки відкриється, API не поверне жодних даних без чинного підписаного Access JWT та дозволеної email-адреси.</p>
        <AdminLeads />
      </section>
    </CatalogShell>
  );
}
