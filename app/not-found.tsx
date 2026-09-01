import Link from "next/link";
import { CatalogShell } from "./components/catalog-shell";

export default function NotFound() {
  return (
    <CatalogShell>
      <section className="legal-page content-wrap">
        <p className="eyebrow"><span></span>404</p>
        <h1>Такої сторінки немає.</h1>
        <p>Можливо, адресу змінено або в посиланні є помилка. Каталог і головна сторінка залишаються доступними.</p>
        <div className="legal-actions">
          <Link className="button dark" href="/catalog/">Відкрити каталог</Link>
          <Link className="text-link" href="/">На головну</Link>
        </div>
      </section>
    </CatalogShell>
  );
}
