import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.publicUrl),
  title: "Камінь Коростишів — вироби з граніту та мармуру",
  description: "Пам’ятники, меморіальні комплекси, столи, лавки, вази та лампадки з натурального граніту й мармуру. Проєктування, виготовлення та встановлення.",
  openGraph: {
    title: "Камінь Коростишів",
    description: "Вироби з граніту та мармуру — від ідеї до встановлення.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Камінь Коростишів — вироби з граніту та мармуру" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Камінь Коростишів",
    description: "Вироби з граніту та мармуру — від ідеї до встановлення.",
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uk"><body>{children}</body></html>;
}
