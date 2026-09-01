# Покрокова інструкція для розробника-початківця

Команди нижче виконуються по одній. Після кожної дочекайся нового рядка з
іменем користувача й папкою. Якщо бачиш `error` або `fatal`, не запускай
наступну залежну команду — скопіюй повний текст помилки.

## 1. Що встановити на Mac

1. Встанови Git.
2. Встанови Node.js версії 22.18 або новішої.
3. Встанови IntelliJ IDEA або VS Code.
4. Не встановлюй PHP/Apache для цього проєкту: вони не потрібні.

Перевір Git:

```bash
git --version
```

Перевір Node.js:

```bash
node --version
```

Перевір npm:

```bash
npm --version
```

## 2. Відкрити вже клонований проєкт

Відкрий Terminal. Перейди в папку, де лежить проєкт. Приклад:

```bash
cd ~/Projects/kamin-korostyshiv
```

Переконайся, що це правильна папка:

```bash
git status -sb
```

На початку нової задачі очікується чистий стан без незрозумілих файлів.

## 3. Почати нову задачу

Спочатку онови відомості про GitHub:

```bash
git fetch origin
```

Перейди на main:

```bash
git switch main
```

Онови main без створення випадкового merge-коміту:

```bash
git pull --ff-only
```

Для невеликої погодженої зміни в цьому одноосібному проєкті можна працювати в
`main`: після перевірок Codex створить fast-forward commit і синхронізує його.

Для великої, ризикової або експериментальної задачі створи окрему гілку. Назву
прикладу заміни назвою задачі:

```bash
git switch -c feature/v0.1.2-static-export
```

## 4. Встановити залежності

У корені проєкту виконай:

```bash
npm ci
```

`npm ci` читає точні версії з `package-lock.json`. Не видаляй lock-файл.

## 5. Запустити сайт локально

```bash
npm run dev
```

Термінал покаже локальну адресу. Відкрий її у браузері. Термінал залишай
відкритим: у ньому працює сервер розробки.

Щоб зупинити сервер, повернися в Terminal і натисни `Control + C`.

## 6. Де змінювати найчастіші речі

- Телефон/робоча назва: `app/site-config.ts`.
- Категорії, 9 товарів, фото, матеріали й FAQ: `app/data/catalog.ts`.
- Сторінки каталогу: `app/catalog/`.
- Структура головної сторінки й поведінка: `app/page.tsx`.
- Вигляд, мобільні правила та анімації: `app/globals.css`.
- SEO title/description: `app/layout.tsx`.
- Картинки: `public/`.
- Приймання й перевірка заявки: `server/leads/`.
- Черга Telegram, повтори й backoff: `server/notifications/`.
- Turnstile: `server/security/turnstile.ts`.
- Access і admin API: `server/admin/`.
- Відокремлений кошторис: `server/estimates/calculator.ts`.
- HTTP і Cron entrypoint Cloudflare: `worker/index.ts`.

Не вставляй пароль, Telegram token або секрет Cloudflare в жоден із цих файлів.

## 7. Перевірити зміни

Спочатку статичний аналіз:

```bash
npm run lint
```

Потім типи:

```bash
npm run typecheck
```

Потім повний тест і build:

```bash
npm test
```

У версії `1.0.0` unit-тести також штучно запускають двох конкурентних Worker,
Telegram 429/503/401, зіпсовану відповідь, stale lock і шосту невдалу спробу.
Для цього не потрібен справжній Telegram token: мережевий клієнт підміняється
контрольованою тестовою функцією.

Окремі тести перевіряють Turnstile, криптографічний підпис Access JWT і те, що
клієнтський кошторис не містить слів/полів собівартості або націнки. Загалом
реліз має 4 rendered-HTML smoke-тести й 32 unit-тести.

Перевір вручну:

1. головну сторінку на комп’ютері;
2. вузький мобільний режим у DevTools;
3. меню;
4. усі якорі;
5. кнопки дзвінка;
6. `/catalog/`, усі категорії та щонайменше три різні товарні сторінки;
7. вкладки каменю;
8. форму з клавіатури;
9. режим reduced motion у системі/DevTools.

## 8. Подивитися, що саме змінилося

```bash
git status -sb
```

```bash
git diff --check
```

```bash
git diff
```

Не погоджуйся на commit, якщо бачиш чужі секрети або незрозумілі великі файли.

## 9. Зберегти роботу в Git

Додай тільки зрозумілі файли. Приклад:

```bash
git add app docs tests README.md AGENTS.md package.json package-lock.json
```

Ще раз подивись стан:

```bash
git status -sb
```

Створи commit:

```bash
git commit -m "Replace Vinext with static Next export"
```

