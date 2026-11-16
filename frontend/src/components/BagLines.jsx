import { Link } from "react-router-dom";
import { useStore } from "../context/Store";
import { img, money } from "../lib/api";
import { IconMinus, IconPlus } from "./Icons";

export default function BagLines({ large = false }) {
    const { cart, setQty, removeLine } = useStore();

    return (
        <ul className={`lines ${large ? "lines--large" : ""}`}>
            {cart.map((l) => (
                <li key={l.key} className="line">
                    <Link to={`/product/${l.slug}`} className="line__img">
                        <img src={img(l.image, 300)} alt={l.name} loading="lazy" />
                    </Link>
                    <div className="line__body">
                        <div className="row-between line__top">
                            <Link to={`/product/${l.slug}`} className="line__name">{l.name}</Link>
                            <span className="line__price">{money(l.price * l.qty)}</span>
                        </div>
                        {l.option && <p className="line__meta">{l.optionLabel || "Option"}: {l.option}</p>}
                        {l.qty > 1 && <p className="line__meta">{money(l.price)} each</p>}
                        <div className="row-between line__actions">
                            <div className="stepper" aria-label="Quantity">
                                <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease quantity"><IconMinus /></button>
                                <span>{l.qty}</span>
                                <button onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= (l.stock || 20)} aria-label="Increase quantity"><IconPlus /></button>
                            </div>
                            <button className="link-under small" onClick={() => removeLine(l.key)}>Remove</button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
