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
  phone: {
    display: "+380 66 057 09 87",
    href: "tel:+380660570987",
  },
} as const;
