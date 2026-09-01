import { Icon } from "./ui-icon";
import { siteConfig } from "../site-config";

export function MessengerLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`messenger-links ${className}`.trim()} aria-label="Написати в месенджер">
      <a href={siteConfig.messengers.telegram.href} target="_blank" rel="noreferrer">
        <Icon name="telegram" />
        <span>{siteConfig.messengers.telegram.label}</span>
      </a>
      <a href={siteConfig.messengers.viber.href}>
        <Icon name="viber" />
        <span>{siteConfig.messengers.viber.label}</span>
      </a>
    </div>
  );
}
