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

### Статичний export Next.js

`next build` заздалегідь генерує HTML, CSS і JavaScript у каталозі `out/`.
Звичайне відкриття сторінки не запускає Worker: CDN віддає готові файли.
Браузер одразу бачить початковий HTML, а React після завантаження додає
інтерактивність. Vinext і Vite в цій схемі не потрібні.

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
    ui-icon.tsx              спільні SVG-іконки
    reveal-observer.tsx      появи секцій під час прокручування
  data/
    catalog.ts               категорії, камінь, FAQ, значення форми
  layout.tsx                 HTML-оболонка й SEO metadata
  page.tsx                   головна сторінка та її інтерактивний стан
  site-config.ts             контакти, робоча назва й публічна адреса
  globals.css                уся візуальна система й адаптивність
db/
  index.ts                   майбутнє створення Drizzle-клієнта для D1
  schema.ts                  D1-схема заявок і outbox
database/
  migrations/
    0000_closed_doctor_faustus.sql  перша незмінна SQL-міграція
server/
  leads/
    http.ts                  HTTP-межа, розмір, rate limit і відповіді
    repository.ts            D1 batch, idempotency та публічний номер
    validation.ts            контракт, нормалізація й валідація заявки
tests/
  rendered-html.test.mjs     smoke-перевірка зібраної сторінки
  lead-validation.test.ts    unit-тести серверної межі заявки
  lead-repository.test.ts    атомарний D1 batch і повтори
  lead-worker.test.ts        HTTP, bindings, розмір і rate limit
worker/
  index.ts                   Cloudflare Worker entrypoint тільки для API
  wrangler.jsonc             базова конфігурація сухої збірки
public/                      статичні зображення, favicon, Open Graph
.openai/hosting.json         зв’язок саме з поточним ChatGPT Sites
next.config.ts               статичний output: export
out/                         результат build; не зберігається в Git
```

## 3. Що відбувається під час відкриття сторінки зараз

1. Браузер запитує `/`.
2. Cloudflare CDN або Sites віддає готовий `out/index.html`.
3. HTML уже містить текст, посилання, форму й SEO-метадані.
4. Браузер паралельно завантажує CSS та JavaScript.
5. React виконує hydration: під’єднує обробники до вже видимого HTML.
6. Після hydration працюють меню, вкладки каменю, вибір категорії та форма.

Пізніше `POST /api/v1/leads` піде в окремий Cloudflare Worker. Тому публічний
контент не витрачає Worker CPU, а серверний код запускається лише там, де
справді потрібні перевірка, D1, Telegram або авторизація.

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

### Важливе правило для `transform`

Анімація появи тимчасово керує CSS-властивістю `transform` (`translateY`). Не
можна на тому самому елементі використовувати `transform` ще й для постійного
центрування: стан `is-visible` перезапише його. Саме так блок hero facts раніше
з’їжджав вправо. Його горизонтальне центрування тепер виконується через
`inset-inline: 0` і `margin-inline: auto`, незалежно від анімації.

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

## 12. Реалізована основа заявки у 0.1.3

`server/leads/validation.ts` уже є реальною серверною межею майбутнього API,
хоча сам HTTP endpoint поки не ввімкнений. `validateLeadInput(input)` приймає
`unknown`, тому не довіряє типам із браузера, відкидає невідомі поля й повертає
або нормалізовані дані, або структуровані коди помилок.

Поточний потік перевірки:

1. honeypot `website` має бути порожнім;
2. ім’я обрізається по краях і має довжину 2–80 символів;
3. `normalizeUkrainianPhone()` приймає `+380`, локальний `0XXXXXXXXX` або
   дев’ять цифр і зберігає тільки `+380XXXXXXXXX`;
4. `categoryId` за наявності має бути безпечним slug;
5. snapshot категорії та повідомлення мають обмежену довжину;
6. згода має бути явно `true`, а її версія фіксується як
   `lead-contact-v1`.

`db/schema.ts` уже описує дві перші таблиці. `leads.idempotency_key` має
унікальне обмеження, тому повтор одного клієнтського запиту не створить другу
заявку. `public_number` також унікальний і призначений для розмови з клієнтом.

`notification_outbox` відокремлює збереження заявки від Telegram. Складений
індекс `status + next_attempt_at + locked_at` підготовлений для атомарного
захоплення доступної пачки подій воркером. Стан `FAILED` не видаляє заявку.

Файл `database/migrations/0000_closed_doctor_faustus.sql` згенерований із цієї
схеми й не повинен редагуватися після застосування. Наступні зміни схеми
створюватимуть нові міграції.

У `.openai/hosting.json` D1 binding навмисно залишається `null`. Отже, поточний
публічний Sites не збирає персональні дані: форма як і раніше показує тільки
локальну чернетку. Binding і `POST /api/v1/leads` буде ввімкнено після
погодження згоди, строку зберігання й одержувачів Telegram.

## 13. Worker API-контур у 0.1.4

`worker/index.ts` не рендерить сайт. Він лише передає HTTP-запит у
`handleLeadApiRequest()`. Статичний frontend і надалі віддається з `out/`, тому
відвідування звичайної сторінки не запускає Worker.

### HTTP-межа

`server/leads/http.ts` виконує перевірки в чіткому порядку:

1. дозволяє тільки шлях `/api/v1/leads` і метод `POST`;
2. приймає тільки `application/json`;
3. вимагає `Idempotency-Key` довжиною 16–128 безпечних символів;
4. відмовляє з `503`, якщо D1 або rate limiter не підключені;
5. читає stream із реальною межею 16 КіБ, навіть якщо `Content-Length` збрехав;
6. викликає `validateLeadInput()`;
7. перевіряє Cloudflare rate limit за контрольованим `CF-Connecting-IP`;
8. тільки після цього передає нормалізовані дані в репозиторій.

Відповіді мають `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` і
окремий `X-Request-Id`. Лог помилки містить лише request ID та тип помилки —
без імені, телефону або повідомлення клієнта.

### Атомарне збереження

`createLeadWithOutbox()` спочатку шукає заявку за `idempotency_key`. Якщо вона
вже існує, повертає той самий `public_number`. Для нового запиту готуються два
окремі prepared statements:

1. `INSERT INTO leads ...`;
2. `INSERT INTO notification_outbox ... PENDING`.

Вони передаються в один `database.batch([...])`, який D1 виконує атомарно.
Тобто не може з’явитися заявка без outbox-події або outbox без заявки.

Унікальний індекс захищає від гонки двох однакових запитів. Якщо інший запит
встиг першим, код повторно читає готовий номер і повертає `200` із
`replayed: true`. Рідкісна колізія випадково згенерованого публічного номера
отримує до трьох спроб.

`worker/wrangler.jsonc` поки не містить реальних binding IDs. Це навмисно:
dry-run доводить, що Worker компілюється, але випадковий запуск без production
налаштувань не може приймати заявки. Публічна Sites-форма все ще локальна.
