import type { Metadata } from "next";
import { CatalogShell } from "../components/catalog-shell";
import { AdminLeads } from "./admin-leads";

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
        <section className="admin-catalog-status">
          <p className="eyebrow"><span></span>Наступний модуль</p>
          <h2>Керування каталогом</h2>
          <p>Категорії й товари вже мають окремий статус публікації: приховані позиції не потрапляють у каталог, форму, окремі сторінки та sitemap. Перемикачі в адмінці підключатимуться разом із власним Cloudflare й D1, щоб зміна справді впливала на публічний сайт, а не була декоративною кнопкою.</p>
        </section>
      </section>
    </CatalogShell>
  );
}
