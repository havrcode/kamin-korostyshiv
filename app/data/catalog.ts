export type PriceMode = "quote";

export type CatalogCategory = {
  id: string;
  published: boolean;
  slug: string;
  title: string;
  formValue: string;
  text: string;
  image: string;
  imagePosition: string;
  mobileImagePosition: string;
  tag: string;
};

export type CatalogProduct = {
  id: string;
  published: boolean;
  categoryId: string;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  materials: readonly string[];
  options: readonly string[];
  priceMode: PriceMode;
  priceLabel: string;
  requiresManualReview: boolean;
  visualization: boolean;
};

export type StoneMaterial = {
  name: string;
  origin: string;
  color: string;
  grain: string;
  texturePosition: string;
};

export type ProductSelectionSummary = {
  productIds: string[];
  productLabels: string[];
  primaryProductId: string;
  categoryId: string | null;
  categoryValue: string;
  label: string;
  messageLine: string;
};

type ProductInput = {
  id: string;
  published?: boolean;
  requiresManualReview?: boolean;
  categoryId: string;
  slug: string;
  title: string;
  shortTitle?: string;
  summary: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  materials?: readonly string[];
  options?: readonly string[];
  priceLabel?: string;
};

type CategoryPresentation = {
  image: string;
  imageAlt: string;
  materials: readonly string[];
  options: readonly string[];
};

const tableMaterials = ["Габро", "Габро Premium", "Покостівський граніт"] as const;
const decorMaterials = ["Габро", "Габро Premium", "Покостівський граніт"] as const;
const homeMaterials = ["Габро", "Габро Premium", "Покостівський граніт", "Мармур за погодженням"] as const;

const tableOptions = ["Розмір під ділянку", "Полірована або матова поверхня", "Прямий чи заокруглений край", "Монтаж за домовленістю"] as const;
const simpleDecorOptions = ["Висота", "Вид каменю (уточнюємо)"] as const;
const homeOptions = ["Точний замір", "Профіль краю", "Вирізи за шаблоном", "Доставка й монтаж"] as const;
export const deliveryOptions = ["Доставимо Новою поштою, Делівері та іншими службами доставки", "Можливий самовивіз за попередньою домовленістю"] as const;

const presentationByCategory: Record<string, CategoryPresentation> = {
  "cat-single": {
    image: "/visual-single.webp",
    imageAlt: "Візуалізація прихованого одинарного пам’ятника",
    materials: ["Габро", "Покостівський граніт"] as const,
    options: ["Форма стели", "Портрет", "Напис", "Квітник"] as const,
  },
  "cat-family": {
    image: "/visual-double.webp",
    imageAlt: "Візуалізація прихованого родинного пам’ятника",
    materials: ["Габро", "Покостівський граніт"] as const,
    options: ["Два портрети", "Центральна вставка", "Подвійна плита", "Оздоблення"] as const,
  },
  "cat-complex": {
    image: "/visual-complex.webp",
    imageAlt: "Візуалізація прихованого меморіального комплексу",
    materials: ["Габро", "Покостівський граніт"] as const,
    options: ["Стела", "Плити", "Бордюри", "Декор"] as const,
  },
  "cat-table-benches": {
    image: "/visual-table-bench-v2.webp",
    imageAlt: "Візуалізація гранітного столу з лавкою",
    materials: tableMaterials,
    options: tableOptions,
  },
  "cat-lamps": {
    image: "/visual-lamps.webp",
    imageAlt: "Візуалізація лампадки поруч із виробами з натурального каменю",
    materials: decorMaterials,
    options: simpleDecorOptions,
  },
  "cat-vases": {
    image: "/visual-vases.webp",
    imageAlt: "Візуалізація полірованої вази з натурального каменю",
    materials: decorMaterials,
    options: simpleDecorOptions,
  },
  "cat-decor": {
    image: "/visual-decor.webp",
    imageAlt: "Візуалізація точеного кам’яного декору",
    materials: decorMaterials,
    options: simpleDecorOptions,
  },
  "cat-home": {
    image: "/visual-home-interior-v2.webp",
    imageAlt: "Візуалізація сучасної кухні-вітальні з кам’яною стільницею та підвіконням",
    materials: homeMaterials,
    options: homeOptions,
  },
};

