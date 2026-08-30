# Архітектура й робота коду «Камінь Коростишів»

Цей файл — навчальна карта проєкту. Він пояснює не тільки «що лежить у файлі»,
а й хто кого викликає, де живуть дані та де проходить межа безпеки.

## 1. Технології простими словами

### React

React складає сторінку з компонентів і повторно малює тільки те, чий стан
змінився. Інтерактивність тут — це, наприклад:

- відкрити/закрити мобільне меню без перезавантаження;
- змінити активний камінь і його візуальний зразок;
- після кліку по категорії автоматично підставити її у форму;
- показати стан чернетки заявки;
- пізніше — фільтрувати каталог і працювати з 2D/3D-конструктором.

React не є сервером і не зберігає заявки самостійно.

### TypeScript

TypeScript — JavaScript із перевіркою типів. Наприклад, `IconName` дозволяє
передати компоненту `Icon` тільки відоме ім’я іконки. Помилка в назві буде
помічена до публікації, а не клієнтом у браузері.

### Next.js App Router

Next задає структуру сторінок через каталог `app`. `app/page.tsx` відповідає за
маршрут `/`, а `app/layout.tsx` — за спільну HTML-оболонку та метадані.

### Vinext + Vite

Vinext дає можливість запускати модель Next.js у Cloudflare Worker runtime.
Vite збирає модулі, CSS і клієнтський JavaScript у deployable-артефакти.

### Cloudflare Worker

Worker — короткоживуча серверна функція, яка запускається на HTTP-запит. Це не
постійно ввімкнений Node.js-сервер. У майбутньому він:

- прийме заявку;
- перевірить дані;
- запише їх у D1;
- сформує завдання Telegram;
- перевірить права адміністратора;
- розрахує приватну й клієнтську ціну.

### D1, R2 і Cron

- D1 — реляційна SQL-база для структурованих даних.
- R2 — об’єктне сховище для фотографій та інших файлів.
- Cron Trigger — плановий запуск Worker, наприклад для повтору Telegram.

## 2. Поточна структура

```text
app/
  components/
    icon.tsx                 спільні SVG-іконки
    reveal-observer.tsx      появи секцій під час прокручування
  data/
    catalog.ts               категорії, камінь, FAQ, значення форми
  layout.tsx                 HTML-оболонка й SEO metadata
  page.tsx                   головна сторінка та її інтерактивний стан
  site-config.ts             повторювані контакти й робоча назва
  globals.css                уся візуальна система й адаптивність
db/
  index.ts                   майбутнє створення Drizzle-клієнта для D1
  schema.ts                  майбутня схема таблиць
worker/
  index.ts                   точка входу Cloudflare Worker
tests/
  rendered-html.test.mjs     smoke-перевірка зібраної сторінки
public/                      статичні зображення, favicon, Open Graph
.openai/hosting.json         зв’язок саме з поточним ChatGPT Sites
vite.config.ts               збірка Vinext і локальна Cloudflare-сумісність
```

## 3. Що відбувається під час відкриття сторінки зараз

1. Браузер запитує `/`.
2. Поточне середовище Sites передає запит у `worker/index.ts`.
3. Метод `worker.fetch(request, env, ctx)` читає URL.
4. Якщо шлях дорівнює `/_vinext/image`, викликається оптимізатор зображень.
5. Для звичайного `/` викликається `handler.fetch(request, env, ctx)` із Vinext.
6. App Router знаходить `app/layout.tsx` і `app/page.tsx`.
7. Сервер формує початковий HTML.
8. Браузер отримує HTML, CSS і JavaScript.
9. React виконує hydration: під’єднує обробники до вже видимого HTML.
10. Після hydration працюють меню, вкладки каменю, вибір категорії та форма.

Цільова production-архітектура на власному Cloudflare зробить публічні сторінки
максимально статичними й кешованими, а Worker залишить для `/api/*`, `/admin`
та інших серверних операцій. Це зменшує CPU-запити й зберігає Free-ліміти.

## 4. `Home()` у `app/page.tsx`

`Home` — React-компонент головної сторінки. Кожен його виклик повертає опис UI
у JSX. React викликає його повторно, коли змінюється один із state.

### Стан

| State | Тип | Для чого |
|---|---|---|
| `menuOpen` | boolean | чи відкрите мобільне меню |
| `activeStone` | number | індекс вибраного каменю |
| `selectedInterest` | string | значення, яке має бути у select форми |
| `submitted` | boolean | чи показувати форму або екран чернетки |

`currentStone` створюється через `useMemo`. Він бере `stones[activeStone]` і
перераховується тільки після зміни `activeStone`.

### Effect мобільного меню

`useEffect(..., [menuOpen])` запускається після зміни `menuOpen`.

- якщо меню закрите — нічого не робить;
- якщо відкрите — зберігає попередній `body.style.overflow`;
- ставить `overflow = hidden`, щоб фон не прокручувався;
- підписується на `keydown`;
- `closeOnEscape` закриває меню після Escape;
- cleanup повертає overflow і прибирає event listener.

Cleanup важливий: без нього слухачі накопичувалися б після кожного відкриття.

### `chooseInterest(value)`

1. Отримує людське значення категорії.
2. Викликає `setSelectedInterest(value)`.
3. React повторно викликає `Home`.
4. Контрольований `<select value={selectedInterest}>` показує вибір.
5. `selected-interest` показує коротке підтвердження над формою.
6. `setSubmitted(false)` повертає форму, якщо раніше показувався результат.

Посилання картки одночасно має `href="#contact"`, тому браузер прокручує до
форми без спеціальної бібліотеки. Коли з’являться товари, функція прийматиме
`categoryId` і `productId`, а не тільки текст.

### `submitForm(event)`

