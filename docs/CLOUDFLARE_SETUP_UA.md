# Cloudflare для «Камінь Коростишів»: інструкція для початківця

Оновлено: 1 вересня 2026 року.

Ця інструкція підключає вже готовий код. Створити акаунт, прийняти умови,
увімкнути двофакторний захист і ввести платіжні дані може тільки власник.
Codex не повинен вигадувати ці дані або зберігати секрети в Git.

## 1. Що ми створюємо

Один Cloudflare Worker розгортає дві частини як одне ціле:

- статичні файли з `out/` — головна, каталог, товари, конфіденційність;
- Worker-код — `/api/*`, D1, Telegram, Turnstile, адмінка та Cron.

Cloudflare підтверджує, що статичні assets розгортаються разом із Worker і
можуть віддаватися без запуску Worker-коду. Документація:
<https://developers.cloudflare.com/workers/static-assets/>.

На Free plan станом на 1 вересня 2026 року:

- статичні asset-запити безплатні й не мають окремої квоти:
  <https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/>;
- Worker — 100 000 запитів на день:
  <https://developers.cloudflare.com/workers/platform/pricing/>;
- D1 — до 500 МБ на одну базу, до 5 ГБ на акаунт, 7 днів Time Travel:
  <https://developers.cloudflare.com/d1/platform/limits/>;
- R2 — 10 ГБ-місяців, 1 млн Class A і 10 млн Class B операцій на місяць у
  безплатному пакеті; egress безплатний:
  <https://developers.cloudflare.com/r2/pricing/>.

Для нашого стартового трафіку цього достатньо. З 1 вересня 2026 року D1 на
Free plan відмовляє після вичерпання денної квоти читань/записів до скидання
о 00:00 UTC; дані при цьому не видаляються:
<https://developers.cloudflare.com/changelog/post/2026-09-01-d1-enforces-free-tier-limits/>.

## 2. Створити правильний акаунт

1. Визначити власника: акаунт має належати бізнесу або людині, яка реально
   контролює бізнес, а не випадковому розробнику.
2. Використати постійну email-адресу, до якої власник не втратить доступ.
3. Відкрити <https://dash.cloudflare.com/sign-up> і створити акаунт.
4. Підтвердити email.
5. Відкрити `My Profile` → `Authentication`.
6. Увімкнути 2FA через застосунок-аутентифікатор.
7. Зберегти recovery codes у менеджері паролів та в окремій офлайн-копії.
8. Не надсилати пароль, recovery codes або API token у цей чат.
9. Якщо брат теж адмініструє сайт, додати його окремим учасником із власним
   входом. Не користуватися одним паролем удвох.

Офіційний початок роботи з акаунтом:
<https://developers.cloudflare.com/fundamentals/get-started/>.

## 3. Додати домен у Cloudflare

Домен спочатку купується у реєстратора. Після купівлі:

1. У Cloudflare відкрити `Domains` → `Onboard a domain`.
2. Ввести кореневий домен, наприклад `kamin-korostyshiv.com.ua`.
3. Обрати Free plan.
4. Перевірити імпортовані DNS-записи. Якщо домен новий, список може бути майже
   порожній — це нормально.
5. Cloudflare покаже дві адреси nameserver.
6. У кабінеті реєстратора домену замінити nameserver на ці дві адреси.
7. Повернутися в Cloudflare та натиснути перевірку.
8. Дочекатися статусу `Active`.
9. У `SSL/TLS` залишити Universal SSL увімкненим.

Повний офіційний порядок:
<https://developers.cloudflare.com/fundamentals/manage-domains/add-site/>.
Cloudflare видає Universal SSL для підключених доменів:
<https://developers.cloudflare.com/fundamentals/manage-domains/>.

## 4. Підготувати Mac

У Terminal відкрити локальний репозиторій і виконати:

```bash
git fetch origin --prune --tags
git switch main
git pull --ff-only origin main
npm ci
npm test
```

Потім увійти в Cloudflare через Wrangler:

```bash
npx wrangler login
```

