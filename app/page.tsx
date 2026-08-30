"use client";

/* eslint-disable @next/next/no-img-element -- Каталожні WebP уже оптимізовані; native img не створює зайвих Worker-викликів. */

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "./components/icon";
import { RevealObserver } from "./components/reveal-observer";
import { categories, faqs, interestOptions, stones } from "./data/catalog";
import { siteConfig } from "./site-config";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStone, setActiveStone] = useState(0);
  const [selectedInterest, setSelectedInterest] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const currentStone = useMemo(() => stones[activeStone], [activeStone]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function chooseInterest(value: string) {
    setSelectedInterest(value);
    setSubmitted(false);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main>
      <RevealObserver />

      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${siteConfig.workingName} — на головну`}>
          <span className="brand-mark" aria-hidden="true"><span>K</span></span>
          <span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Головна навігація">
          <a href="#catalog">Каталог</a><a href="#process">Як ми працюємо</a><a href="#stone">Види каменю</a><a href="#about">Про нас</a>
        </nav>
        <a className="header-cta" href="#contact"><span>Прорахувати вартість</span><Icon name="arrow" /></a>
        <button
          className="menu-button"
          type="button"
          aria-label="Відкрити меню"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(true)}
        ><Icon name="menu" /></button>
      </header>

      <div
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Мобільна навігація"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-head"><span>Навігація</span><button type="button" onClick={() => setMenuOpen(false)} aria-label="Закрити меню"><Icon name="x" /></button></div>
        <nav aria-label="Мобільна навігація">
          {[["Каталог", "catalog"], ["Як ми працюємо", "process"], ["Види каменю", "stone"], ["Про нас", "about"], ["Контакти", "contact"]].map(([label, id]) => (
            <a href={`#${id}`} onClick={() => setMenuOpen(false)} key={id}>{label}<Icon name="arrow" /></a>
          ))}
          <a href={siteConfig.phone.href} onClick={() => setMenuOpen(false)}>Зателефонувати<Icon name="phone" /></a>
        </nav>
      </div>

      <section className="hero" id="top">
        <div className="hero-image" role="img" aria-label="Сучасний меморіальний комплекс із граніту"></div><div className="hero-overlay"></div>
        <div className="hero-content content-wrap" data-reveal>
          <p className="eyebrow light"><span></span>Вироби з каменю · Коростишів</p>
          <h1>Пам’ять у камені.<br /><em className="hero-craft">Майстерність</em> у деталях.</h1>
          <p className="hero-lead">Пам’ятники, меморіальні комплекси та вироби з натурального граніту й мармуру — від вибору матеріалу та узгодження проєкту до встановлення.</p>
          <div className="hero-actions"><a className="button primary" href="#catalog">Переглянути каталог <Icon name="arrow" /></a><a className="button glass" href="#contact">Обговорити ваш проєкт</a></div>
        </div>
        <div className="hero-facts content-wrap" aria-label="Переваги" data-reveal>
          <div><Icon name="cube" /><span><b>Точний проєкт</b><small>усі деталі до початку робіт</small></span></div>
          <div><Icon name="ruler" /><span><b>Виготовлення</b><small>увага до матеріалу й обробки</small></span></div>
          <div><Icon name="truck" /><span><b>Зручне замовлення</b><small>від вибору до встановлення</small></span></div>
        </div>
      </section>

      <section className="intro content-wrap" id="about" data-reveal>
        <div><p className="eyebrow"><span></span>Про нашу роботу</p><h2>Не просто виріб.<br />Цілісне рішення <em>на роки.</em></h2></div>
        <div className="intro-copy"><p>Ми створюємо вироби з натурального каменю з повагою до вашої історії та увагою до кожної деталі. Форма, пропорції, матеріали й оздоблення погоджуються до початку виробництва.</p><a className="text-link" href="#process">Дізнатися, як проходить замовлення <Icon name="arrow" /></a></div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="content-wrap section-heading" data-reveal><div><p className="eyebrow"><span></span>Основні категорії</p><h2>Знайдіть напрямок,<br />з якого <em>варто почати.</em></h2></div><p>Оберіть категорію, а майстер допоможе уточнити форму, матеріал, комплектацію та орієнтовний бюджет.</p></div>
        <div className="category-grid content-wrap">
          {categories.map((category, index) => (
            <a
              className={`category-card card-${index + 1}`}
              href="#contact"
              key={category.slug}
              onClick={() => chooseInterest(category.formValue)}
              data-reveal
              style={{ "--reveal-delay": `${Math.min(index, 2) * 70}ms` } as CSSProperties}
              aria-label={`${category.title}: обрати та перейти до форми`}
            >
              <img src={category.image} alt="" /><span className="category-shade"></span><span className="category-tag">{category.tag}</span><span className="category-copy"><b>{category.title}</b><small>{category.text}</small></span><span className="round-arrow"><Icon name="arrow" /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="content-wrap">
          <div className="section-heading compact" data-reveal><div><p className="eyebrow light"><span></span>Зрозумілий процес</p><h2>Від першої розмови<br />до <em>готового виробу.</em></h2></div><p>Кожен ключовий крок погоджується з вами. Ви розумієте, що саме отримаєте, ще до роботи з каменем.</p></div>
          <ol className="steps" data-reveal>
            <li><span>01</span><Icon name="phone" /><b>Знайомимося</b><p>Ви описуєте побажання, показуєте приклади або просто називаєте бюджет і задачу.</p></li>
            <li><span>02</span><Icon name="spark" /><b>Створюємо проєкт</b><p>Підбираємо камінь, форму та композицію. Готуємо візуалізацію майбутнього виробу.</p></li>
            <li><span>03</span><Icon name="ruler" /><b>Виготовляємо</b><p>Камінь проходить різання, шліфування, полірування, художні роботи та перевірку якості.</p></li>
            <li><span>04</span><Icon name="shield" /><b>Доставляємо</b><p>Готуємо виріб до перевезення та за домовленістю виконуємо професійне встановлення.</p></li>
          </ol>
        </div>
      </section>

      <section className="stone-section content-wrap" id="stone" data-reveal>
        <div className="stone-copy">
          <p className="eyebrow"><span></span>Природні матеріали</p><h2>Кожен камінь має<br />власний <em>характер.</em></h2><p>Колір на екрані може відрізнятися від реального. Для остаточного вибору матеріал краще побачити наживо та оцінити його малюнок після полірування.</p>
          <div className="stone-tabs" role="tablist" aria-label="Оберіть вид каменю">
            {stones.map((stone, index) => <button key={stone.name} className={activeStone === index ? "active" : ""} onClick={() => setActiveStone(index)} role="tab" aria-selected={activeStone === index} type="button"><span style={{ backgroundColor: stone.color, boxShadow: `inset 0 0 0 2px ${stone.grain}` }}></span>{stone.name}</button>)}
          </div>
          <a className="text-link" href="#contact" onClick={() => chooseInterest("Камінь та оздоблення")}>Підібрати камінь для мого виробу <Icon name="arrow" /></a>
        </div>
        <div className="stone-visual" style={{ "--stone": currentStone.color, "--grain": currentStone.grain } as CSSProperties}><div className="stone-slab"><span></span></div><div className="stone-label"><small>Обраний матеріал</small><b>{currentStone.name}</b><span>{currentStone.origin}</span></div></div>
      </section>

      <section className="service-band"><div className="content-wrap service-grid" data-reveal>
        <div><Icon name="cube" /><b>Проєктування</b><p>Пропорції та комплектація під конкретну ділянку.</p></div><div><Icon name="spark" /><b>Художні роботи</b><p>Портрети, написи, символи та різьблений декор.</p></div><div><Icon name="shield" /><b>Контроль якості</b><p>Перевірка каменю, полірування та готового виробу.</p></div><div><Icon name="truck" /><b>Доставка і монтаж</b><p>Умови прораховуються індивідуально для замовлення.</p></div>
      </div></section>

      <section className="faq-section content-wrap" data-reveal>
        <div className="faq-title"><p className="eyebrow"><span></span>Варто знати</p><h2>Відповіді на<br /><em>часті питання.</em></h2></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span><Icon name="chevron" /></span></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="contact-section" id="contact"><div className="content-wrap contact-grid" data-reveal>
        <div className="contact-copy"><p className="eyebrow light"><span></span>Почнімо з розмови</p><h2>Розкажіть, який виріб<br />ви хочете <em>створити.</em></h2><p>Оберіть напрямок і підготуйте короткий опис. Поки ми підключаємо надійне серверне надсилання заявок, найшвидший спосіб зв’язку — телефон.</p><a className="contact-phone" href={siteConfig.phone.href} aria-label={`Зателефонувати: ${siteConfig.phone.display}`}><Icon name="phone" /><span><small>Телефон для консультації</small><b>{siteConfig.phone.display}</b></span></a><div className="contact-note"><Icon name="check" /><span><b>Без поспішних рішень</b><small>Спочатку обговорення, матеріал і проєкт — потім виробництво.</small></span></div></div>
        {submitted ? <div className="form-success" role="status"><span><Icon name="check" /></span><h3>Чернетку заявки підготовлено</h3><p>Дані нікуди не надсилалися: серверну частину форми ще розробляємо. Зателефонуйте за номером <a href={siteConfig.phone.href}>{siteConfig.phone.display}</a> або поверніться до форми.</p><button type="button" onClick={() => setSubmitted(false)}>Повернутися до форми</button></div> :
          <form className="contact-form" onSubmit={submitForm} aria-describedby="form-preview-note">
            {selectedInterest && <p className="selected-interest full"><Icon name="check" />Обрано: <b>{selectedInterest}</b></p>}
            <label><span>Ваше ім’я</span><input name="name" type="text" placeholder="Як до вас звертатися" autoComplete="name" required /></label><label><span>Номер телефону</span><input name="phone" type="tel" placeholder="+38 (___) ___-__-__" autoComplete="tel" required /></label><label><span>Що вас цікавить?</span><select name="category" value={selectedInterest} onChange={(event) => setSelectedInterest(event.target.value)} required><option value="" disabled>Оберіть категорію</option>{interestOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select></label><label className="full"><span>Коротко про побажання</span><textarea name="message" rows={3} placeholder="Матеріал, форма, орієнтовний бюджет або посилання на приклад"></textarea></label><button className="button primary dark full" type="submit">Підготувати чернетку <Icon name="arrow" /></button><small className="form-policy" id="form-preview-note">Попередня версія: ця форма ще не надсилає персональні дані.</small>
          </form>}
      </div></section>

      <footer><div className="content-wrap footer-top"><div className="brand footer-brand"><span className="brand-mark"><span>K</span></span><span className="brand-copy"><b>КАМІНЬ</b><small>КОРОСТИШІВ</small></span></div><p>Вироби з натурального граніту та мармуру. Проєктування, виготовлення та встановлення.</p><div className="footer-actions"><a href={siteConfig.phone.href}>{siteConfig.phone.display}<Icon name="phone" /></a><a href="#contact">Запросити прорахунок <Icon name="arrow" /></a></div></div><div className="content-wrap footer-bottom"><span>© 2026 {siteConfig.workingName}. Попередня версія.</span><span>Україна · {siteConfig.location}</span></div></footer>
      <a className="floating-contact" href={siteConfig.phone.href} aria-label={`Зателефонувати: ${siteConfig.phone.display}`}><Icon name="phone" /><span>Зателефонувати</span></a>
    </main>
  );
}