/**
 * Публічний каталог Kaminchyk.
 *
 * Пам'ятникові категорії зараз лишаються в даних, але приховані через
 * `published: false`. Нові товари є чесними візуалізаціями/стартовими
 * позиціями без цін; остаточна форма, камінь, розміри й наявність
 * підтверджуються продавцем перед прорахунком.
 */
export const categories: CatalogCategory[] = [
  {
    id: "cat-single",
    published: false,
    slug: "odynarni-pamiatnyky",
    title: "Одинарні пам’ятники",
    formValue: "Одинарний пам’ятник",
    text: "Тимчасово приховано до погодження публічного асортименту пам’ятників",
    image: "/visual-single.webp",
    imagePosition: "48% 48%",
    mobileImagePosition: "48% 50%",
    tag: "Приховано",
  },
  {
    id: "cat-family",
    published: false,
    slug: "rodynni-pamiatnyky",
    title: "Родинні пам’ятники",
    formValue: "Подвійний або родинний пам’ятник",
    text: "Тимчасово приховано до погодження публічного асортименту пам’ятників",
    image: "/visual-double.webp",
    imagePosition: "50% 49%",
    mobileImagePosition: "50% 50%",
    tag: "Приховано",
  },
  {
    id: "cat-complex",
    published: false,
    slug: "memorialni-kompleksy",
    title: "Меморіальні комплекси",
    formValue: "Меморіальний комплекс",
    text: "Тимчасово приховано до погодження публічного асортименту пам’ятників",
    image: "/visual-complex.webp",
    imagePosition: "48% 50%",
    mobileImagePosition: "42% 50%",
    tag: "Приховано",
  },
  {
    id: "cat-table-benches",
    published: true,
    slug: "stoly-ta-lavky",
    title: "Столи та лавки",
    formValue: "Стіл або лавка з граніту",
    text: "Гранітні столи, кам’яні лавки та готові комплекти для облаштування ділянки",
    image: "/visual-table-bench-v2.webp",
    imagePosition: "50% 50%",
    mobileImagePosition: "50% 50%",
    tag: "14 виробів",
  },
  {
    id: "cat-lamps",
    published: true,
    slug: "lampadky",
    title: "Лампадки",
    formValue: "Лампадка",
    text: "Металеві та кам’яні лампадки, які підбираються під плиту й загальну композицію",
    image: "/visual-lamps.webp",
    imagePosition: "50% 50%",
    mobileImagePosition: "50% 50%",
    tag: "7 моделей",
  },
  {
    id: "cat-vases",
    published: true,
    slug: "vazy",
    title: "Вази",
    formValue: "Ваза з каменю",
    text: "Кам’яні та гранітні вази з натурального каменю різної форми та висоти",
    image: "/visual-vases.webp",
    imagePosition: "50% 50%",
    mobileImagePosition: "50% 50%",
    tag: "6 моделей",
  },
  {
    id: "cat-decor",
    published: true,
    slug: "dekor-z-kameniu",
    title: "Інший декор",
    formValue: "Інший елемент декору",
    text: "Гранітний декор: точені балясини, кулі та додаткові елементи для завершення композиції",
    image: "/visual-decor.webp",
    imagePosition: "50% 50%",
    mobileImagePosition: "50% 50%",
    tag: "Точені вироби",
  },
  {
    id: "cat-home",
    published: true,
    slug: "kamin-dlia-domu",
    title: "Камінь для дому",
    formValue: "Виріб із каменю для дому",
    text: "Кам’яні вироби для дому: гранітні підвіконня, стільниці, полиці та інші точні деталі для інтер’єру",
    image: "/visual-home-interior-v2.webp",
    imagePosition: "55% 55%",
    mobileImagePosition: "55% 55%",
    tag: "9 виробів",
  },
];

