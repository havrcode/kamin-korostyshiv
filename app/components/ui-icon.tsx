import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "cube"
  | "menu"
  | "phone"
  | "ruler"
  | "shield"
  | "spark"
  | "telegram"
  | "truck"
  | "viber"
  | "x";

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  phone: <path d="M7.2 3.5 10 8 7.8 9.8a14 14 0 0 0 6.4 6.4L16 14l4.5 2.8-.8 3.2a2 2 0 0 1-2 1.5C9.3 20.7 3.3 14.7 2.5 6.3A2 2 0 0 1 4 4.3l3.2-.8Z" />,
  ruler: <path d="M4 17 17 4l3 3L7 20l-3-3Zm8-8 3 3M9 12l2 2M6 15l3 3" />,
  shield: <path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-5" />,
  spark: <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />,
  telegram: <path d="m3 11 17-7-4 16-5-5-3 3v-5l8-6-10 5-3-1Z" />,
  truck: <path d="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  viber: <><path d="M6.3 4.8A9 9 0 0 1 20 12c0 2-.7 3.8-1.8 5.3L19 21l-3.9-1.2A9 9 0 0 1 4 6.5" /><path d="M8 7.5c.8 4.2 3.2 6.7 7.5 7.5m-1.3-3.2c-1-.9-1.7-.2-2.1.4-.7-.4-1.3-1-1.8-1.7.6-.5 1.2-1.2.2-2.2" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