Браузер відкриє Cloudflare. Треба дозволити доступ саме тому акаунту, в якому
буде сайт. API token для звичайного ручного запуску не потрібно копіювати в
файл.

## 5. Створити D1

Виконати з кореня репозиторію:

```bash
npx wrangler d1 create kamin-korostyshiv-production
```

Wrangler покаже `database_id`. Його можна записувати в конфіг — це не пароль.

1. Скопіювати `worker/wrangler.production.example.jsonc` у безпечний робочий
   `worker/wrangler.production.jsonc`.
2. Замінити `PASTE_D1_DATABASE_ID_HERE` на отриманий ID.
3. Не змінювати `binding: "DB"`.
4. Застосувати міграції:

```bash
npx wrangler d1 migrations apply kamin-korostyshiv-production --remote --config worker/wrangler.production.jsonc
```

Міграція `0004_bumpy_blink.sql` створює `lead_attachments` для метаданих фото
із форми. Її потрібно застосувати до розгортання Worker, який читає вкладення в
адмінці.

Після застосування Cloudflare робить точку відновлення. Перелік команд D1:
<https://developers.cloudflare.com/d1/wrangler-commands/>.

## 6. Підключити production-фото

Створити два R2 bucket-и: окремий приватний для оригіналів і окремий публічний
для WebP. Це не дає випадковому відвідувачу отримати оригінальний файл через
той самий public media hostname.

```bash
npx wrangler r2 bucket create kaminchyk-product-originals
npx wrangler r2 bucket create kaminchyk-product-public
npx wrangler r2 bucket create kaminchyk-lead-attachments
```

1. У `worker/wrangler.production.example.jsonc` уже підготовлені bindings
   `PRODUCT_MEDIA_PRIVATE`, `PRODUCT_MEDIA_PUBLIC` та `IMAGES`.
2. Скопіювати example у `worker/wrangler.production.jsonc` і залишити назви
   bucket-ів без змін або замінити їх на власні.
3. Для `kaminchyk-product-public` підключити власний custom domain, наприклад
   `media.kaminchyk.com.ua`. Не вмикати public `r2.dev` для production.
4. Вписати цей URL у `MEDIA_PUBLIC_BASE_URL`. Приватному bucket-у оригіналів
   custom domain не підключати.
5. Binding `LEAD_ATTACHMENTS` призначений для приватних фото з форм заявок.
   Не підключати до нього custom domain і не вмикати public `r2.dev`.
6. Міграція `0003_magical_warpath.sql` та `0004_bumpy_blink.sql` входять у
   команду з §5. Якщо D1
   було створено до версії `v1.1.11`, повторити цю команду один раз після
   оновлення файлів проєкту.

Worker Images binding приймає raw bytes, обрізає у `3:2` без зайвого upscale і
кодує WebP quality 86. Потрібно, щоб у Cloudflare Images були доступні
Transformations; на Free-плані є місячний ліміт унікальних перетворень.
Офіційні довідки: <https://developers.cloudflare.com/images/optimization/binding/>
та <https://developers.cloudflare.com/images/optimization/features/>.

## 7. Створити Turnstile

1. У dashboard відкрити `Turnstile`.
2. Натиснути `Add widget`.
3. Назва: `kamin-korostyshiv-production`.
4. Додати production-домен і, за потреби, тимчасовий домен тестування.
5. Режим: `Managed`.
6. Створити widget.
7. Скопіювати `sitekey` і `secret key`.

Sitekey є публічним. Його вказують під час production build:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="PASTE_SITEKEY" npm run build
```

Secret ніколи не додають у `.env`, який потрапляє в Git. Записати його у
Cloudflare:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.production.jsonc
```

Офіційні кроки створення widget:
<https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/>.
Cloudflare вимагає серверну перевірку токена; у коді вона вже реалізована:
<https://developers.cloudflare.com/turnstile/get-started/server-side-validation/>.

## 8. Підключити Telegram

Потрібні реальні `bot token` і `chat ID`. До їх отримання заявка все одно може
зберігатися в D1, але Telegram-процесор відмовиться claim-ити чергу.