const hiddenMonumentProducts: ProductInput[] = [
  {
    id: "prod-single-vertical",
    published: false,
    categoryId: "cat-single",
    slug: "vertikal-klasyka",
    title: "Вертикаль «Стримана класика»",
    shortTitle: "Вертикаль на один портрет",
    summary: "Лаконічна вертикальна стела з м’яким асиметричним завершенням.",
  },
  {
    id: "prod-single-cross",
    published: false,
    categoryId: "cat-single",
    slug: "khrest-lakonichnyi",
    title: "Хрест «Лаконічний»",
    shortTitle: "Гранітний пам’ятник-хрест",
    summary: "Стриманий монолітний хрест на масивній підставці.",
  },
  {
    id: "prod-family-double",
    published: false,
    categoryId: "cat-family",
    slug: "horyzontal-na-dvokh",
    title: "Горизонталь «На двох»",
    shortTitle: "Композиція на два портрети",
    summary: "Дві збалансовані стели, об’єднані спільною основою.",
  },
  {
    id: "prod-family-triple",
    published: false,
    categoryId: "cat-family",
    slug: "rodynna-na-trokh",
    title: "Родинна «На трьох»",
    shortTitle: "Композиція на три портрети",
    summary: "Три стели в єдиному ритмі з контрастними кам’яними вставками.",
  },
  {
    id: "prod-complex-complete",
    published: false,
    categoryId: "cat-complex",
    slug: "kompleks-tsilisnyi",
    title: "Комплекс «Цілісний»",
    shortTitle: "Повне облаштування ділянки",
    summary: "Стела, плита, облицювання, бордюри, ваза й лавка в одному проєкті.",
  },
];

