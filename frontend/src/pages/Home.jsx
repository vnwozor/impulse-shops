import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/Store";
import { api, img, money, waLink } from "../lib/api";
import ProductCard, { CardSkeleton } from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { IconArrow, IconChat, IconGlobe, IconNext, IconPrev, IconShield, IconSparkle, IconTruck, IconWhatsApp } from "../components/Icons";

const HERO_BADGES = [
    [IconShield, "Trusted quality"],
    [IconTruck, "Fast deliveries"],
    [IconSparkle, "100% authentic"],
];

export default function Home() {
    const { settings } = useStore();
    const [fresh, setFresh] = useState(null);
    const [wanted, setWanted] = useState(null);

    useEffect(() => {
        document.title = "Impulse.shops — Authentic luxury, fashion & lifestyle in Lagos";
        api("/products?sort=new&limit=8").then((d) => setFresh(d.products)).catch(() => setFresh([]));
        api("/products?featured=1&sort=popular&limit=4").then((d) => setWanted(d.products)).catch(() => setWanted([]));
    }, []);

    const home = settings.home;

    return (
        <>
            <Hero />
            <TrustRow />
            <Categories />

            <section className="section wrap">
                <SectionHead title={home.newInTitle || "New in"} link="/shop?sort=new" linkLabel="See all new pieces" />
                <div className="grid grid--4">
                    {(fresh || Array.from({ length: 8 })).map((p, i) =>
                        p ? (
                            <Reveal key={p._id} delay={(i % 4) * 60}><ProductCard product={p} /></Reveal>
                        ) : (
                            <CardSkeleton key={i} />
                        )
                    )}
                </div>
            </section>

            <Editorial />

            {wanted?.length > 0 && (
                <section className="section wrap">
                    <SectionHead title={home.bestTitle || "Most wanted"} link="/shop?sort=popular" linkLabel="Shop the list" />
                    <div className="grid grid--4">
                        {wanted.map((p, i) => (
                            <Reveal key={p._id} delay={i * 60}><ProductCard product={p} index={i} /></Reveal>
                        ))}
                    </div>
                </section>
            )}

            <Concierge />
        </>
    );
}

function SectionHead({ title, link, linkLabel }) {
    return (
        <div className="section__head">
            <h2 className="display-l">{title}</h2>
            {link && (
                <Link to={link} className="link-arrow">
                    {linkLabel} <IconArrow />
                </Link>
            )}
        </div>
    );
}

