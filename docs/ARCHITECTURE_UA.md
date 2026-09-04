# Архітектура й робота коду Kaminchyk

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
постійно ввімкнений Node.js-сервер. Готовий Worker:

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
  admin/                     UI списку заявок і зміни статусів
  catalog/                   каталог, category і product routes
  components/
    brand-logo.tsx           вибір затвердженого light/dark K-логотипа
    catalog-shell.tsx        спільні header/footer внутрішніх сторінок
    messenger-links.tsx      централізовані Telegram і Viber CTA
    product-card.tsx         картка товару
    ui-icon.tsx              спільні SVG-іконки
    reveal-observer.tsx      появи секцій під час прокручування
  data/
    catalog.ts               приховані/опубліковані категорії, 38 товарів, камінь і FAQ
  privacy/                   чесна політика demo/production
  robots.ts, sitemap.ts      SEO-файли зі статичного джерела даних
  layout.tsx                 HTML-оболонка й SEO metadata
  page.tsx                   головна сторінка та її інтерактивний стан
  site-config.ts             бренд, контакти, месенджери й публічна адреса
  globals.css                уся візуальна система й адаптивність
db/
  index.ts                   майбутнє створення Drizzle-клієнта для D1
  schema.ts                  D1-схема заявок, outbox і admin audit
database/
  migrations/
    0000...sql               заявки й outbox
    0001...sql               product_id
    0002...sql               admin_audit_log
    0003...sql               product_images, R2 metadata і soft-delete
server/
  admin/                     Access JWT і захищений admin API
    media.ts                 R2 upload, Images WebP і product image API
  estimates/                 internal/client calculator
  leads/
    http.ts                  HTTP-межа, розмір, rate limit і відповіді
    repository.ts            D1 batch, idempotency та публічний номер
    validation.ts            контракт, нормалізація й валідація заявки
  security/turnstile.ts      server-side anti-bot перевірка
tests/
  rendered-html.test.mjs     smoke-перевірка зібраної сторінки
  lead-validation.test.ts    unit-тести серверної межі заявки
  lead-repository.test.ts    атомарний D1 batch і повтори
  lead-worker.test.ts        HTTP, bindings, розмір і rate limit
worker/
  index.ts                   Cloudflare Worker entrypoint тільки для API
  wrangler.jsonc             базова конфігурація сухої збірки
scripts/
  prepare-product-image.mjs  локальний crop/resize WebP pipeline
  prepare-sites-release.sh   перевірена синхронізація source tree Sites