const publicProductInputs: ProductInput[] = [
  {
    id: "prod-table-bench-1",
    categoryId: "cat-table-benches",
    slug: "stil-z-lavkoiu-1",
    title: "Стіл з лавкою № 1",
    summary: "Класичний комплект із прямокутним столом і прямою лавкою.",
    image: "/products/table-benches/stil-z-lavkoiu-1.webp",
    imageAlt: "Візуалізація прямокутного гранітного столу з прямою лавкою № 1",
  },
  {
    id: "prod-table-bench-2",
    categoryId: "cat-table-benches",
    slug: "stil-z-lavkoiu-2",
    title: "Стіл з лавкою № 2",
    summary: "Комплект із більш масивною основою та спокійною геометрією.",
    image: "/products/table-benches/stil-z-lavkoiu-2.webp",
    imageAlt: "Візуалізація прямокутного гранітного столу з лавкою № 2 та м’яко заокругленими краями",
  },
  {
    id: "prod-table-bench-3",
    categoryId: "cat-table-benches",
    slug: "stil-z-lavkoiu-3",
    title: "Стіл з лавкою № 3",
    summary: "Комплект із виразнішою стільницею та полірованою посадковою плитою.",
    image: "/products/table-benches/stil-z-lavkoiu-3.webp",
    imageAlt: "Візуалізація овального гранітного столу з лавкою № 3 на точених опорах",
  },
  {
    id: "prod-table-bench-4",
    categoryId: "cat-table-benches",
    slug: "stil-z-lavkoiu-4",
    title: "Стіл з лавкою № 4",
    summary: "Компактний комплект для акуратного розміщення на невеликій ділянці.",
    image: "/products/table-benches/stil-z-lavkoiu-4.webp",
    imageAlt: "Візуалізація круглого гранітного столу з короткою дуговою лавкою № 4",
  },
  {
    id: "prod-table-bench-5",
    categoryId: "cat-table-benches",
    slug: "stil-z-lavkoiu-5",
    title: "Стіл з лавкою № 5",
    summary: "Комплект із можливістю зробити контрастні кам’яні акценти.",
    image: "/products/table-benches/stil-z-lavkoiu-5.webp",
    imageAlt: "Візуалізація круглого гранітного столу з широкою півкруглою лавкою № 5",
  },
  {
    id: "prod-table-1",
    categoryId: "cat-table-benches",
    slug: "stil-1",
    title: "Стіл № 1",
    summary: "Окремий прямокутний стіл із полірованою верхньою площиною.",
    image: "/products/table-benches/stil-1.webp",
    imageAlt: "Візуалізація прямокутного гранітного столу № 1 на двох прямокутних опорах",
  },
  {
    id: "prod-table-2",
    categoryId: "cat-table-benches",
    slug: "stil-2",
    title: "Стіл № 2",
    summary: "Стіл із лаконічними опорами та можливим заокругленням краю.",
    image: "/products/table-benches/stil-2.webp",
    imageAlt: "Візуалізація прямокутного гранітного столу № 2 із пом’якшеними кутами на двох квадратних опорах",
  },
  {
    id: "prod-table-3",
    categoryId: "cat-table-benches",
    slug: "stil-3",
    title: "Стіл № 3",
    summary: "Окремий стіл зі спокійнішою округленою пластикою форми.",
    image: "/products/table-benches/stil-3.webp",
    imageAlt: "Візуалізація овального гранітного столу № 3 на двох точених опорах",
  },
  {
    id: "prod-table-4",
    categoryId: "cat-table-benches",
    slug: "stil-4",
    title: "Стіл № 4",
    summary: "Компактний окремий стіл для невеликої зони відпочинку.",
    image: "/products/table-benches/stil-4.webp",
    imageAlt: "Візуалізація круглого гранітного столу № 4 на одній точеній опорі",
  },
  {
    id: "prod-bench-1",
    categoryId: "cat-table-benches",
    slug: "lavka-1",
    title: "Лавка № 1",
    summary: "Пряма гранітна лавка з полірованою посадковою поверхнею.",
    image: "/products/table-benches/lavka-1.webp",
    imageAlt: "Візуалізація прямої гранітної лавки № 1 на двох квадратних опорах",
  },
  {
    id: "prod-bench-2",
    categoryId: "cat-table-benches",
    slug: "lavka-2",
    title: "Лавка № 2",
    summary: "Пряма лавка з легким заокругленням усіх кутів і простими квадратними опорами.",
    image: "/products/table-benches/lavka-2.webp",
    imageAlt: "Візуалізація прямої гранітної лавки № 2 з ледь заокругленими кутами на двох квадратних опорах",
  },
  {
    id: "prod-bench-3",
    categoryId: "cat-table-benches",
    slug: "lavka-3",
    title: "Лавка № 3",
    summary: "Подовжена лавка з рівним стриманим силуетом.",
    image: "/products/table-benches/lavka-3.webp",
    imageAlt: "Візуалізація овальної гранітної лавки № 3 на двох точених опорах",
  },
  {
    id: "prod-bench-4",
    categoryId: "cat-table-benches",
    slug: "lavka-4",
    title: "Лавка № 4",
    summary: "Лавка з можливістю контрастної кам’яної вставки.",
    image: "/products/table-benches/lavka-4.webp",
    imageAlt: "Візуалізація дугової гранітної лавки № 4 на двох точених опорах",
  },
  {
    id: "prod-bench-5",
    categoryId: "cat-table-benches",
    slug: "lavka-5",
    title: "Лавка № 5",
    summary: "Компактна лавка для невеликого проходу або окремої зони.",
    image: "/products/table-benches/lavka-5.webp",
    imageAlt: "Візуалізація широкої півкруглої гранітної лавки № 5 на трьох точених опорах",
  },
  {
    id: "prod-lamp-6",
    categoryId: "cat-lamps",
    slug: "lampadka-6",
    title: "Лампадка № 6",
    summary: "Висока лампадка з металевим корпусом і прозорими площинами.",
    image: "/products/lamps/lampadka-6.webp",
    imageAlt: "Візуалізація прямокутної чорної гранітної лампадки № 6 зі скляними площинами",
  },
  {
    id: "prod-lamp-4",
    categoryId: "cat-lamps",
    slug: "lampadka-4",
    title: "Лампадка № 4",
    summary: "Стримана лампадка для класичної кам’яної композиції.",
    image: "/products/lamps/lampadka-4.webp",
    imageAlt: "Візуалізація круглої чорної гранітної лампадки № 4 з хрестом і склом",
  },
  {
    id: "prod-lamp-3",
    categoryId: "cat-lamps",
    slug: "lampadka-3",
    title: "Лампадка № 3",
    summary: "Компактна модель для невеликої плити або додаткового декору.",
    image: "/products/lamps/lampadka-3.webp",
    imageAlt: "Візуалізація високої прямокутної чорної гранітної лампадки № 3 зі склом",
  },
  {
    id: "prod-lamp-2",
    categoryId: "cat-lamps",
    slug: "lampadka-2",
    title: "Лампадка № 2",
    summary: "Невисока лампадка для поєднання з вазою або квітником.",
    image: "/products/lamps/lampadka-2.webp",
    imageAlt: "Візуалізація чорної гранітної лампадки № 2 зі скошеною кришкою і свічкою",
  },
  {
    id: "prod-lamp-1-bronze",
    categoryId: "cat-lamps",
    slug: "lampadka-1-bronza",
    title: "Лампадка № 1 — бронза",
    shortTitle: "Лампадка № 1",
    summary: "Класична кругла лампадка з теплим червоно-бронзовим відтінком каменю.",
    image: "/products/lamps/lampadka-1-bronze.webp",
    imageAlt: "Візуалізація круглої лампадки № 1 з червоно-бронзовим каменем, хрестом і арочними прорізами",
  },
  {
    id: "prod-lamp-1-gray",
    categoryId: "cat-lamps",
    slug: "lampadka-1-sira",
    title: "Лампадка № 1 — сіра",
    shortTitle: "Лампадка № 1",
    summary: "Світліша модель для композицій із сірим або комбінованим каменем.",
    image: "/products/lamps/lampadka-1-gray.webp",
    imageAlt: "Візуалізація круглої сірої гранітної лампадки № 1 з хрестом і арочними прорізами",
  },
  {
    id: "prod-lamp-1-black",
    categoryId: "cat-lamps",
    slug: "lampadka-1-chorna",
    title: "Лампадка № 1 — чорна",
    shortTitle: "Лампадка № 1",
    summary: "Темна модель для габро та мінімалістичних композицій.",
    image: "/products/lamps/lampadka-1-black.webp",
    imageAlt: "Візуалізація круглої чорної гранітної лампадки № 1 з хрестом і арочними прорізами",
  },
  {
    id: "prod-vase-6",
    categoryId: "cat-vases",
    slug: "vaza-6",
    title: "Ваза № 6",
    summary: "Висока полірована ваза з виразною вертикальною формою.",
    image: "/products/vases/vaza-6.webp",
    imageAlt: "Візуалізація групи гранчастих гранітних ваз № 6 у різних розмірах і видах каменю",
  },
  {
    id: "prod-vase-5",
    categoryId: "cat-vases",
    slug: "vaza-5",
    title: "Ваза № 5",
    summary: "Стримана ваза з рівним силуетом для класичної композиції.",
    image: "/products/vases/vaza-5.webp",
    imageAlt: "Візуалізація групи фасетованих гранітних ваз № 5 у різних розмірах і видах каменю",
  },
  {
    id: "prod-vase-4",
    categoryId: "cat-vases",
    slug: "vaza-4",
    title: "Ваза № 4",
    summary: "Ваза з м’якою округлою формою та широкою верхньою частиною.",
    image: "/products/vases/vaza-4.webp",
    imageAlt: "Візуалізація групи гладких гранітних ваз № 4 у різних розмірах і видах каменю",
  },
  {
    id: "prod-vase-3",
    categoryId: "cat-vases",
    slug: "vaza-3",
    title: "Ваза № 3",
    summary: "Класична ваза середнього розміру для більшості композицій.",
    image: "/products/vases/vaza-3.webp",
    imageAlt: "Візуалізація групи класичних точених гранітних ваз № 3 у різних розмірах і видах каменю",
  },
  {
    id: "prod-vase-2",
    categoryId: "cat-vases",
    slug: "vaza-2",
    title: "Ваза № 2",
    summary: "Нижча ваза для компактної плити або парного розміщення.",
    image: "/products/vases/vaza-2.webp",
    imageAlt: "Візуалізація групи гладких високих гранітних ваз № 2 у різних розмірах і видах каменю",
  },
  {
    id: "prod-vase-1",
    categoryId: "cat-vases",
    slug: "vaza-1",
    title: "Ваза № 1",
    summary: "Мінімалістична базова ваза для спокійного завершення композиції.",
    image: "/products/vases/vaza-1.webp",
    imageAlt: "Візуалізація групи класичних компактних гранітних ваз № 1 у різних розмірах і видах каменю",
  },
  {
    id: "prod-baluster-1",
    categoryId: "cat-decor",
    slug: "baliasyna-1",
    title: "Балясина № 1",
    summary: "Точений кам’яний елемент для декоративного завершення конструкції.",
    image: "/products/decor/baliasyna-1.webp",
    imageAlt: "Візуалізація групи точених гранітних балясин № 1 у різних розмірах і видах каменю",
  },
  {
    id: "prod-stone-ball-1",
    categoryId: "cat-decor",
    slug: "kulia-1",
    title: "Куля № 1",
    summary: "Полірована кам’яна куля для акценту, завершення стовпчика або декору.",
    image: "/products/decor/kulia-1.webp",
    imageAlt: "Візуалізація групи полірованих гранітних куль № 1 у різних розмірах і видах каменю",
  },
  {
    id: "prod-windowsill-straight",
    categoryId: "cat-home",
    slug: "pidvikonnia-priame",
    title: "Підвіконня пряме",
    summary: "Пряме кам’яне підвіконня за точними розмірами отвору.",
    image: "/products/home/pidvikonnia-priame.webp",
    imageAlt: "Візуалізація прямого полірованого кам’яного підвіконня з рівним краєм",
  },
  {
    id: "prod-windowsill-rounded",
    categoryId: "cat-home",
    slug: "pidvikonnia-zaokruhlene",
    title: "Підвіконня заокруглене",
    summary: "Підвіконня з м’яким радіусом або заокругленими кутами.",
    image: "/products/home/pidvikonnia-zaokruhlene.webp",
    imageAlt: "Візуалізація кам’яного підвіконня із заокругленими передніми кутами",
  },
  {
    id: "prod-windowsill-profiled",
    categoryId: "cat-home",
    slug: "pidvikonnia-z-profilem",
    title: "Підвіконня з профілем",
    summary: "Виріб із виразнішим фасадним краєм або складнішою геометрією.",
    image: "/products/home/pidvikonnia-z-profilem.webp",
    imageAlt: "Візуалізація кам’яного підвіконня з декоративним профільованим фасадним краєм",
  },
  {
    id: "prod-countertop-straight",
    categoryId: "cat-home",
    slug: "stilnytsia-priama",
    title: "Стільниця пряма",
    summary: "Пряма стільниця для кухні, ванної або робочої поверхні.",
    image: "/products/home/stilnytsia-priama.webp",
    imageAlt: "Візуалізація прямої полірованої кам’яної стільниці в сучасній кухні",
  },
  {
    id: "prod-countertop-sink",
    categoryId: "cat-home",
    slug: "stilnytsia-z-vyrizom",
    title: "Стільниця з вирізом",
    summary: "Стільниця з вирізом під мийку, варильну поверхню або змішувач.",
    image: "/products/home/stilnytsia-z-vyrizom.webp",
    imageAlt: "Візуалізація кам’яної стільниці з вирізом під мийку та отвором під змішувач",
  },
  {
    id: "prod-countertop-corner",
    categoryId: "cat-home",
    slug: "stilnytsia-kutova",
    title: "Стільниця кутова",
    summary: "Кутова або складена стільниця зі стиками за реальним планом приміщення.",
    image: "/products/home/stilnytsia-kutova.webp",
    imageAlt: "Візуалізація кутової L-подібної кам’яної стільниці в сучасній кухні",
  },
  {
    id: "prod-bathroom-countertop",
    categoryId: "cat-home",
    slug: "stilnytsia-u-vannu",
    title: "Стільниця у ванну",
    summary: "Кам’яна стільниця для тумби у ванній з вирізом або накладною раковиною.",
    image: "/products/home/stilnytsia-u-vannu.webp",
    imageAlt: "Візуалізація кам’яної стільниці у ванну з вирізом під раковину",
  },
  {
    id: "prod-fireplace-mantel",
    categoryId: "cat-home",
    slug: "kaminna-polytsia",
    title: "Камінна полиця",
    summary: "Полірована камінна полиця або верхня плита для порталу за розмірами.",
    image: "/products/home/kaminna-polytsia.webp",
    imageAlt: "Візуалізація полірованої камінної полиці з натурального каменю",
  },
  {
    id: "prod-stone-backsplash",
    categoryId: "cat-home",
    slug: "kamianyi-fartukh",
    title: "Кам’яний фартух",
    summary: "Облицювання робочої зони кухні кам’яними плитами з точним припасуванням.",
    image: "/products/home/kamianyi-fartukh.webp",
    imageAlt: "Візуалізація кам’яного кухонного фартуха з натурального каменю",
  },
];

