# Камінь Коростишів

Сайт виробів із граніту та мармуру: каталог, заявка на прорахунок і майбутня
адмінка. Frontend створено на React + TypeScript/Next.js і збирається як
звичайний статичний сайт. Cloudflare Worker буде окремо обробляти лише API та
приватну серверну логіку.

## Поточний стан

Поточна перевірена версія: `0.1.5`.

- адаптивна презентаційна сторінка;
- централізований номер `+380 66 057 09 87`;
- клік по категорії підставляє інтерес у форму;
- форма поки готує лише локальну чернетку й нічого не надсилає;
- Vinext/Vite та Worker-рендеринг публічних сторінок прибрано;
- `npm run build` створює статичний сайт у `out/`;
- реалізовано типізований серверний контракт і валідацію майбутньої заявки;
- підготовлено D1-схему `leads` + `notification_outbox` і першу міграцію;
- підготовлено окремий `POST /api/v1/leads` із лімітом тіла, rate limit,
  idempotency key та атомарним D1 batch `lead + outbox`;
- реалізовано атомарний claim Telegram-outbox, п’ятихвилинне відновлення
  застарілого lock, повтори з backoff і остаточний стан `FAILED`;
- Worker робить негайну фонову спробу після збереження заявки, а Cron handler
  обробляє чергу як резервний механізм;
- D1, R2, Telegram і `/admin` ще не підключені;
- цільовий production — власний Cloudflare Free;
- поточний ChatGPT Sites — середовище розробки та демонстрації.

Актуальний чекліст: [docs/PROJECT_STATUS_UA.md](docs/PROJECT_STATUS_UA.md).

## Запуск

Вимоги: Node.js `>=22.18.0`, npm і Git. Ця версія Node виконує erasable
TypeScript у unit-тестах без додаткового test runner.

```bash
npm ci
```

```bash
npm run dev
```

## Перевірки

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

`npm test` виконує production build, smoke-тести статичного HTML,
unit-тести валідації/API/D1-репозиторію, конкурентного outbox claim,
Telegram/retry/Cron та суху Worker-збірку Wrangler.

## Документація

- [План розробки](docs/PROJECT_PLAN_UA.md)
- [Поточний стан](docs/PROJECT_STATUS_UA.md)
- [Повний контекст і передача проєкту](docs/HANDOFF_UA.md)
- [Журнал архітектурних рішень](docs/DECISIONS_UA.md)
- [Архітектура та функції](docs/ARCHITECTURE_UA.md)
- [Інструкція для початківця](docs/BEGINNER_GUIDE_UA.md)
- [План 2D/3D-конструктора](docs/CONSTRUCTOR_2D_3D_PLAN_UA.md)
- [Історія змін](CHANGELOG.md)
- [Правила для Codex/розробника](AGENTS.md)

## Важливі файли

- `app/site-config.ts` — контакти, робоча назва й поточна публічна адреса;
- `app/data/catalog.ts` — категорії, камені, FAQ;
- `app/page.tsx` — UI та інтерактивний state;
- `app/globals.css` — дизайн і responsive-поведінка;
- `server/leads/validation.ts` — нормалізація й серверна перевірка заявки;
- `server/leads/http.ts` — HTTP-межа, розмір запиту, rate limit і відповіді;
- `server/leads/repository.ts` — D1 batch, idempotency та публічний номер;
- `server/notifications/outbox.ts` — атомарний claim, lease і переходи черги;
- `server/notifications/telegram.ts` — безпечне форматування й Telegram API;
- `server/notifications/processor.ts` — retry/backoff та пакетна обробка;
- `worker/index.ts` — окремий Worker entrypoint тільки для API;
- `db/schema.ts` — таблиці D1 для заявок та надійної черги сповіщень;
- `database/migrations/` — незмінні SQL-міграції й метадані Drizzle;
- `next.config.ts` — статичний `output: "export"`;
- `out/` — згенерований статичний сайт, який не зберігається в Git;
- `.openai/hosting.json` — тільки зв’язок із ChatGPT Sites, не production-конфіг
  майбутнього власного Cloudflare-акаунта.

## Робочий цикл

Після чистих перевірок погоджені зміни автоматично публікуються на Sites і
fast-forward завантажуються в приватний GitHub `main`. Базовий тег `v0.1.0`
ніколи не пересувається. GitHub Actions повторно перевіряє кожен завершений
стан і автоматично створює незмінний тег `v<package.version>` без окремої
ітерації підтвердження.

Папка на Mac не оновлюється з хмари фізично. Коли відкриєш проєкт локально,
`git fetch origin --prune --tags` і `git pull --ff-only origin main` підтягнуть
коміти, файли, історію та всі release-теги.
