import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../context/Store";
import { api, img, money, waLink } from "../lib/api";
import Accordion from "../components/Accordion";
import ProductCard from "../components/ProductCard";
import { IconMinus, IconNext, IconPlus, IconPrev, IconWhatsApp } from "../components/Icons";

export default function Product() {
    const { slug } = useParams();
    const { settings, categories, addToBag, cart, notify } = useStore();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState("");
    const [related, setRelated] = useState([]);
    const [active, setActive] = useState(0);
    const [option, setOption] = useState("");
    const [qty, setQty] = useState(1);
    const [needOption, setNeedOption] = useState(false);
    const touchX = useRef(null);

    useEffect(() => {
        setProduct(null);
        setError("");
        setActive(0);
        setOption("");
        setQty(1);
        api(`/products/${slug}`)
            .then((d) => {
                setProduct(d.product);
                document.title = `${d.product.name} — Impulse.shops`;
                return api(`/products?category=${d.product.category}&limit=5`);
            })
            .then((d) => d && setRelated(d.products.filter((p) => p.slug !== slug).slice(0, 4)))
            .catch((e) => setError(e.message));
    }, [slug]);

    const count = product?.images?.length || 0;
    const go = (dir) => setActive((i) => (i + dir + count) % count);

    useEffect(() => {
        if (count < 2) return;
        const onKey = (e) => {
            if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [count]);

    if (error) {
        return (
            <div className="wrap empty empty--page">
                <p className="display-m">{error}</p>
                <Link to="/shop" className="btn btn--outline">Back to the shop</Link>
            </div>
        );
    }
    if (!product) return <div className="pdp pdp--loading wrap"><div className="pdp__skeleton" /><div /></div>;

    const hasOptions = product.options?.values?.length > 0;
    const inBag = cart.filter((l) => l.productId === product._id).reduce((n, l) => n + l.qty, 0);
    const available = Math.max(0, product.stock - inBag);
    const soldOut = product.stock <= 0;
    const category = categories.find((c) => c.slug === product.category);
    const onSale = product.compareAt > product.price;

    const add = () => {
        if (hasOptions && !option) {
            setNeedOption(true);
            return;
        }
        if (available <= 0) {
            notify("You already have every piece we have in your bag.");
            return;
        }
        addToBag(product, option, Math.min(qty, available));
        setQty(1);
    };

    const waText = `Hi Impulse.shops, I'd like to order:\n${product.name}${option ? ` (${product.options.label || "Option"}: ${option})` : ""}\nQty: ${qty}\n${money(product.price)}\n${window.location.href}`;

    let stockNote = "In stock, ready to ship";
    if (soldOut) stockNote = "Sold out";
    else if (product.stock === 1) stockNote = "Only one available";
    else if (product.stock <= 3) stockNote = `Only ${product.stock} left`;

    return (
        <>
            <div className="pdp wrap">
                <div className="pdp__gallery">
                    <div
                        className="pdp__main"
                        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                        onTouchEnd={(e) => {
                            if (touchX.current === null || count < 2) return;
                            const d = e.changedTouches[0].clientX - touchX.current;
                            if (Math.abs(d) > 40) go(d < 0 ? 1 : -1);
                            touchX.current = null;
                        }}
                    >
                        {product.images.map((src, i) => (
                            <img key={src + i} src={img(src, 1600)} alt={`${product.name}, view ${i + 1}`} className={i === active ? "is-active" : ""} loading={i === 0 ? "eager" : "lazy"} />
                        ))}
                        {count > 1 && (
                            <>
                                <button className="pdp__arrow pdp__arrow--prev" onClick={() => go(-1)} aria-label="Previous image"><IconPrev /></button>
                                <button className="pdp__arrow pdp__arrow--next" onClick={() => go(1)} aria-label="Next image"><IconNext /></button>
                                <span className="pdp__counter">{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
                            </>
                        )}
                    </div>
                    {count > 1 && (
                        <div className="pdp__thumbs">
                            {product.images.map((src, i) => (
                                <button key={src + i} onClick={() => setActive(i)} className={i === active ? "is-active" : ""} aria-label={`Show image ${i + 1}`}>
                                    <img src={img(src, 300)} alt="" loading="lazy" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pdp__info">
                    <div className="pdp__sticky">
                        <nav className="crumbs" aria-label="Breadcrumb">
                            <Link to="/shop">Shop</Link>
                            {category && <><span>/</span><Link to={`/shop/${category.slug}`}>{category.name}</Link></>}
                        </nav>

                        {product.brand && <p className="pdp__brand">{product.brand}</p>}
                        <h1 className="pdp__name">{product.name}</h1>

                        <div className="pdp__price">
                            <span>{money(product.price)}</span>
                            {onSale && <s>{money(product.compareAt)}</s>}
                        </div>

                        <div className="pdp__facts">
                            <span className={`dot ${soldOut ? "dot--off" : product.stock <= 3 ? "dot--low" : ""}`} />
                            <span>{stockNote}</span>
                            <span className="pdp__sep">·</span>
                            <span>{product.condition || "New"}</span>
                        </div>

                        {hasOptions && (
                            <div className="pdp__block">
                                <div className="row-between">
                                    <p className="label">{product.options.label || "Option"}{option && <span className="muted">: {option}</span>}</p>
                                    {needOption && !option && <p className="pdp__warn">Please choose one</p>}
                                </div>
                                <div className="opts">
                                    {product.options.values.map((v) => (
                                        <button key={v} onClick={() => { setOption(v); setNeedOption(false); }} className={`opt ${option === v ? "is-active" : ""}`} aria-pressed={option === v}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!soldOut && (
                            <div className="pdp__block">
                                <p className="label">Quantity</p>
                                <div className="stepper stepper--lg">
                                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><IconMinus /></button>
                                    <span>{qty}</span>
                                    <button onClick={() => setQty((q) => Math.min(Math.max(1, available), q + 1))} disabled={qty >= available} aria-label="Increase quantity"><IconPlus /></button>
                                </div>
                            </div>
                        )}

                        <div className="pdp__actions">
                            {soldOut ? (
                                <button className="btn btn--ink btn--block" disabled>Sold out</button>
                            ) : (
                                <button className="btn btn--ink btn--block" onClick={add}>
                                    Add to bag <span className="btn__price">{money(product.price * qty)}</span>
                                </button>
                            )}
                            <a className="btn btn--outline btn--block" href={waLink(settings.store.whatsapp, soldOut ? `Hi Impulse.shops, is ${product.name} coming back? ${window.location.href}` : waText)} target="_blank" rel="noreferrer">
                                <IconWhatsApp /> {soldOut ? "Ask about availability" : "Order on WhatsApp"}
                            </a>
                        </div>

                        <div className="pdp__accs">
                            <Accordion title="Description" defaultOpen>
                                <p className="prewrap">{product.description || "Message us for more details about this piece."}</p>
                                {product.details?.length > 0 && (
                                    <ul className="ticks">
                                        {product.details.map((d) => <li key={d}>{d}</li>)}
                                    </ul>
                                )}
                            </Accordion>
                            <Accordion title="Authenticity">
                                <p className="prewrap">{settings.content.authenticity}</p>
                            </Accordion>
                            <Accordion title="Delivery & returns">
                                <ul className="zones">
                                    {settings.delivery.zones.map((z) => (
                                        <li key={z.id}><span>{z.name}</span><span>{z.fee ? money(z.fee) : "Free"} · {z.eta}</span></li>
                                    ))}
                                </ul>
                                {settings.delivery.freeOver > 0 && <p className="muted small">Free delivery on orders over {money(settings.delivery.freeOver)}.</p>}
                                <p><Link to="/returns" className="link-under">Read our returns policy</Link></p>
                            </Accordion>
                        </div>
                    </div>
                </div>
            </div>

            {related.length > 0 && (
                <section className="section wrap">
                    <div className="section__head">
                        <h2 className="display-l">You may also like</h2>
                        {category && <Link to={`/shop/${category.slug}`} className="link-arrow">More {category.name.toLowerCase()}</Link>}
                    </div>
                    <div className="grid grid--4">
                        {related.map((p) => <ProductCard key={p._id} product={p} />)}
                    </div>
                </section>
            )}
        </>
    );
}
