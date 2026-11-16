import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../context/Store";
import { money } from "../lib/api";
import BagLines from "../components/BagLines";

export default function Bag() {
    const { cart, count, subtotal, settings } = useStore();
    useEffect(() => {
        document.title = "Your bag — Impulse.shops";
    }, []);

    if (cart.length === 0) {
        return (
            <div className="wrap empty empty--page">
                <p className="display-l">Your bag is empty.</p>
                <p className="muted">Have a look around. New pieces arrive every week.</p>
                <Link to="/shop" className="btn btn--ink">Start shopping</Link>
            </div>
        );
    }

    const freeOver = settings.delivery.freeOver;

    return (
        <div className="wrap bagpage">
            <h1 className="display-xl">Your bag <sup className="sup-count">{count}</sup></h1>
            <div className="bagpage__grid">
                <BagLines large />
                <aside className="summary">
                    <p className="eyebrow">Summary</p>
                    <div className="row-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                    <div className="row-between muted"><span>Delivery</span><span>At checkout</span></div>
                    {freeOver > 0 && subtotal < freeOver && (
                        <p className="small muted">Add {money(freeOver - subtotal)} more for free delivery.</p>
                    )}
                    <div className="row-between summary__total"><span>Total</span><span>{money(subtotal)}</span></div>
                    <Link to="/checkout" className="btn btn--ink btn--block">Checkout</Link>
                    <Link to="/shop" className="link-under center">Continue shopping</Link>
                </aside>
            </div>
        </div>
    );
}
