# Камінь Коростишів

Версія `1.0.0` — завершена публічна демонстрація сайту виробів із граніту та
мармуру. Frontend створено на React + TypeScript/Next.js і збирається як
статичний сайт. Окремий Cloudflare Worker містить перевірений контур заявок,
Telegram-outbox, захищеної адмінки та приватного кошторису.

## Що вже є

- адаптивна головна сторінка й делікатні анімації з `prefers-reduced-motion`;
- каталог із 5 категорій, 9 товарних концепцій і окремих SEO-сторінок;
- 9 оптимізованих WebP-візуалізацій, прямо позначених як згенеровані;
- вибір товару з передаванням стабільного `productId` у форму;
- чесний режим «після прорахунку» без вигаданих цін;
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

Повна перевірка:

```bash
npm run lint
npm run typecheck
npm test
```

`npm test` виконує production build 22 статичних маршрутів, smoke-тести HTML,
32 unit-тести й суху Wrangler-збірку Worker.

## Основні файли

- `app/site-config.ts` — контакти, публічна адреса й перемикач реальних заявок;
- `app/data/catalog.ts` — 5 категорій і 9 товарів зі стабільними ID/slug;
- `app/catalog/` — каталог, категорії й товарні сторінки;
- `app/page.tsx` — головна та форма;
- `server/leads/` — контракт, валідація, Turnstile/D1 HTTP-контур;
- `server/notifications/` — Telegram outbox, retry, lease і Cron;
- `server/admin/` — перевірка Access JWT та API заявок;
- `server/estimates/calculator.ts` — приватний і клієнтський кошториси;
- `db/schema.ts` і `database/migrations/` — D1-схема й незмінні міграції;
- `worker/index.ts` — Worker entrypoint для `/api/*` і Cron;
- `worker/wrangler.production.example.jsonc` — шаблон власного Cloudflare;
- `public/visual-*.webp` — тимчасові згенеровані візуалізації.

## Документація

- [Поточний стан](docs/PROJECT_STATUS_UA.md)
- [План розробки](docs/PROJECT_PLAN_UA.md)
- [Повний контекст і передача](docs/HANDOFF_UA.md)
- [Архітектура та виклики](docs/ARCHITECTURE_UA.md)
- [Журнал рішень](docs/DECISIONS_UA.md)
- [Покрокова інструкція розробника](docs/BEGINNER_GUIDE_UA.md)
- [Cloudflare від створення акаунта до запуску](docs/CLOUDFLARE_SETUP_UA.md)
- [Вибір і підключення домену](docs/DOMAIN_SETUP_UA.md)
- [Походження демонстраційного контенту](docs/CONTENT_ASSUMPTIONS_UA.md)
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
