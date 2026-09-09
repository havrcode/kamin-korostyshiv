import type { Metadata } from "next";
import "./globals.css";
import { StructuredData } from "./components/structured-data";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.publicUrl),
  title: "Kaminchyk — вироби з граніту та мармуру",
  description: siteConfig.description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Kaminchyk",
    description: siteConfig.description,
    type: "website",
    locale: "uk_UA",
    images: [{ url: "/og-kaminchyk.jpg", width: 1200, height: 630, alt: "Kaminchyk — вироби з граніту та мармуру" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaminchyk",
    description: siteConfig.description,
    images: ["/og-kaminchyk.jpg"],
  },
  icons: {
    icon: siteConfig.brand.logo.emblemDark,
    shortcut: siteConfig.brand.logo.emblemDark,
    apple: siteConfig.brand.logo.emblemDark,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = siteConfig.publicUrl;
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.brand.name,
        url: siteUrl,
        logo: new URL(siteConfig.brand.logo.emblemDark, siteUrl).toString(),
        description: siteConfig.description,
        areaServed: siteConfig.location,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.phone.display,
          contactType: "customer service",
          availableLanguage: "uk",
        },
        sameAs: [siteConfig.messengers.telegram.href],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.brand.name,
        description: siteConfig.description,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "uk-UA",
      },
    ],
  };

  return <html lang="uk"><body><StructuredData data={siteJsonLd} />{children}</body></html>;
}
