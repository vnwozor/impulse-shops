import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../context/Store";
import { img, money } from "../lib/api";
import { IconClose } from "./Icons";
import BagLines from "./BagLines";

export default function BagDrawer() {
    const { bagOpen, setBagOpen, cart, count, subtotal, settings } = useStore();
    const { pathname } = useLocation();

    useEffect(() => setBagOpen(false), [pathname, setBagOpen]);
    useEffect(() => {
        document.body.classList.toggle("no-scroll-bag", bagOpen);
        const onKey = (e) => e.key === "Escape" && setBagOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [bagOpen, setBagOpen]);

    const freeOver = settings.delivery.freeOver;
    const left = freeOver - subtotal;

    return (
        <div className={`drawer drawer--right ${bagOpen ? "is-open" : ""}`} aria-hidden={!bagOpen}>
            <div className="drawer__scrim" onClick={() => setBagOpen(false)} />
            <aside className="drawer__panel bag" aria-label="Your bag">
                <div className="drawer__head">
                    <p className="eyebrow">Your bag <span className="muted">({count})</span></p>
                    <button className="icon-btn" onClick={() => setBagOpen(false)} aria-label="Close bag"><IconClose /></button>
                </div>

                {cart.length === 0 ? (
                    <div className="bag__empty">
                        <p className="display-s">Your bag is empty.</p>
                        <p className="muted">Pieces you add will wait for you here.</p>
                        <Link to="/shop" className="btn btn--ink">Start shopping</Link>
                    </div>
                ) : (
                    <>
                        {freeOver > 0 && (
                            <div className="bag__free">
                                <p>{left > 0 ? <>You're <strong>{money(left)}</strong> away from free delivery</> : "Your order ships free"}</p>
                                <div className="bar"><span style={{ width: `${Math.min(100, (subtotal / freeOver) * 100)}%` }} /></div>
                            </div>
                        )}
                        <div className="bag__lines">
                            <BagLines />
                        </div>
                        <div className="bag__foot">
                            <div className="row-between">
                                <span>Subtotal</span>
                                <strong>{money(subtotal)}</strong>
                            </div>
                            <p className="muted small">Delivery is calculated at checkout.</p>
                            <Link to="/checkout" className="btn btn--ink btn--block">Checkout</Link>
                            <Link to="/bag" className="link-under center">View bag</Link>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}

export const Thumb = ({ src, alt }) => <img src={img(src, 300)} alt={alt} loading="lazy" />;
