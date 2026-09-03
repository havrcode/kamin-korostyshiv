# Kaminchyk

Версія `1.1.7` — сайт виробів із граніту та
мармуру. Frontend створено на React + TypeScript/Next.js і збирається як
статичний сайт. Окремий Cloudflare Worker містить перевірений контур заявок,
Telegram-outbox, захищеної адмінки та приватного кошторису.

## Що вже є

- адаптивна головна сторінка й делікатні анімації з `prefers-reduced-motion`;
- затверджений бренд Kaminchyk з емблемою K, прозорими dark/light assets і
  архівом попереднього знака;
- видимий клікабельний телефон на першому екрані, Telegram і Viber;
- каталог із 5 публічних категорій, 38 товарів і окремих SEO-сторінок;
- кнопка `+` на товарних фото для вибору кількох виробів перед оформленням;
- пам’ятникові категорії тимчасово приховані через `published: false`;
- реалістичніший atlas зразків каменю для Габро, Габро Premium,
  Покостівського, Капустинського, Лезниківського та мармуру;
- 38 окремих товарних WebP-візуалізацій плюс категорійні/резервні кадри,
  прямо позначені як згенеровані;
- вибір товару з передаванням стабільного `productId` у форму;
- кілька обраних товарів передаються в заявку списком назв через існуюче поле
  повідомлення, тому адмінка й Telegram показують повний інтерес клієнта без
  нової D1-міграції;
- чесний режим «Вартість уточнюється» без вигаданих цін;
- політика конфіденційності, `robots.txt`, `sitemap.xml` і власна 404-сторінка;
- `POST /api/v1/leads`: D1, idempotency, rate limit, Turnstile й outbox;
- Telegram retry/Cron із захистом від конкурентної доставки;
- `/admin`: Cloudflare Access JWT, email allowlist, список заявок і audit log;
- серверний калькулятор, який відокремлює собівартість від клієнтського JSON;
- production-приклад Wrangler та дві докладні інструкції Cloudflare/домену.

Публічний ChatGPT Sites працює в демонстраційному режимі: форма не передає і
не зберігає персональні дані. Реальне приймання заявок вмикається тільки у
власному Cloudflare після створення D1/Turnstile/Access, внесення secrets і
погодження юридичних даних бізнесу. Це навмисна межа безпеки, а не відсутня
реалізація.

## Запуск

Потрібні Node.js `>=22.18.0`, npm і Git.

```bash
npm ci
npm run dev
```

Економний локальний перегляд зібраного static export без Next watcher:

```bash
npm run build
npm run preview:static
```

Повна перевірка:

```bash
npm run lint
npm run typecheck
npm test
```

`npm test` виконує production build 51 статичного маршруту, 7 smoke-тестів
HTML, 37 unit-тестів (включно з реальною прозорістю брендових PNG) й суху
Wrangler-збірку Worker.

## Економний режим Codex

Для малих задач стартовий контекст — `AGENTS.md`, `docs/BRIEF_UA.md` і
цільові файли. Повний `docs/`, browser/CDP, screenshots, image generation,
Sites-публікація й повний `npm test` використовуються тільки коли вони реально
потрібні: перед релізом/деплоєм або для ризикових змін каталогу, форми,
worker/API, маршрутизації чи shared CSS.

## Основні файли

- `app/site-config.ts` — бренд, контакти, месенджери, адреса й перемикач заявок;
- `public/brand/` — активні K-assets, резервний Angel і архів старого знака;
- `app/data/catalog.ts` — приховані пам’ятникові категорії, 5 публічних
  категорій і 38 товарів зі стабільними ID/slug;
- `app/catalog/` — каталог, категорії й товарні сторінки;
- `app/components/product-interest-control.tsx` — кнопка `+ / ✓` і перехід до
  оформлення з кількома товарами;
- `app/page.tsx` — головна та форма;
- `server/leads/` — контракт, валідація, Turnstile/D1 HTTP-контур;
- `server/notifications/` — Telegram outbox, retry, lease і Cron;
- `server/admin/` — перевірка Access JWT та API заявок;
- `server/estimates/calculator.ts` — приватний і клієнтський кошториси;
- `db/schema.ts` і `database/migrations/` — D1-схема й незмінні міграції;
- `worker/index.ts` — Worker entrypoint для `/api/*` і Cron;
- `worker/wrangler.production.example.jsonc` — шаблон власного Cloudflare;
- `public/visual-*.webp` — тимчасові згенеровані візуалізації, включно з
  окремими категорійними кадрами для столів/лавок, лампадок, ваз, декору й
  каменю для дому;
- `public/products/table-benches/` — 14 товарних WebP-візуалізацій для
  категорії `Столи та лавки`;
- `public/products/vases/` — шість товарних WebP-візуалізацій для категорії
  `Вази`;
- `public/products/lamps/` — сім товарних WebP-візуалізацій для категорії
  `Лампадки`;
- `public/products/decor/` — дві товарні WebP-візуалізації для категорії
  `Інший декор`;
- `public/products/home/` — дев’ять товарних WebP-візуалізацій для категорії
  `Камінь для дому`;
- `public/stone-texture-atlas.webp` — optimized atlas зразків каменю.

## Документація

- [Поточний стан](docs/PROJECT_STATUS_UA.md)
- [Короткий робочий контекст](docs/BRIEF_UA.md)
- [План розробки](docs/PROJECT_PLAN_UA.md)
- [Повний контекст і передача](docs/HANDOFF_UA.md)
- [Архітектура та виклики](docs/ARCHITECTURE_UA.md)
- [Журнал рішень](docs/DECISIONS_UA.md)
- [Покрокова інструкція розробника](docs/BEGINNER_GUIDE_UA.md)
- [Cloudflare від створення акаунта до запуску](docs/CLOUDFLARE_SETUP_UA.md)
- [Вибір і підключення домену](docs/DOMAIN_SETUP_UA.md)
- [Походження демонстраційного контенту](docs/CONTENT_ASSUMPTIONS_UA.md)
- [Бренд і правила використання логотипів](docs/BRAND_ASSETS_UA.md)
- [План 2D/3D-конструктора](docs/CONSTRUCTOR_2D_3D_PLAN_UA.md)
- [Історія змін](CHANGELOG.md)

## Git і релізи

Після чистих перевірок той самий стан публікується на Sites і завантажується у
приватний GitHub `main`. GitHub Actions ще раз перевіряє commit і створює
незмінний тег `v<package.version>`. Старі теги ніколи не пересуваються.

Щоб пізніше підтягнути на Mac код, історію й усі теги:

```bash
git status -sb
git fetch origin --prune --tags
git switch main
git pull --ff-only origin main
git log --oneline --decorate -10
```
