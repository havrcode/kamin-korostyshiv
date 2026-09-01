import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./ui-icon";
import { siteConfig } from "../site-config";

export function CatalogHeader() {
  return (
    <header className="catalog-header">
      <Link className="brand" href="/" aria-label={`${siteConfig.workingName} — на головну`}>
        <span className="brand-mark" aria-hidden="true"><span>K</span></span>
        <span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span>
      </Link>
      <nav aria-label="Навігація каталогу">
        <Link href="/">Головна</Link>
        <Link href="/catalog/">Каталог</Link>
        <Link href="/#contact">Прорахунок</Link>
      </nav>
      <a className="catalog-phone" href={siteConfig.phone.href}>
        {siteConfig.phone.display}<Icon name="phone" />
      </a>
    </header>
  );
}

export function CatalogFooter() {
  return (
    <footer>
      <div className="content-wrap footer-top">
        <div className="brand footer-brand"><span className="brand-mark"><span>K</span></span><span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span></div>
        <p>{siteConfig.description}</p>
        <div className="footer-actions">
          <a href={siteConfig.phone.href}>{siteConfig.phone.display}<Icon name="phone" /></a>
          <Link href="/#contact">Запросити прорахунок <Icon name="arrow" /></Link>
          <Link href="/privacy/">Конфіденційність</Link>
        </div>
      </div>
      <div className="content-wrap footer-bottom"><span>© 2026 {siteConfig.workingName}</span><span>Україна · {siteConfig.location}</span></div>
    </footer>
  );
}

export function CatalogShell({ children }: { children: ReactNode }) {
  return <main className="catalog-page"><CatalogHeader />{children}<CatalogFooter /></main>;
}