function quoteProduct(input: ProductInput): CatalogProduct {
  const presentation = presentationByCategory[input.categoryId];
  if (!presentation) throw new Error(`Unknown catalog category: ${input.categoryId}`);

  return {
    id: input.id,
    published: input.published ?? true,
    categoryId: input.categoryId,
    slug: input.slug,
    title: input.title,
    shortTitle: input.shortTitle ?? input.title,
    summary: input.summary,
    description:
      input.description
      ?? `${input.summary} Остаточні розміри, товщина, камінь, обробка, доставка й монтаж уточнюються перед прорахунком.`,
    image: input.image ?? presentation.image,
    imageAlt: input.imageAlt ?? presentation.imageAlt,
    materials: input.materials ?? presentation.materials,
    options: input.options ?? presentation.options,
    priceMode: "quote",
    priceLabel: input.priceLabel ?? "Вартість уточнюється",
    requiresManualReview: input.requiresManualReview ?? false,
    visualization: true,
  };
}

export const products: CatalogProduct[] = [
  ...hiddenMonumentProducts,
  ...publicProductInputs,
].map(quoteProduct);

export const publishedCategories = categories.filter((category) => category.published);

export const publishedProducts = products.filter(
  (product) => product.published
    && publishedCategories.some((category) => category.id === product.categoryId),
);

