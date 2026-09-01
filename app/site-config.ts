/**
 * Дані, які повторюються в різних частинах сайту.
 *
 * Коли узгодимо остаточну назву, адресу або номер, їх треба змінити тут,
 * а не шукати однаковий текст у всіх компонентах.
 */
export const siteConfig = {
  workingName: "Kaminchyk",
  brand: {
    name: "Kaminchyk",
    previousName: "Камінь Коростишів",
    activeEmblem: "K",
    logo: {
      dark: "/brand/kaminchyk/k/Kaminchyk-K-full-dark.png",
      light: "/brand/kaminchyk/k/Kaminchyk-K-full-light.png",
      emblemDark: "/brand/kaminchyk/k/Kaminchyk-K-emblem-dark.png",
      emblemLight: "/brand/kaminchyk/k/Kaminchyk-K-emblem-light.png",
    },
  },
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
  messengers: {
    telegram: {
      label: "Telegram",
      href: "https://t.me/+380660570987",
    },
    viber: {
      label: "Viber",
      href: "viber://chat?number=%2B380660570987",
    },
  },
  leads: {
    enabled: process.env.NEXT_PUBLIC_LEADS_ENABLED === "true",
    endpoint: "/api/v1/leads",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    consentVersion: "lead-contact-v1",
  },
} as const;