function Hero() {
    const { settings } = useStore();
    const slides = settings.hero.slides.filter((s) => s.image);
    const interval = Math.max(3, settings.hero.interval || 6) * 1000;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchX = useRef(null);

    useEffect(() => {
        if (slides.length < 2 || paused) return;
        const t = setTimeout(() => setActive((i) => (i + 1) % slides.length), interval);
        return () => clearTimeout(t);
    }, [active, slides.length, interval, paused]);

    if (!slides.length) return null;

    const go = (dir) => setActive((i) => (i + dir + slides.length) % slides.length);

    return (
        <section
            className="hero"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
                if (touchX.current === null) return;
                const d = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
                touchX.current = null;
            }}
            aria-roledescription="carousel"
            aria-label="Featured"
        >
            {slides.map((s, i) => (
                <div key={i} className={`hero__slide ${i === active ? "is-active" : ""}`} aria-hidden={i !== active}>
                    <img src={img(s.image, 2200)} alt="" className="hero__img" fetchpriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} />
                    <div className="hero__copy wrap">
                        {s.eyebrow && <p className="eyebrow hero__eyebrow">{s.eyebrow}</p>}
                        <h1 className="hero__title">
                            {s.title.split("\n").map((line, j) => (
                                <span key={j} className="hero__line"><span style={{ transitionDelay: `${150 + j * 90}ms` }}>{line}</span></span>
                            ))}
                        </h1>
                        {s.ctaLabel && (
                            <Link to={s.ctaLink || "/shop"} className="hero__cta" tabIndex={i === active ? 0 : -1}>
                                {s.ctaLabel} <IconArrow />
                            </Link>
                        )}
                        <ul className="hero__badges">
                            {HERO_BADGES.map(([Icon, label], j) => (
                                <li key={label} style={{ transitionDelay: `${450 + j * 80}ms` }}>
                                    <span className="hero__badge-icon"><Icon /></span>
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}

            {slides.length > 1 && (
                <div className="hero__controls wrap">
                    <div className="hero__dots">
                        {slides.map((_, i) => (
                            <button key={i} onClick={() => setActive(i)} className={`hero__dot ${i === active ? "is-active" : ""}`} aria-label={`Show slide ${i + 1}`}>
                                <span className="hero__num">{String(i + 1).padStart(2, "0")}</span>
                                <span className="hero__track"><span style={{ animationDuration: `${interval}ms`, animationPlayState: paused ? "paused" : "running" }} /></span>
                            </button>
                        ))}
                    </div>
                    <div className="hero__arrows">
                        <button onClick={() => go(-1)} aria-label="Previous slide"><IconPrev /></button>
                        <button onClick={() => go(1)} aria-label="Next slide"><IconNext /></button>
                    </div>
                </div>
            )}
        </section>
    );
}

function TrustRow() {
    const { settings } = useStore();
    const items = [
        [IconShield, "Checked by hand", "Every piece inspected before it's listed."],
        [IconTruck, "Same-day Lagos delivery", "Order before 2pm, Monday to Saturday."],
        [IconGlobe, "Nationwide shipping", settings.delivery.freeOver > 0 ? `Free on orders over ${money(settings.delivery.freeOver)}.` : "Fast, tracked delivery to every state."],
        [IconChat, "Real people on WhatsApp", "Ask for photos or a video before you pay."],
    ];
    return (
        <section className="promise">
            <div className="promise__grid wrap">
                {items.map(([Icon, t, d]) => (
                    <div key={t} className="promise__item">
                        <span className="promise__icon"><Icon width="20" height="20" /></span>
                        <div>
                            <p className="promise__t">{t}</p>
                            <p className="promise__d">{d}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Categories() {
    const { categories } = useStore();
    const rail = useRef();
    const list = categories.filter((c) => c.image);
    if (!list.length) return null;

    const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

    return (
        <section className="section cats">
            <div className="wrap section__head">
                <h2 className="display-l">Shop by category</h2>
                <div className="cats__arrows">
                    <button onClick={() => scroll(-1)} aria-label="Scroll categories left"><IconPrev /></button>
                    <button onClick={() => scroll(1)} aria-label="Scroll categories right"><IconNext /></button>
                </div>
            </div>
            <div className="cats__rail" ref={rail}>
                {list.map((c, i) => (
                    <Link key={c._id} to={`/shop/${c.slug}`} className="cat">
                        <div className="cat__media">
                            <img src={img(c.image, 900)} alt="" loading="lazy" />
                        </div>
                        <div className="cat__info">
                            <span className="cat__n">{String(i + 1).padStart(2, "0")}</span>
                            <span className="cat__name">{c.name}</span>
                            <span className="cat__count">{c.count} {c.count === 1 ? "piece" : "pieces"}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function Editorial() {
    const { settings } = useStore();
    const e = settings.home.editorial;
    if (!e?.title) return null;
    return (
        <section className="editorial">
            <div className="editorial__grid wrap">
                {e.image && (
                    <Reveal className="editorial__media">
                        <img src={img(e.image, 1600)} alt="" loading="lazy" />
                    </Reveal>
                )}
                <Reveal className="editorial__copy" delay={120}>
                    {e.eyebrow && <p className="eyebrow">{e.eyebrow}</p>}
                    <h2 className="display-l">{e.title}</h2>
                    <p className="editorial__body">{e.body}</p>
                    {e.ctaLabel && (
                        <Link to={e.ctaLink || "/about"} className="link-arrow">{e.ctaLabel} <IconArrow /></Link>
                    )}
                </Reveal>
            </div>
        </section>
    );
}

function Concierge() {
    const { settings } = useStore();
    const c = settings.home.concierge;
    if (!c?.title) return null;
    return (
        <section className="concierge">
            <div className="wrap concierge__inner">
                <p className="eyebrow">Sourcing on request</p>
                <h2 className="concierge__title">{c.title}</h2>
                <p className="concierge__body">{c.body}</p>
                <a className="btn btn--light" href={waLink(settings.store.whatsapp, "Hi Impulse.shops, I'm looking for a piece: ")} target="_blank" rel="noreferrer">
                    <IconWhatsApp /> Message us on WhatsApp
                </a>
            </div>
        </section>
    );
}
