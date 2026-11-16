import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../context/Store";
import { img } from "../lib/api";
import wordmark from "../assets/wordmark.webp";
import { IconChevron, IconClose, IconMenu, IconSearch } from "./Icons";

export default function Header({ minimal = false }) {
    const { settings, categories, count, setBagOpen } = useStore();
    const [scrolled, setScrolled] = useState(false);
    const [shopOpen, setShopOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const location = useLocation();
    const closeTimer = useRef();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // close every panel when the page changes
    useEffect(() => {
        setShopOpen(false);
        setMenuOpen(false);
        setSearchOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        document.body.classList.toggle("no-scroll", menuOpen || searchOpen);
    }, [menuOpen, searchOpen]);

    const announcement = settings.announcement;
    const openShop = () => {
        clearTimeout(closeTimer.current);
        setShopOpen(true);
    };
    const closeShop = () => {
        closeTimer.current = setTimeout(() => setShopOpen(false), 120);
    };

    const preview = categories.filter((c) => c.image).slice(0, 2);

    return (
        <>
            {!minimal && announcement?.enabled && announcement.text && (
                <div className="announce">
                    <p>{announcement.text}</p>
                </div>
            )}

            <header className={`header ${scrolled ? "is-scrolled" : ""} ${shopOpen ? "is-open" : ""}`}>
                <div className="header__bar wrap">
                    <div className="header__left">
                        {!minimal && (
                            <>
                                <button className="header__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                                    <IconMenu />
                                </button>
                                <nav className="header__nav" aria-label="Main">
                                    <div className="nav-shop" onMouseEnter={openShop} onMouseLeave={closeShop}>
                                        <button
                                            className={`nav-link ${shopOpen ? "is-active" : ""}`}
                                            aria-expanded={shopOpen}
                                            onClick={() => setShopOpen((v) => !v)}
                                        >
                                            Shop <IconChevron />
                                        </button>
                                    </div>
                                    <Link to="/shop?sort=new" className={`nav-link ${location.pathname === "/shop" && location.search.includes("sort=new") ? "active" : ""}`}>New in</Link>
                                    <NavLink to="/track" className="nav-link">Track order</NavLink>
                                </nav>
                            </>
                        )}
                    </div>

                    <Link to="/" className="header__logo" aria-label="Impulse.shops home">
                        <img src={wordmark} alt="Impulse.shops" width="640" height="270" />
                    </Link>

                    <div className="header__right">
                        {minimal ? (
                            <Link to="/bag" className="nav-link">Back to bag</Link>
                        ) : (
                            <>
                                <button className="nav-link header__search" onClick={() => setSearchOpen(true)} aria-label="Search">
                                    <IconSearch /> <span>Search</span>
                                </button>
                                <button className="nav-link header__bag" onClick={() => setBagOpen(true)} aria-label={`Bag, ${count} items`}>
                                    <span className="header__bag-word">Bag</span>
                                    <span className="header__bag-count">{count}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {!minimal && (
                    <div className="mega" onMouseEnter={openShop} onMouseLeave={closeShop} aria-hidden={!shopOpen}>
                        <div className="mega__inner wrap">
                            <div className="mega__col">
                                <p className="eyebrow">Categories</p>
                                <ul className="mega__list">
                                    <li><Link to="/shop" tabIndex={shopOpen ? 0 : -1}>All</Link></li>
                                    {categories.map((c) => (
                                        <li key={c._id}>
                                            <Link to={`/shop/${c.slug}`} tabIndex={shopOpen ? 0 : -1}>
                                                {c.name} <sup>{c.count}</sup>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mega__col">
                                <p className="eyebrow">Edits</p>
                                <ul className="mega__list mega__list--small">
                                    <li><Link to="/shop?sort=new" tabIndex={shopOpen ? 0 : -1}>New arrivals</Link></li>
                                    <li><Link to="/shop?sort=popular" tabIndex={shopOpen ? 0 : -1}>Most wanted</Link></li>
                                    <li><Link to="/shop?sort=price-desc" tabIndex={shopOpen ? 0 : -1}>Investment pieces</Link></li>
                                    <li><Link to="/authenticity" tabIndex={shopOpen ? 0 : -1}>Our authenticity check</Link></li>
                                </ul>
                            </div>
                            <div className="mega__media">
                                {preview.map((c) => (
                                    <Link key={c._id} to={`/shop/${c.slug}`} className="mega__card" tabIndex={shopOpen ? 0 : -1}>
                                        <img src={img(c.image, 600)} alt="" loading="lazy" />
                                        <span>{c.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    );
}

function MobileMenu({ open, onClose }) {
    const { categories, settings } = useStore();
    const [shop, setShop] = useState(true);

    return (
        <div className={`drawer drawer--left ${open ? "is-open" : ""}`} aria-hidden={!open}>
            <div className="drawer__scrim" onClick={onClose} />
            <aside className="drawer__panel mmenu" aria-label="Menu">
                <div className="drawer__head">
                    <p className="eyebrow">Menu</p>
                    <button onClick={onClose} aria-label="Close menu" className="icon-btn"><IconClose /></button>
                </div>
                <nav className="mmenu__nav">
                    <Link to="/" className="mmenu__link">Home</Link>
                    <button className="mmenu__link mmenu__toggle" onClick={() => setShop((v) => !v)} aria-expanded={shop}>
                        Shop <IconChevron className={shop ? "rot" : ""} />
                    </button>
                    <div className={`mmenu__sub ${shop ? "is-open" : ""}`}>
                        <div>
                            <Link to="/shop">All</Link>
                            {categories.map((c) => (
                                <Link key={c._id} to={`/shop/${c.slug}`}>{c.name}<sup>{c.count}</sup></Link>
                            ))}
                        </div>
                    </div>
                    <Link to="/shop?sort=new" className="mmenu__link">New in</Link>
                    <Link to="/track" className="mmenu__link">Track order</Link>
                    <Link to="/about" className="mmenu__link">About</Link>
                </nav>
                <div className="mmenu__foot">
                    <a href={`tel:${settings.store.phone}`}>{settings.store.phone}</a>
                    <a href={`mailto:${settings.store.email}`}>{settings.store.email}</a>
                    <p>{settings.store.location}</p>
                </div>
            </aside>
        </div>
    );
}

function SearchOverlay({ open, onClose }) {
    const [q, setQ] = useState("");
    const navigate = useNavigate();
    const input = useRef();
    const { categories } = useStore();

    useEffect(() => {
        if (open) setTimeout(() => input.current?.focus(), 60);
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const submit = (e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    };

    return (
        <div className={`search ${open ? "is-open" : ""}`} aria-hidden={!open} role="dialog" aria-label="Search">
            <div className="search__panel">
                <div className="wrap">
                    <form onSubmit={submit} className="search__form">
                        <IconSearch width="22" height="22" />
                        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bags, watches, fragrance…" aria-label="Search the store" />
                        <button type="button" onClick={onClose} className="icon-btn" aria-label="Close search"><IconClose /></button>
                    </form>
                    <div className="search__hints">
                        <span className="eyebrow">Popular</span>
                        {categories.slice(0, 6).map((c) => (
                            <Link key={c._id} to={`/shop/${c.slug}`} className="chip">{c.name}</Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="search__scrim" onClick={onClose} />
        </div>
    );
}
