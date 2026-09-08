/**
 * Дані, які повторюються в різних частинах сайту.
 *
 * Коли узгодимо остаточну назву, адресу або номер, їх треба змінити тут,
 * а не шукати однаковий текст у всіх компонентах.
 */
const fallbackPublicUrl = "https://kamin-korostyshiv.dev-mr-serg.chatgpt.site";

function resolvePublicUrl(value: string | undefined) {
  if (!value?.trim()) return fallbackPublicUrl;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallbackPublicUrl;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return fallbackPublicUrl;
  }
}

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
  publicUrl: resolvePublicUrl(process.env.NEXT_PUBLIC_SITE_URL),
  description:
    "Гранітні та мармурові вироби з натурального каменю в Коростишеві: столи й лавки, кам’яні вази, лампадки, підвіконня, стільниці, полиці та декор. Проєктування, виготовлення, доставка й монтаж.",
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
      // Офіційний viber.me chat link працює лише для Viber Business.
      // До його створення UI копіює номер без ненадійного personal deep link.
      href: process.env.NEXT_PUBLIC_VIBER_CHAT_URL?.trim() || null,
      copyNumber: "+380660570987",
    },
  },
  leads: {
    endpoint: "/api/v1/leads",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    consentVersion: "lead-contact-v1",
  },
} as const;