Якщо працюєш у feature-гілці, завантаж її:

```bash
git push -u origin feature/v0.1.2-static-export
```

Якщо знову виникне відомий HTTPS RPC 400, для одного push можна застосувати:

```bash
git -c http.version=HTTP/1.1 -c http.postBuffer=10485760 push -u origin feature/v0.1.2-static-export
```

Якщо працюєш у `main`, після успішних перевірок:

```bash
git push origin main
```

Codex також публікує перевірену версію на Sites. `git push` і публікація Sites —
два окремі кроки: один не замінює інший.

Після push у `main` GitHub Actions сам повторює `npm ci`, lint, typecheck і
тести. Якщо все чисто, він створює незмінний тег із поля `version` у
`package.json`, наприклад `0.1.3` → `v0.1.3`. Тому перед кожною завершеною
версією обов’язково піднімай `package.version`; старий тег ніколи не пересувай.

Щоб пізніше підтягнути на Mac одразу всі коміти, повну історію і release-теги,
відкрий Terminal у папці `kamin-korostyshiv` та виконай по черзі:

```bash
git status -sb
```

Якщо немає незбережених локальних змін:

```bash
git fetch origin --prune --tags
```

```bash
git switch main
```

```bash
git pull --ff-only origin main
```

```bash
git log --oneline --decorate -10
```

Команда `fetch --tags` завантажує точки версій, а `pull --ff-only` не створює
випадковий merge-коміт. Хмарний Codex не може виконати ці команди на вимкненому
Mac; він зберігає готовий стан у GitHub, звідки локальний Codex його забирає.

## 10. Pull Request для великих змін

1. Відкрий GitHub.
2. Відкрий репозиторій `kamin-korostyshiv`.
3. Натисни створення Pull Request для нової гілки.
4. Перевір, що base — `main`, compare — твоя feature-гілка.
5. Опиши, що змінилось і як перевірено.
6. Для великої задачі створи Draft PR.
7. Не натискай Merge, доки зміни не перевірені.

Для дрібної перевіреної задачі PR не обов’язковий; для ризикової зміни він
залишається корисною точкою огляду й відкату.

## 11. Cloudflare — що робитимемо, коли буде акаунт

Цей блок поки є планом, а не командою «натиснути Deploy»:

1. створимо окремий акаунт Cloudflare для бізнесу;
2. увімкнемо MFA;
3. запросимо розробника окремим користувачем, а не передаватимемо пароль;
4. створимо staging і production;
5. додамо D1 та міграції;
6. додамо R2 тільки перед реальними завантаженнями;
7. секрети внесемо через Cloudflare Secrets;
8. перевіримо preview URL;
9. тільки потім під’єднаємо домен;
10. налаштуємо резервні копії, логи й сповіщення.

Точні команди, кнопки dashboard, D1/Turnstile/Access/Telegram, deploy і
відновлення вже описані в `docs/CLOUDFLARE_SETUP_UA.md`. Вибір реєстратора й
nameserver — у `docs/DOMAIN_SETUP_UA.md`. Не використовуй
`.openai/hosting.json` як конфіг власного Cloudflare: цей файл належить
поточному ChatGPT Sites.

## 12. Як читати код і вчитися

Для кожної функції відповідай собі на п’ять питань:

1. Хто її викликає?
2. Які параметри вона отримує?
3. Який state/дані читає?
4. Що змінює або повертає?
5. Яка помилка можлива?

Почни з масивів у `app/data/catalog.ts`, потім `ProductCard`, product route,
query effect у `Home`, `chooseInterest` і `submitForm`. Далі прочитай
`handleLeadApiRequest` → `verifyTurnstile` → `createLeadWithOutbox` →
`processNotificationOutbox`. Для адмінки простеж `AdminLeads` →
`handleAdminApiRequest` → `verifyAdminAccess`. Для кошторису порівняй типи
`InternalEstimate` і `ClientEstimate` та відповідний unit-тест.

## 13. Як замінити демонстраційний товар

1. Підготуй WebP приблизно 1200×800 без чужих watermark.
2. Додай файл у `public/` із зрозумілим ім’ям.
3. Знайди товар у `app/data/catalog.ts`.
4. Якщо це той самий бізнес-товар, не змінюй його `id` і `slug`.
5. Заміни `image`, `imageAlt`, title/summary/materials/options.
6. Для справжньої фотографії виконаної роботи постав `visualization: false`.
7. Не додавай ціну, доки вона не погоджена й не має серверного джерела.
8. Запусти lint, typecheck, test і перевір wide/mobile.

Повний список поточних visuals та правила їх заміни:
`docs/CONTENT_ASSUMPTIONS_UA.md`.
