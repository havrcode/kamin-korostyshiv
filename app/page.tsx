"use client";

import { FormEvent, useMemo, useState } from "react";

type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "cube"
  | "menu"
  | "phone"
  | "ruler"
  | "shield"
  | "spark"
  | "truck"
  | "x";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m8 10 4 4 4-4" />,
    cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    phone: <path d="M7.2 3.5 10 8 7.8 9.8a14 14 0 0 0 6.4 6.4L16 14l4.5 2.8-.8 3.2a2 2 0 0 1-2 1.5C9.3 20.7 3.3 14.7 2.5 6.3A2 2 0 0 1 4 4.3l3.2-.8Z" />,
    ruler: <path d="M4 17 17 4l3 3L7 20l-3-3Zm8-8 3 3M9 12l2 2M6 15l3 3" />,
    shield: <path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-5" />,
    spark: <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Zm7 13 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />,
    truck: <path d="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const categories = [
  { title: "Одинарні пам’ятники", text: "Від лаконічної класики до індивідуальних форм", image: "/catalog-single.webp", tag: "Каталог" },
  { title: "Подвійні пам’ятники", text: "Цілісні композиції з одного або кількох видів каменю", image: "/catalog-double.webp", tag: "Каталог" },
  { title: "Меморіальні комплекси", text: "Проєктування всієї ділянки з точними пропорціями", image: "/hero-memorial.webp", tag: "Індивідуально" },
  { title: "Столи та лавки", text: "Практичні комплекти з натурального каменю", image: "/catalog-table-bench.webp", tag: "Вироби" },
  { title: "Вази та лампадки", text: "Деталі, що завершують меморіальну композицію", image: "/catalog-decor.webp", tag: "Декор" },
  { title: "Камінь та оздоблення", text: "Габро, граніт і мармур у природних відтінках", image: "/catalog-single.webp", tag: "Матеріали" },
];

const stones = [
  { name: "Габро", origin: "Глибокий чорний", color: "#161719", grain: "#3a3b3e" },
  { name: "Покостівський", origin: "Стриманий сірий", color: "#777a7b", grain: "#b5b5af" },
  { name: "Капустинський", origin: "Червоно-коричневий", color: "#6d3732", grain: "#be7b68" },
  { name: "Лезниківський", origin: "Насичений червоний", color: "#8f3d32", grain: "#d39a7a" },
  { name: "Мармур", origin: "Світлий природний", color: "#d7d4cc", grain: "#9b9a95" },
];

