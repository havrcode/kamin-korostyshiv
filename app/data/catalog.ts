export type PriceMode = "quote";

export type CatalogCategory = {
  id: string;
  slug: string;
  title: string;
  formValue: string;
  text: string;
  image: string;
  tag: string;
};

export type CatalogProduct = {
  id: string;
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

/**
 * Демонстраційний каталог v1.0.0.
 *
 * Фото є згенерованими візуалізаціями, а не портфоліо виконаних робіт.
 * Ціни навмисно не вигадані: до погодження прайсу всі вироби мають режим
 * `quote`. Стабільні id можна залишити незмінними після заміни назв і фото.
 */
export const categories: CatalogCategory[] = [
  {
    id: "cat-single",
    slug: "odynarni-pamiatnyky",
    title: "Одинарні пам’ятники",
    formValue: "Одинарний пам’ятник",
    text: "Вертикальні стели, пам’ятники-хрести та індивідуальні форми",
    image: "/visual-single.webp",
    tag: "1 портрет",
  },
  {
    id: "cat-family",
    slug: "rodynni-pamiatnyky",
    title: "Родинні пам’ятники",
    formValue: "Подвійний або родинний пам’ятник",
    text: "Горизонтальні композиції на двох і трьох із поєднанням каменю",
    image: "/visual-double.webp",
    tag: "2–3 портрети",
  },
  {
    id: "cat-complex",
    slug: "memorialni-kompleksy",
    title: "Меморіальні комплекси",
    formValue: "Меморіальний комплекс",
    text: "Цілісне проєктування стели, плит, бордюрів, декору й місця відпочинку",
    image: "/visual-complex.webp",
    tag: "Під ділянку",
  },
  {
    id: "cat-site",
    slug: "oblashtuvannia-dilianky",
    title: "Облаштування ділянки",
    formValue: "Облаштування ділянки",
    text: "Столи, лавки, вази, лампадки, квітники, плити та бордюри",
    image: "/visual-table-bench.webp",
    tag: "Комплектація",
  },
  {
    id: "cat-architecture",
    slug: "arkhitekturnyi-kamin",
    title: "Камінь для дому",
    formValue: "Архітектурний виріб із каменю",
    text: "Сходи, підвіконня, стільниці та інші вироби за точними розмірами",
    image: "/visual-stairs.webp",
    tag: "Інтер’єр · фасад",
  },
];

export const products: CatalogProduct[] = [
  {
    id: "prod-single-vertical",
    categoryId: "cat-single",
    slug: "vertikal-klasyka",
    title: "Вертикаль «Стримана класика»",
    shortTitle: "Вертикаль на один портрет",
    summary: "Лаконічна вертикальна стела з м’яким асиметричним завершенням.",
    description: "Стартова композиція для одного портрета. Остаточні пропорції, товщина стели, форма підставки, квітник і художнє оформлення погоджуються після замірів та вибору каменю.",
    image: "/visual-single.webp",
    imageAlt: "Візуалізація вертикального одинарного пам’ятника з чорного габро",
    materials: ["Габро", "Покостівський граніт", "Комбінація двох каменів"],
    options: ["Кольоровий портрет", "Гравійований портрет", "Напис і символи", "Квітник або суцільна плита"],
    priceMode: "quote",
    priceLabel: "Після прорахунку",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-single-cross",
    categoryId: "cat-single",
    slug: "khrest-lakonichnyi",
    title: "Хрест «Лаконічний»",
    shortTitle: "Гранітний пам’ятник-хрест",
    summary: "Стриманий монолітний хрест на масивній підставці.",
    description: "Варіант для окремої композиції або поєднання з плитою та квітником. Інженерні розміри основи й спосіб монтажу завжди уточнюються вручну.",
    image: "/visual-cross.webp",
    imageAlt: "Візуалізація лаконічного гранітного пам’ятника у формі хреста",
    materials: ["Габро", "Комбінований граніт"],
    options: ["Поліровані або матові грані", "Напис на підставці", "Квітник", "Окрема надгробна плита"],
    priceMode: "quote",
    priceLabel: "Після прорахунку",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-family-double",
    categoryId: "cat-family",
    slug: "horyzontal-na-dvokh",
    title: "Горизонталь «На двох»",
    shortTitle: "Композиція на два портрети",
    summary: "Дві збалансовані стели, об’єднані спільною основою.",
    description: "Стартова родинна композиція на два портрети. Можна змінювати форму верхнього краю, відстань між стелами, центральну вставку та оформлення передньої й задньої сторін.",
    image: "/visual-double.webp",
    imageAlt: "Візуалізація подвійного горизонтального пам’ятника з чорного й сірого граніту",
    materials: ["Габро", "Покостівський граніт", "Капустинський граніт"],
    options: ["Два кольорові портрети", "Два гравійовані портрети", "Центральна вставка", "Подвійна надгробна плита"],
    priceMode: "quote",
    priceLabel: "Після прорахунку",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-family-triple",
    categoryId: "cat-family",
    slug: "rodynna-na-trokh",
    title: "Родинна «На трьох»",
    shortTitle: "Композиція на три портрети",
    summary: "Три стели в єдиному ритмі з контрастними кам’яними вставками.",
    description: "Стартова горизонтальна композиція на три портрети. Через вагу, довжину основи та особливості ділянки потребує обов’язкової ручної перевірки конструкції, доставки й монтажу.",
    image: "/visual-triple.webp",
    imageAlt: "Візуалізація родинної композиції на три портрети",
    materials: ["Габро", "Капустинський граніт", "Лезниківський граніт"],
    options: ["Кольорові вставки", "Гравійовані портрети", "Різне оформлення звороту", "Бордюр і відсипка"],
    priceMode: "quote",
    priceLabel: "Після прорахунку",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-complex-complete",
    categoryId: "cat-complex",
    slug: "kompleks-tsilisnyi",
    title: "Комплекс «Цілісний»",
    shortTitle: "Повне облаштування ділянки",
    summary: "Стела, плита, облицювання, бордюри, ваза й лавка в одному проєкті.",
    description: "Проєкт формується тільки після точного заміру. Конфігурація проходів, фундаменту, водовідведення, товщини плит, доставки й монтажу розраховується окремо для конкретної ділянки.",
    image: "/visual-complex.webp",
    imageAlt: "Візуалізація цілісного меморіального комплексу з граніту",
    materials: ["Габро", "Покостівський граніт", "Термооброблена плитка"],
    options: ["Одинарна або родинна стела", "Закрита чи відкрита ділянка", "Стіл або лавка", "Ваза й лампадка"],
    priceMode: "quote",
    priceLabel: "Індивідуальний кошторис",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-site-table-bench",
    categoryId: "cat-site",
    slug: "stil-i-lavka",
    title: "Комплект «Стіл і лавка»",
    shortTitle: "Гранітний стіл і лавка",
    summary: "Практичний комплект із полірованими поверхнями та стійкими опорами.",
    description: "Розміри й відстань між елементами підбираються під ділянку. Для безпечного монтажу враховуються основа, ґрунт, доступ техніки та вага деталей.",
    image: "/visual-table-bench.webp",
    imageAlt: "Візуалізація комплекту гранітного столу й лавки",
    materials: ["Габро", "Покостівський граніт", "Комбінація каменю"],
    options: ["Окремий стіл", "Окрема лавка", "Контрастні вставки", "Матова або полірована поверхня"],
    priceMode: "quote",
    priceLabel: "Після прорахунку",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-site-accessories",
    categoryId: "cat-site",
    slug: "vazy-ta-lampadky",
    title: "Вази та лампадки",
    shortTitle: "Завершальні деталі композиції",
    summary: "Кам’яні вази, квітники та лампадки у спільному стилі з пам’ятником.",
    description: "Підбираємо пропорції, матеріал, відтінок металу й спосіб кріплення. Наявність конкретної форми та сумісність із готовою плитою уточнюються перед замовленням.",
    image: "/visual-accessories.webp",
    imageAlt: "Візуалізація гранітної вази, квітника та металевої лампадки",
    materials: ["Габро", "Сірий граніт", "Метал із захисним покриттям"],
    options: ["Ваза", "Низький квітник", "Лампадка", "Комплект у єдиному стилі"],
    priceMode: "quote",
    priceLabel: "Після уточнення комплектації",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-architecture-stairs",
    categoryId: "cat-architecture",
    slug: "skhody-z-hranitu",
    title: "Сходи з граніту",
    shortTitle: "Зовнішні сходи та вхідні групи",
    summary: "Стійкі до погоди сходи з безпечними термообробленими проступами.",
    description: "Виготовлення починається після заміру основи. Тип каменю, товщина, обробка проти ковзання, капінос, шви й примикання до фасаду погоджуються в технічному проєкті.",
    image: "/visual-stairs.webp",
    imageAlt: "Візуалізація зовнішніх сходів із сірого та чорного граніту",
    materials: ["Покостівський граніт", "Габро", "Термооброблена поверхня"],
    options: ["Суцільні або накладні сходини", "Плінтус", "Майданчик", "Контрастні підсходинки"],
    priceMode: "quote",
    priceLabel: "Після заміру",
    requiresManualReview: true,
    visualization: true,
  },
  {
    id: "prod-architecture-interior",
    categoryId: "cat-architecture",
    slug: "pidvikonnia-ta-stilnytsi",
    title: "Підвіконня та стільниці",
    shortTitle: "Точні вироби для інтер’єру",
    summary: "Підвіконня, стільниці й полиці з обраним профілем краю.",
    description: "Форма виготовляється за шаблоном або точними розмірами. Вирізи, стики, радіуси, підсилення, спосіб доставки та підйому завжди перевіряються вручну.",
    image: "/visual-interior.webp",
    imageAlt: "Візуалізація гранітного підвіконня й стільниці в сучасному інтер’єрі",
    materials: ["Габро", "Сірий граніт", "Мармур за погодженням"],
    options: ["Прямий або заокруглений край", "Вирізи під обладнання", "Матова або полірована поверхня", "Монтаж"],
    priceMode: "quote",
    priceLabel: "Після креслення або заміру",
    requiresManualReview: true,
    visualization: true,
  },
];

export const interestOptions = [
  ...categories.map(({ formValue }) => formValue),
  "Інший виріб",
];

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getCategoryById(id: string) {
  return categories.find((category) => category.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((product) => product.categoryId === categoryId);
}

export function getProduct(categoryId: string, productSlug: string) {
  return products.find(
    (product) => product.categoryId === categoryId && product.slug === productSlug,
  );
}

export function resolveProductSelection(productId: string, interest: string | null) {
  const product = products.find(({ id }) => id === productId);
  const category = product && categories.find(({ id }) => id === product.categoryId);
  if (!product || !category) return null;
  return {
    productId: product.id,
    categoryValue: category.formValue,
    label: (interest?.trim() || product.title).slice(0, 120),
  };
}

export const stones = [
  { name: "Габро", origin: "Глибокий чорний", color: "#161719", grain: "#3a3b3e" },
  { name: "Покостівський", origin: "Стриманий сірий", color: "#777a7b", grain: "#b5b5af" },
  { name: "Капустинський", origin: "Червоно-коричневий", color: "#6d3732", grain: "#be7b68" },
  { name: "Лезниківський", origin: "Насичений червоний", color: "#8f3d32", grain: "#d39a7a" },
  { name: "Мармур", origin: "Світлий природний", color: "#d7d4cc", grain: "#9b9a95" },
] as const;

export const faqs = [
  [
    "Чому в каталозі немає вигаданих цін?",
    "Остаточна вартість залежить від точних розмірів, товщини, каменю, обробки, художніх робіт, доставки й монтажу. Поки бізнес-прайс не погоджено, чесний режим — індивідуальний прорахунок.",
  ],
  [
    "Чи є фотографії прикладами виконаних робіт?",
    "Ні. Зображення з позначкою «Візуалізація» створені для попереднього каталогу й показують можливий напрямок. Після виготовлення виробів їх замінять реальні фотографії майстерні.",
  ],
  [
    "Чи можна замовити виріб за власним ескізом?",
    "Так. Ескіз, фотографію або кілька прикладів можна перетворити на цілісний проєкт і адаптувати під розмір ділянки та обраний матеріал.",
  ],
  [
    "Чи передбачені доставка та встановлення?",
    "Такі послуги можна включити до замовлення. Точні умови залежать від місця встановлення, доступу, розмірів і ваги готової конструкції.",
  ],
] as const;
