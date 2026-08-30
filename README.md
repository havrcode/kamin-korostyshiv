# Камінь Коростишів

Сайт виробів із граніту та мармуру: каталог, заявка на прорахунок і майбутня
адмінка. Frontend створено на React + TypeScript/Next і збирається Vinext/Vite
для Cloudflare runtime.

## Поточний стан

Версія в роботі: `0.1.1`.

- адаптивна презентаційна сторінка;
- централізований номер `+380 66 057 09 87`;
- клік по категорії підставляє інтерес у форму;
- форма поки готує лише локальну чернетку й нічого не надсилає;
- D1, R2, Telegram і `/admin` ще не підключені;
- цільовий production — власний Cloudflare Free;
- поточний ChatGPT Sites — середовище розробки та демонстрації.

Актуальний чекліст: [docs/PROJECT_STATUS_UA.md](docs/PROJECT_STATUS_UA.md).

## Запуск

Вимоги: Node.js `>=22.13.0`, npm і Git.

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

`npm test` виконує production build і smoke-тест зібраного Worker.

## Документація

- [План розробки](docs/PROJECT_PLAN_UA.md)
- [Поточний стан](docs/PROJECT_STATUS_UA.md)
- [Архітектура та функції](docs/ARCHITECTURE_UA.md)
- [Інструкція для початківця](docs/BEGINNER_GUIDE_UA.md)
- [План 2D/3D-конструктора](docs/CONSTRUCTOR_2D_3D_PLAN_UA.md)
- [Правила для Codex/розробника](AGENTS.md)

## Важливі файли

- `app/site-config.ts` — контакти й робоча назва;
- `app/data/catalog.ts` — категорії, камені, FAQ;
- `app/page.tsx` — UI та інтерактивний state;
- `app/globals.css` — дизайн і responsive-поведінка;
- `worker/index.ts` — Cloudflare Worker entry;
- `.openai/hosting.json` — тільки зв’язок із ChatGPT Sites, не production-конфіг
  майбутнього власного Cloudflare-акаунта.

## Git-правило

Базовий тег `v0.1.0` не пересувається. Нові зміни йдуть через feature-гілку та
Pull Request. Merge — тільки після прямої команди власника.