Записати secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN --config worker/wrangler.production.jsonc
npx wrangler secret put TELEGRAM_CHAT_ID --config worker/wrangler.production.jsonc
```

Не вставляти значення token у командний рядок після назви. Wrangler сам
запросить приховане введення.

## 9. Захистити `/admin`

Адмінка використовує Cloudflare Access і додатково сама перевіряє:

- підпис JWT через офіційні public keys Access;
- `aud` конкретного Access Application;
- строк дії;
- email у `ADMIN_EMAILS`.

Кроки:

1. У Cloudflare відкрити `Zero Trust`.
2. Створити team name. Він утворить адресу виду
   `YOUR_TEAM.cloudflareaccess.com`.
3. Відкрити `Access controls` → `Applications`.
4. `Add an application` → `Self-hosted`.
5. Додати два protected paths:
   - `ваш-домен.com.ua/admin*`;
   - `ваш-домен.com.ua/api/v1/admin/*`.
6. Створити Allow policy тільки для email власника й брата.
7. Скопіювати Application Audience (`AUD`).
8. У `worker/wrangler.production.jsonc` замінити:
   - `YOUR_TEAM.cloudflareaccess.com`;
   - `PASTE_ACCESS_APPLICATION_AUD_HERE`;
   - `owner@example.com` на дозволені email через кому.

Cloudflare Access працює як identity-aware proxy до запуску Worker:
<https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/>.
Нові Zero Trust акаунти мають Cloudflare identity provider; також можна
ввімкнути одноразовий PIN на дозволену пошту:
<https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/>.

## 10. Розгорнути

Перед кожним production deployment:

```bash
npm ci
npm run lint
npm run typecheck
npm test
```

Зібрати frontend із production sitekey:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY="PASTE_SITEKEY" npm run build
```

Потім:

```bash
npx wrangler deploy --config worker/wrangler.production.jsonc
```

У Cloudflare відкрити Worker → `Settings` → `Domains & Routes` → `Add` →
`Custom domain` і вибрати production-домен. Офіційна інструкція:
<https://developers.cloudflare.com/workers/configuration/routing/custom-domains/>.

## 11. Контроль після запуску

Перевірити по черзі:

1. головна відкривається з телефона через мобільний інтернет;
2. `/catalog/` і кожна товарна сторінка працюють;
3. форма показує Turnstile;
4. тестова заявка повертає номер `KK-YYYYMMDD-XXXXXXXX`;
5. заявка є в `/admin` навіть якщо Telegram тимчасово недоступний;
6. Telegram отримав той самий номер;
7. тестова заявка з одним фото показує вкладення в адмінці та не відкриває
   файл без Access;
8. повтор із тим самим idempotency key не створив другу заявку;
9. стороння email-адреса не входить у `/admin`;
10. `robots.txt` і `sitemap.xml` відкриваються;
11. у репозиторії немає secrets.

## 12. Відновлення D1

Free plan зберігає 7 днів Time Travel. Перед реальною помилкою нічого не
відновлювати «для перевірки» на production. Спочатку подивитися інформацію:

```bash
npx wrangler d1 info kamin-korostyshiv-production
```

Команда відновлення:

```bash
npx wrangler d1 time-travel restore kamin-korostyshiv-production
```

Wrangler попросить точку часу. Офіційна довідка:
<https://developers.cloudflare.com/d1/reference/time-travel/>.

## 13. Що ще має підтвердити бізнес

Форма не повинна збирати реальні дані до погодження:

- юридичного імені або ПІБ володільця даних;
- строку зберігання заявки;
- одержувачів Telegram та адміністраторів;
- остаточного тексту згоди й контактів для запиту на видалення.

Український Закон «Про захист персональних даних»:
<https://zakon.rada.gov.ua/laws/show/2297-17>.
FAQ Уповноваженого Верховної Ради України з прав людини:
<https://ombudsman.gov.ua/zahist-personalnih-danih-faq>.

Поточна `app/privacy/page.tsx` є технічно чесною чернеткою, а не заміною
юридичної перевірки власника.
