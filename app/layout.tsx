import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.publicUrl),
  title: "Kaminchyk — вироби з граніту та мармуру",
  description: "Столи, лавки, вази, лампадки, підвіконня та стільниці з натурального граніту й мармуру. Проєктування, виготовлення та встановлення.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Kaminchyk",
    description: "Вироби з граніту та мармуру — від ідеї до встановлення.",
    type: "website",
    images: [{ url: "/og-kaminchyk.jpg", width: 1200, height: 630, alt: "Kaminchyk — вироби з граніту та мармуру" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaminchyk",
    description: "Вироби з граніту та мармуру — від ідеї до встановлення.",
    images: ["/og-kaminchyk.jpg"],
  },
  icons: {
    icon: siteConfig.brand.logo.emblemDark,
    shortcut: siteConfig.brand.logo.emblemDark,
    apple: siteConfig.brand.logo.emblemDark,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body>{children}</body></html>;
}