const faqs = [
  ["Від чого залежить вартість виробу?", "Від виду й об’єму каменю, складності форми, способу обробки, художнього оформлення, комплектації та умов встановлення. Після уточнення деталей складається прозорий кошторис."],
  ["Чи можна замовити виріб за власним ескізом?", "Так. Ескіз, фотографію або кілька прикладів можна перетворити на цілісний проєкт і адаптувати під розмір ділянки та обраний матеріал."],
  ["Навіщо потрібна 3D-візуалізація?", "Вона показує форму, пропорції, розташування елементів і поєднання каменю до початку виробництва. Так легше вчасно погодити деталі й уникнути випадкових рішень."],
  ["Чи передбачені доставка та встановлення?", "Такі послуги можна включити до замовлення. Точні умови залежать від місця встановлення, розмірів і ваги готової конструкції."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStone, setActiveStone] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const currentStone = useMemo(() => stones[activeStone], [activeStone]);

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Камінь Коростишів — на головну">
          <span className="brand-mark" aria-hidden="true"><span>K</span></span>
          <span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Головна навігація">
          <a href="#catalog">Каталог</a><a href="#process">Як ми працюємо</a><a href="#stone">Види каменю</a><a href="#about">Про нас</a>
        </nav>
        <a className="header-cta" href="#contact"><span>Прорахувати вартість</span><Icon name="arrow" /></a>
        <button className="menu-button" aria-label="Відкрити меню" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="menu" /></button>
      </header>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-head"><span>Навігація</span><button onClick={() => setMenuOpen(false)} aria-label="Закрити меню"><Icon name="x" /></button></div>
        <nav aria-label="Мобільна навігація">
          {[["Каталог", "catalog"], ["Як ми працюємо", "process"], ["Види каменю", "stone"], ["Про нас", "about"], ["Контакти", "contact"]].map(([label, id]) => (
            <a href={`#${id}`} onClick={() => setMenuOpen(false)} key={id}>{label}<Icon name="arrow" /></a>
          ))}
        </nav>
      </div>

      <section className="hero" id="top">
        <div className="hero-image" role="img" aria-label="Сучасний меморіальний комплекс із граніту"></div><div className="hero-overlay"></div>
        <div className="hero-content content-wrap">
          <p className="eyebrow light"><span></span>Вироби з каменю · Коростишів</p>
          <h1>Пам’ять у камені.<br /><em>Майстерність</em> у деталях.</h1>
          <p className="hero-lead">Пам’ятники, меморіальні комплекси та вироби з натурального граніту й мармуру — від вибору матеріалу та узгодження проєкту до встановлення.</p>
          <div className="hero-actions"><a className="button primary" href="#catalog">Переглянути каталог <Icon name="arrow" /></a><a className="button glass" href="#contact">Обговорити ваш проєкт</a></div>
        </div>
        <div className="hero-facts content-wrap" aria-label="Переваги">
          <div><Icon name="cube" /><span><b>Точний проєкт</b><small>усі деталі до початку робіт</small></span></div>
          <div><Icon name="ruler" /><span><b>Виготовлення</b><small>увага до матеріалу й обробки</small></span></div>
          <div><Icon name="truck" /><span><b>Зручне замовлення</b><small>від вибору до встановлення</small></span></div>
        </div>
      </section>

      <section className="intro content-wrap" id="about">
        <div><p className="eyebrow"><span></span>Про нашу роботу</p><h2>Не просто виріб.<br />Цілісне рішення <em>на роки.</em></h2></div>
        <div className="intro-copy"><p>Ми створюємо вироби з натурального каменю з повагою до вашої історії та увагою до кожної деталі. Форма, пропорції, матеріали й оздоблення погоджуються до початку виробництва.</p><a className="text-link" href="#process">Дізнатися, як проходить замовлення <Icon name="arrow" /></a></div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="content-wrap section-heading"><div><p className="eyebrow"><span></span>Основні категорії</p><h2>Знайдіть напрямок,<br />з якого <em>варто почати.</em></h2></div><p>Оберіть категорію, а майстер допоможе уточнити форму, матеріал, комплектацію та орієнтовний бюджет.</p></div>
        <div className="category-grid content-wrap">
          {categories.map((category, index) => (
            <a className={`category-card card-${index + 1}`} href="#contact" key={category.title}>
              <img src={category.image} alt="" /><span className="category-shade"></span><span className="category-tag">{category.tag}</span><span className="category-copy"><b>{category.title}</b><small>{category.text}</small></span><span className="round-arrow"><Icon name="arrow" /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="content-wrap">
          <div className="section-heading compact"><div><p className="eyebrow light"><span></span>Зрозумілий процес</p><h2>Від першої розмови<br />до <em>готового виробу.</em></h2></div><p>Кожен ключовий крок погоджується з вами. Ви розумієте, що саме отримаєте, ще до роботи з каменем.</p></div>
          <ol className="steps">
            <li><span>01</span><Icon name="phone" /><b>Знайомимося</b><p>Ви описуєте побажання, показуєте приклади або просто називаєте бюджет і задачу.</p></li>
            <li><span>02</span><Icon name="spark" /><b>Створюємо проєкт</b><p>Підбираємо камінь, форму та композицію. Готуємо візуалізацію майбутнього виробу.</p></li>
            <li><span>03</span><Icon name="ruler" /><b>Виготовляємо</b><p>Камінь проходить різання, шліфування, полірування, художні роботи та перевірку якості.</p></li>
            <li><span>04</span><Icon name="shield" /><b>Доставляємо</b><p>Готуємо виріб до перевезення та за домовленістю виконуємо професійне встановлення.</p></li>
          </ol>
        </div>
      </section>

      <section className="stone-section content-wrap" id="stone">
        <div className="stone-copy">
          <p className="eyebrow"><span></span>Природні матеріали</p><h2>Кожен камінь має<br />власний <em>характер.</em></h2><p>Колір на екрані може відрізнятися від реального. Для остаточного вибору матеріал краще побачити наживо та оцінити його малюнок після полірування.</p>
          <div className="stone-tabs" role="tablist" aria-label="Оберіть вид каменю">
            {stones.map((stone, index) => <button key={stone.name} className={activeStone === index ? "active" : ""} onClick={() => setActiveStone(index)} role="tab" aria-selected={activeStone === index}><span style={{ backgroundColor: stone.color, boxShadow: `inset 0 0 0 2px ${stone.grain}` }}></span>{stone.name}</button>)}
          </div>
          <a className="text-link" href="#contact">Підібрати камінь для мого виробу <Icon name="arrow" /></a>
        </div>
        <div className="stone-visual" style={{ "--stone": currentStone.color, "--grain": currentStone.grain } as React.CSSProperties}><div className="stone-slab"><span></span></div><div className="stone-label"><small>Обраний матеріал</small><b>{currentStone.name}</b><span>{currentStone.origin}</span></div></div>
      </section>

      <section className="service-band"><div className="content-wrap service-grid">
        <div><Icon name="cube" /><b>Проєктування</b><p>Пропорції та комплектація під конкретну ділянку.</p></div><div><Icon name="spark" /><b>Художні роботи</b><p>Портрети, написи, символи та різьблений декор.</p></div><div><Icon name="shield" /><b>Контроль якості</b><p>Перевірка каменю, полірування та готового виробу.</p></div><div><Icon name="truck" /><b>Доставка і монтаж</b><p>Умови прораховуються індивідуально для замовлення.</p></div>
      </div></section>

      <section className="faq-section content-wrap">
        <div className="faq-title"><p className="eyebrow"><span></span>Варто знати</p><h2>Відповіді на<br /><em>часті питання.</em></h2></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span><Icon name="chevron" /></span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="contact-section" id="contact"><div className="content-wrap contact-grid">
        <div className="contact-copy"><p className="eyebrow light"><span></span>Почнімо з розмови</p><h2>Розкажіть, який виріб<br />ви хочете <em>створити.</em></h2><p>Залиште контакти та коротко опишіть задачу. Після додавання реального номера й обробника форма зможе надсилати заявки майстру.</p><div className="contact-note"><Icon name="check" /><span><b>Без поспішних рішень</b><small>Спочатку обговорення, матеріал і проєкт — потім виробництво.</small></span></div></div>
        {submitted ? <div className="form-success" role="status"><span><Icon name="check" /></span><h3>Демонстраційну форму заповнено</h3><p>У готовому сайті сюди підключимо надсилання заявки у Telegram, на e-mail або в адмін-панель.</p><button onClick={() => setSubmitted(false)}>Заповнити ще раз</button></div> :
          <form className="contact-form" onSubmit={submitForm}>
            <label><span>Ваше ім’я</span><input name="name" type="text" placeholder="Як до вас звертатися" required /></label><label><span>Номер телефону</span><input name="phone" type="tel" placeholder="+38 (___) ___-__-__" required /></label><label><span>Що вас цікавить?</span><select name="category" defaultValue=""><option value="" disabled>Оберіть категорію</option><option>Одинарний пам’ятник</option><option>Подвійний пам’ятник</option><option>Меморіальний комплекс</option><option>Стіл або лавка</option><option>Ваза, лампадка чи декор</option><option>Інший виріб</option></select></label><label className="full"><span>Коротко про побажання</span><textarea name="message" rows={3} placeholder="Матеріал, форма, орієнтовний бюджет або посилання на приклад"></textarea></label><button className="button primary dark full" type="submit">Отримати консультацію <Icon name="arrow" /></button><small className="form-policy">Надсилаючи форму, ви погоджуєтеся на обробку даних для відповіді на запит.</small>
          </form>}
      </div></section>

      <footer><div className="content-wrap footer-top"><div className="brand footer-brand"><span className="brand-mark"><span>K</span></span><span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span></div><p>Вироби з натурального граніту та мармуру. Проєктування, виготовлення та встановлення.</p><a href="#contact">Запросити прорахунок <Icon name="arrow" /></a></div><div className="content-wrap footer-bottom"><span>© 2026 Камінь Коростишів. Концепт сайту.</span><span>Україна · Житомирська область · Коростишів</span></div></footer>
      <a className="floating-contact" href="#contact" aria-label="Перейти до форми зв’язку"><Icon name="phone" /><span>Консультація</span></a>
    </main>
  );
}