public/
  brand/kaminchyk/           12 затверджених прозорих PNG і checksums
  brand/archive/             попередня емблема та favicon
  og-kaminchyk.jpg           активний Open Graph із K-емблемою
  og.png                     попередній неактивний Open Graph
  visual-*.webp              14 тимчасових товарних/категорійних візуалізацій
  products/table-benches/*.webp
                              14 товарних візуалізацій столів і лавок
  products/lamps/*.webp      7 товарних візуалізацій лампадок
  products/vases/*.webp      6 товарних візуалізацій ваз
  products/decor/*.webp      2 товарні візуалізації декору
  products/home/*.webp       6 товарних візуалізацій виробів для дому
  stone-texture-atlas.webp   optimized atlas зразків каменю
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

У власному Cloudflare `POST /api/v1/leads` іде в окремий Worker. Тому публічний
контент не витрачає Worker CPU, а серверний код запускається лише там, де
справді потрібні перевірка, D1, Telegram або авторизація.

### Бренд і швидкі контакти

`siteConfig.brand` зберігає назву та шляхи до активної K-емблеми. Компонент
`BrandLogo` не дублює рядки шляхів у сторінках: він отримує лише `tone` й
`emblemOnly`, після чого вибирає правильний затверджений PNG. Тому майбутня
заміна активної емблеми відбувається централізовано.

`siteConfig.phone` є первинним контактом. `siteConfig.messengers` зберігає
Telegram і Viber. `MessengerLinks` повторно використовується на першому екрані,
у контактному блоці, мобільному меню та футері. Instagram навмисно не має
порожньої кнопки: його буде додано лише разом зі справжнім username.

У desktop-header номер постійно видимий. На вузькому екрані залишається
компактний номер у шапці, а під основними hero-кнопками є великий `tel:` CTA і
дві кнопки месенджерів. Так навіть людина, яка не користується формами, одразу
бачить звичний спосіб зв’язку.

## 4. `Home()` у `app/page.tsx`

`Home` — React-компонент головної сторінки. Кожен його виклик повертає опис UI
у JSX. React викликає його повторно, коли змінюється один із state.

### Стан

| State | Тип | Для чого |
|---|---|---|
| `menuOpen` | boolean | чи відкрите мобільне меню |
| `activeStone` | number | індекс вибраного каменю |
| `selectedInterest` | string | значення, яке має бути у select форми |
| `selectedProductIds` | string[] | валідні ID товарів з URL або локального вибору |
| `submitState` | union | idle/submitting/success/error |
| `publicNumber` | string | серверний номер збереженої заявки |

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

Категорійна картка веде на окрему сторінку. Товарний CTA повертає на головну з
`interest`, `productId` або `productIds` у query; effect знаходить товари в
локальному каталозі, підставляє валідний `category.formValue` у select і
створює людський snapshot. Невідомі ID не приймаються лише через довірений URL.
Кілька товарів зберігаються в `localStorage`, перший валідний ID іде в
`product_id`, а повний список назв додається до `message`, щоб не міняти D1
схему перед production-деплоєм.

### `submitForm(event)`

1. Браузер генерує submit-подію, `preventDefault()` не перезавантажує сторінку.
2. Функція збирає FormData, додає category/product ID,
   idempotency key і Turnstile token.
3. `fetch('/api/v1/leads')` отримує success лише після D1 batch.
4. UI показує `publicNumber`; будь-яка помилка переходить у `error`, а не
   імітує успішне надсилання.

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
`title` — для картки, `formValue` — для поточної форми, `published` визначає
статичну видимість. Пам’ятникові категорії зараз залишені в даних, але мають
`published: false`, тому не потрапляють на головну, у `/catalog`, static
params або sitemap.

`CatalogProduct` також має `published`. Поточний публічний набір містить
38 товарів без цін: столи/лавки, лампадки, вази, точений декор, підвіконня,
стільниці та інші вироби для дому. Усі мають `priceMode: "quote"` і
`priceLabel: "Вартість уточнюється"`. Усі 38 публічних товарів уже мають окремі
WebP-візуалізації у `public/products/*`. Фото конкурентів не копіюються; тимчасово
використовуються власні позначені візуалізації, які можна замінювати без зміни
стабільних `id`/`slug`.

`StoneMaterial` містить `texturePosition` для `public/stone-texture-atlas.webp`.
Цей atlas дає реалістичніші swatch-и Габро, Габро Premium, Покостівського,
Капустинського, Лезниківського та мармуру без окремого важкого зображення на
кожен камінь.

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
Поточний статичний frontend використовує `published` у `app/data/catalog.ts`:
вимкнені записи не потрапляють у головну, каталог, форму, static params або
sitemap. Runtime-перемикачі в адмінці не можна підключати декоративно: вони
потребують D1 і способу перевидати або динамічно віддати публічний каталог.

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

## 12. Серверна межа заявки

`server/leads/validation.ts` є реальною серверною межею API.
`validateLeadInput(input)` приймає
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

`db/schema.ts` описує `leads`, `notification_outbox` і `admin_audit_log`.
`leads.idempotency_key` має
унікальне обмеження, тому повтор одного клієнтського запиту не створить другу
заявку. `public_number` також унікальний і призначений для розмови з клієнтом.

`notification_outbox` відокремлює збереження заявки від Telegram. Складений
індекс `status + next_attempt_at + locked_at` підготовлений для атомарного
захоплення доступної пачки подій воркером. Стан `FAILED` не видаляє заявку.

Файли `database/migrations/0000...0003.sql` утворюють послідовну незмінну
історію: базові заявки/outbox → `product_id` → audit log. Застосовану міграцію
не редагують; наступна зміна схеми створює новий файл.

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
4. відмовляє з `503`, якщо D1, rate limiter або Turnstile secret не підключені;
5. читає stream із реальною межею 16 КіБ, навіть якщо `Content-Length` збрехав;
6. викликає `validateLeadInput()`;
7. перевіряє Cloudflare rate limit за контрольованим `CF-Connecting-IP`;
8. перевіряє Turnstile server-side;
9. тільки після цього передає нормалізовані дані в репозиторій.

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

## 14. Telegram outbox у 0.1.5

Outbox-процесор складається з трьох вузьких модулів:

- `server/notifications/outbox.ts` володіє SQL claim і переходами станів;
- `server/notifications/telegram.ts` форматує повідомлення та викликає Bot API;
- `server/notifications/processor.ts` поєднує доставку з retry/backoff;
- `worker/index.ts` запускає одну негайну спробу через `waitUntil` і має
  готовий `scheduled()` handler для Cron Trigger.

### Чому SELECT недостатньо

Два Worker можуть одночасно виконати SELECT і побачити одну `PENDING`-подію.
Тому право надсилати визначає не SELECT, а окремий умовний атомарний UPDATE:

```sql
UPDATE notification_outbox
SET status = 'PROCESSING',
    attempt_count = attempt_count + 1,
    locked_at = ?
WHERE id = ?
  AND (
    (status = 'PENDING' AND next_attempt_at <= ?)
    OR (status = 'PROCESSING' AND locked_at <= ?)
  )
RETURNING attempt_count;
```

Лише Worker, який отримав рядок із `RETURNING`, продовжує доставку. Тест
запускає два claim паралельно й підтверджує, що сумарно подію отримує один.

### Lease і аварійне відновлення

`locked_at` є одночасно часом і токеном lease. Через п’ять хвилин
`PROCESSING` вважається застарілим і може бути захоплений новим Worker. Кожен
фінальний UPDATE перевіряє `id + status='PROCESSING' + locked_at`. Якщо старий
Worker прокинувся після повторного claim, його запис не застосовується й
лічиться як `lostLease`.

Це гарантує at-least-once, а не exactly-once доставку. Після невизначеного
мережевого результату можливий повтор Telegram; унікальний `public_number` у
повідомленні дозволяє майстру розпізнати дубль.

### Стани та повтори

| Результат | Новий стан | Наступна дія |
|---|---|---|
| Telegram підтвердив `ok: true` | `SENT` | більше не обробляти |
| мережа, 408, 429 або 5xx | `PENDING` | 1 хв → 5 хв → 15 хв → 1 год → 6 год |
| 429 із `retry_after` | `PENDING` | не раніше більшого з backoff і `retry_after` |
| 4xx на кшталт 400/401/403 | `FAILED` | ручне виправлення конфігурації |
| будь-яка невдача на 6-й спробі | `FAILED` | перевірити через адмінський контур |

`FAILED` є остаточним і автоматично не claim-иться. Сира відповідь Telegram,
bot token, ім’я, телефон і повідомлення не логуються. До Bot API передається
HTML, але всі поля заявки спочатку екрануються.

### Fail-closed конфігурація

`processNotificationOutbox()` перевіряє `DB`, `TELEGRAM_BOT_TOKEN` і
`TELEGRAM_CHAT_ID` до читання черги. Якщо хоча б одного binding немає, він
повертає лише технічний код `NOTIFICATION_SERVICE_NOT_CONFIGURED` і не
захоплює рядки. Поточний Sites залишається статичним, тому ці secrets у нього
не додані, реальна форма нічого не надсилає.

## 15. Каталог і статичні маршрути

`app/data/catalog.ts` є єдиним публічним джерелом demo-каталогу. `Category` і
`Product` мають стабільні `id`, окремий `slug`, людський title, image/alt,
materials/options і режим ціни. Поточний локальний кандидат має 5 публічних
категорій і 38 публічних товарів; пам’ятникові категорії лишаються в даних із
`published: false`. Усі публічні товари мають `priceMode: "quote"` та
`requiresManualReview: false` за замовчуванням; усі публічні категорії вже мають окремі товарні
WebP-візуалізації: `Столи та лавки` — 14, `Лампадки` — 7, `Вази` — 6,
`Інший декор` — 2, `Камінь для дому` — 9.

`generateStaticParams()` перебирає масиви під час build. Next створює HTML для
кожної категорії й кожного товару ще до deploy. `generateMetadata()` формує
canonical/OG із тих самих даних, тому заголовок і картка не розходяться.
`sitemap.ts` також перебирає ці самі ID/slug.

`ProductCard` не знає приватної бізнес-логіки: отримує готовий `Product`,
створює посилання, показує `+ / ✓` через `ProductInterestControl` і додає
нижній action `Оформлення`. На detail page CTA додає `productIds` до query.
Якщо фото пізніше замінюється, ID заявки не змінюється.

## 16. Turnstile і порядок приймання заявки

Порядок у `handleLeadApiRequest()` навмисно такий:

1. route/method/content type/idempotency;
2. наявність D1, rate limiter і Turnstile secret;
3. обмежене читання JSON до 16 КіБ;
4. серверна нормалізація полів і honeypot;
5. rate limit за `CF-Connecting-IP`;
6. `verifyTurnstile()` через `siteverify` з timeout;
7. атомарне D1-збереження й outbox;
8. фоновий Telegram тільки для успішного `/api/v1/leads`.

Rate limit стоїть перед зовнішнім siteverify, щоб заблокований IP не витрачав
додаткові subrequests. Водночас body/validation стоять раніше, щоб не витрачати
квоту на явно некоректний JSON. Без secret, binding або доступного Turnstile
API код відмовляє; success без D1 неможливий.

## 17. Cloudflare Access і `/admin`

Публічний `out/admin/index.html` сам не містить даних. Він лише пробує GET
`/api/v1/admin/leads`. У Sites API відсутній, тому UI чесно показує demo-state.

У production Cloudflare Access перехоплює `/admin*` і `/api/v1/admin/*`.
`verifyAdminAccess()` потім:

1. читає `Cf-Access-Jwt-Assertion`;
2. декодує header/payload, але ще не довіряє їм;
3. завантажує JWK з team domain;
4. перевіряє RS256 signature через Web Crypto;
5. звіряє audience, expiry і `ADMIN_EMAILS`;
6. повертає нормалізований email або fail-closed код.

GET повертає до 100 заявок. PATCH дозволяє тільки визначені статуси, читає
попередній стан і виконує batch `UPDATE lead + INSERT admin_audit_log`.
Frontend не може обійти цю перевірку приховуванням кнопки.

## 18. Внутрішній і клієнтський кошторис

`calculateInternalEstimate(request, priceBook)` запускається тільки на сервері.
Price book містить `costMinor`, `markupBps`, version і rounding. Кожне число
перевіряється як safe integer, кількість обмежена, а відсутній код додає причину
ручної перевірки замість fallback-ціни.

Результат `InternalEstimate` не є API-відповіддю. Єдиний дозволений перехід —
`toClientEstimate(internal)`. Він будує нові objects із дозволеним набором
полів. Тест серіалізує результат і забороняє слова `cost` та `markup`. Реальний
price book не додається в Git: його створюють у приватному D1/admin після
погодження з майстром.

## 19. Два режими одного коду

| Режим | Статика | Заявка | Адмінка | Дані |
|---|---|---|---|---|
| Sites/static preview | повний сайт і каталог | вимкнена без Turnstile/API | unavailable-state | не збираються |
| Власний Cloudflare | ті самі assets | Turnstile → Worker → D1 | Access → API | D1 + secrets |

Публічна форма активується на build через `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, але
це не замінює серверну готовність. Без D1, rate-limit binding, Turnstile secret
і Telegram secrets Worker правильно поверне 503 або помилку перевірки.
Покрокова активація описана в `docs/CLOUDFLARE_SETUP_UA.md`.
