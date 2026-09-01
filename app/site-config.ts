/**
 * Дані, які повторюються в різних частинах сайту.
 *
 * Коли узгодимо остаточну назву, адресу або номер, їх треба змінити тут,
 * а не шукати однаковий текст у всіх компонентах.
 */
export const siteConfig = {
  workingName: "Камінь Коростишів",
  location: "Коростишів, Житомирська область",
  publicUrl: "https://kamin-korostyshiv.dev-mr-serg.chatgpt.site",
  description:
    "Пам’ятники, меморіальні комплекси та вироби з натурального каменю. Проєктування, виготовлення, доставка й монтаж.",
  catalogNotice:
    "Зображення з позначкою «Візуалізація» є концептами, а не фотографіями виконаних робіт.",
  phone: {
    display: "+380 66 057 09 87",
    href: "tel:+380660570987",
  },
  leads: {
    enabled: process.env.NEXT_PUBLIC_LEADS_ENABLED === "true",
    endpoint: "/api/v1/leads",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    consentVersion: "lead-contact-v1",
  },
} as const;
