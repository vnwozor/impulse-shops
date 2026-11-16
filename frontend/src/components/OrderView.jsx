import { img, money, formatDate } from "../lib/api";
import { IconCheck } from "./Icons";

const STEPS = [
    ["pending", "Order placed"],
    ["confirmed", "Confirmed"],
    ["processing", "Being prepared"],
    ["shipped", "On the way"],
    ["delivered", "Delivered"],
];

export function Timeline({ order }) {
    if (order.status === "cancelled") {
        return <p className="tl-cancel">This order was cancelled. If that's unexpected, please message us.</p>;
    }
    const at = STEPS.findIndex(([s]) => s === order.status);
    const when = (status) => order.history?.filter((h) => h.status === status).at(-1)?.at;
    return (
        <ol className="tl">
            {STEPS.map(([s, label], i) => (
                <li key={s} className={i < at ? "is-done" : i === at ? "is-now" : ""}>
                    <span className="tl__dot">{i <= at && <IconCheck width="12" height="12" />}</span>
                    <span className="tl__label">{label}</span>
                    {when(s) && i <= at && <span className="tl__time">{formatDate(when(s), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                </li>
            ))}
        </ol>
    );
}

export function OrderItems({ order }) {
    return (
        <div className="summary">
            <ul className="mini">
                {order.items.map((l, i) => (
                    <li key={i}>
                        <span className="mini__img"><img src={img(l.image, 200)} alt="" /><em>{l.qty}</em></span>
                        <span className="mini__name">{l.name}{l.option && <small>{l.optionLabel}: {l.option}</small>}</span>
                        <span>{money(l.price * l.qty)}</span>
                    </li>
                ))}
            </ul>
            <div className="row-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
            <div className="row-between"><span>Delivery</span><span>{order.deliveryFee ? money(order.deliveryFee) : "Free"}</span></div>
            <div className="row-between summary__total"><span>Total</span><span>{money(order.total)}</span></div>
        </div>
    );
}

export function shippingLines(order) {
    const s = order.shipping;
    if (s.method === "pickup") return [s.zoneName || "Pickup in Lagos"];
    return [s.address, s.landmark, `${s.city}, ${s.state}`, `${s.zoneName}${s.eta ? ` · ${s.eta}` : ""}`].filter(Boolean);
}