1. Браузер генерує submit-подію.
2. `event.preventDefault()` не дозволяє перезавантажити сторінку.
3. `setSubmitted(true)` показує екран чернетки.

Це навмисно НЕ реальна заявка. Текст прямо повідомляє, що дані не надіслано.
Після v0.2.0 ця функція викликатиме API, матиме `idle/loading/success/error`,
а success показуватиметься тільки після відповіді сервера з номером заявки.

## 5. `RevealObserver()`

1. Після hydration `useEffect` знаходить усі `[data-reveal]`.
2. Перевіряє `prefers-reduced-motion` і підтримку `IntersectionObserver`.
3. Якщо анімацію не можна/не треба запускати — одразу додає `is-visible`.
4. Інакше додає body-клас `motion-ready`.
5. Один `IntersectionObserver` стежить за всіма елементами.
6. Коли елемент входить у viewport, додається `is-visible`.
7. Елемент відписується від observer: анімація виконується один раз.
8. Cleanup відключає observer.

CSS ховає `[data-reveal]` тільки всередині `body.motion-ready`. Тому без
JavaScript текст не зникає. `--reveal-delay` на картці задає малу затримку,
не створюючи окремий observer для кожної картки.

## 6. `Icon()`

`Icon` отримує `name`, дістає відповідний SVG `<path>` зі словника `paths` і
повертає єдиний шаблон `<svg>`. Переваги:

- однакові розміри й атрибути;
- нема дублювання великого SVG-коду в `page.tsx`;
- TypeScript не дозволяє невідоме ім’я;
- `aria-hidden=true`, бо зміст кнопки вже передано текстом/aria-label.

## 7. Дані й конфігурація

### `site-config.ts`

Телефон має два представлення:

- `display` — для людини;
- `href` — технічне `tel:` без пробілів.

Коли номер зміниться, усі CTA оновляться з одного місця.

### `data/catalog.ts`

`CatalogCategory` задає контракт однієї категорії. `slug` призначений для URL,
`title` — для картки, `formValue` — для поточної форми. Після підключення БД
цей тип отримає `id`, `status`, `sortOrder`, SEO-поля та зв’язок із товарами.

## 8. Майбутній потік реальної заявки

```text
ContactForm
  -> POST /api/v1/leads
  -> parse JSON
  -> validate + normalize
  -> check rate/idempotency
  -> D1 transaction
       -> insert lead
       -> insert notification_outbox(PENDING)
  -> return 201 + public lead number
  -> ctx.waitUntil(trySendNotification)
```

Якщо Telegram не відповість, заявка не відкочується. Cron забирає PENDING або
тимчасово FAILED записи й повторює надсилання. Після граничної кількості спроб
подія стає FAILED і видима в адмінці.

### Запропоновані серверні функції

- `parseLeadRequest(request)` — безпечно читає JSON і обмежує розмір.
- `validateLeadInput(input)` — повертає людські помилки полів.
- `normalizePhone(phone)` — приводить номер до одного формату.
- `createLeadWithOutbox(db, input)` — транзакційно пише дві таблиці.
- `trySendPendingNotification(env, eventId)` — одна спроба Telegram.
- `processOutboxBatch(env)` — пакет повторних спроб із блокуванням.
- `requireAdmin(request, env)` — перевіряє сесію до будь-яких admin-даних.
- `writeAuditLog(db, action)` — фіксує важливу дію адміністратора.

## 9. Майбутня модель даних

### `leads`

`id`, `public_number`, `name`, `phone_normalized`, `category_id`, `product_id`,
snapshot назв, повідомлення, статус, source URL, created/updated timestamps.

### `notification_outbox`

`id`, `lead_id`, `channel`, `status`, `attempt_count`, `next_attempt_at`,
`locked_at`, `sent_at`, `last_error_code`. Секрет Telegram тут не зберігається.

### `products` і `categories`

Окремі стабільні ID, slug, назва, опис, видимість, порядок, режими ціни.

### `price_components` і `quotes`

Закупівельна ціна та націнка доступні лише серверу/адміну. `quote_items`
зберігають snapshot кількості, одиниці, собівартості та клієнтської ціни.

### `admin_users`, `admin_sessions`, `audit_log`

Пароль — тільки сучасний hash; cookie — HttpOnly, Secure, SameSite; сесії мають
строк дії. Кожна зміна ціни/статусу/товару потрапляє в audit log.

## 10. Безпекова межа

Усе, що прийшло з браузера, вважається неперевіреним. Навіть якщо select не
дозволяє вибрати прихований товар, зловмисник може вручну надіслати інший ID.
Тому Worker повторно перевіряє:

- довжини та формати полів;
- існування й видимість товару;
- допустимі MIME/type/розмір фото;
- rate limit та idempotency key;
- права адміністратора;
- актуальну ціну з D1.

Ніколи не потрапляють у клієнтський bundle: Telegram token, session secret,
закупівельні ціни, формули націнки, приватні нотатки й R2 service credentials.

## 11. Як пояснити проєкт на співбесіді

Коротка відповідь:

> Я розробляв бізнес-сайт на React і TypeScript для Cloudflare. Публічний
> frontend спроєктований static-first, а заявка, адмінка й розрахунки винесені
> у Worker API. Дані зберігаються в D1, файли — в R2. Для Telegram застосовано
> transactional outbox, щоб збій сповіщення не втрачав заявку. Каталог передає
> стабільні ID товарів у форму, а приватні ціни ніколи не потрапляють у браузер.
> UI має responsive layout, клавіатурну доступність і reduced-motion fallback.

Детальна відповідь має навести один конкретний ланцюжок: клік по товару →
React state → контрольована форма → API → server validation → D1 transaction →
outbox → Telegram → адмінка.