export const interestOptions = [
  ...publishedCategories.map(({ formValue }) => formValue),
  "Підбір каменю",
  "Інший виріб",
];

export function getCategory(slug: string) {
  return publishedCategories.find((category) => category.slug === slug);
}

export function getCategoryById(id: string) {
  return publishedCategories.find((category) => category.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return publishedProducts.filter((product) => product.categoryId === categoryId);
}

export function getProduct(categoryId: string, productSlug: string) {
  return publishedProducts.find(
    (product) => product.categoryId === categoryId && product.slug === productSlug,
  );
}

export function isPublishedProductId(productId: string) {
  return publishedProducts.some((product) => product.id === productId);
}

export function resolveProductSelection(productId: string, interest: string | null) {
  const product = publishedProducts.find(({ id }) => id === productId);
  const category = product && publishedCategories.find(({ id }) => id === product.categoryId);
  if (!product || !category) return null;
  return {
    productId: product.id,
    categoryValue: category.formValue,
    label: (interest?.trim() || product.title).slice(0, 120),
  };
}

function productCountLabel(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit === 1 && lastTwoDigits !== 11) return `${count} товар`;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${count} товари`;
  }
  return `${count} товарів`;
}

export function resolveProductSelections(productIds: readonly string[]): ProductSelectionSummary | null {
  const seen = new Set<string>();
  const selected = productIds.flatMap((productId) => {
    if (seen.has(productId)) return [];
    seen.add(productId);
    const product = publishedProducts.find((item) => item.id === productId);
    const category = product && publishedCategories.find((item) => item.id === product.categoryId);
    return product && category ? [{ product, category }] : [];
  });

  if (selected.length === 0) return null;

  const categoryIds = new Set(selected.map(({ category }) => category.id));
  const sharedCategory = categoryIds.size === 1 ? selected[0].category : null;
  const label = selected.length === 1
    ? selected[0].product.title
    : `Оформлення: ${productCountLabel(selected.length)}`;
  const productLabels = selected.map(({ category, product }) => `${category.title}: ${product.title}`);
  const messageLine = `Обрані товари: ${productLabels.join("; ")}`;

  return {
    productIds: selected.map(({ product }) => product.id),
    productLabels,
    primaryProductId: selected[0].product.id,
    categoryId: sharedCategory?.id ?? null,
    categoryValue: sharedCategory?.formValue ?? "Інший виріб",
    label,
    messageLine,
  };
}

export const stones: StoneMaterial[] = [
  {
    name: "Габро",
    origin: "Чорний із природними теплими вкрапленнями",
    color: "#161719",
    grain: "#3a3027",
    texturePosition: "0% 0%",
  },
  {
    name: "Габро Premium",
    origin: "Глибокий рівний чорний",
    color: "#0f1011",
    grain: "#34363a",
    texturePosition: "50% 0%",
  },
  {
    name: "Покостівський",
    origin: "Стриманий сірий граніт",
    color: "#777a7b",
    grain: "#b5b5af",
    texturePosition: "100% 0%",
  },
  {
    name: "Капустинський",
    origin: "Теплий червоно-коричневий",
    color: "#8a4b32",
    grain: "#d0a080",
    texturePosition: "0% 100%",
  },
  {
    name: "Лезниківський",
    origin: "Насичений червоний граніт",
    color: "#8f3d32",
    grain: "#d39a7a",
    texturePosition: "50% 100%",
  },
  {
    name: "Мармур",
    origin: "Світлий природний малюнок",
    color: "#d7d4cc",
    grain: "#9b9a95",
    texturePosition: "100% 100%",
  },
];

export const faqs = [
  [
    "Чому в каталозі немає цін?",
    "Остаточна вартість залежить від точних розмірів, товщини, каменю, обробки, доставки й монтажу. Тому зараз кожна позиція має чесний статус «Вартість уточнюється».",
  ],
  [
    "Чи це фотографії виконаних робіт?",
    "Ні. Зображення з позначкою «Візуалізація» створені для попереднього каталогу й показують напрямок виробу. Реальні фото майстерні можете запросити в нас, вказавши це у вашій формі замовлення, у коментарі.",
  ],
  [
    "Чи можна замовити форму не з каталогу?",
    "Так. Каталог потрібний як відправна точка. Якщо маєте фото, ескіз або власний розмір, майстер адаптує виріб під матеріал, місце встановлення та бюджет.",
  ],
  [
    "Чи робите замір, доставку та монтаж?",
    "Доставимо Новою поштою, Делівері та іншими службами доставки. Можливий самовивіз за попередньою домовленістю. Точні умови залежать від місця, доступу, габаритів і ваги готового кам’яного виробу.",
  ],
] as const;
