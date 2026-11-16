import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/Store";
import { api, img, money } from "../lib/api";

const empty = { firstName: "", lastName: "", email: "", phone: "", state: "", city: "", address: "", landmark: "", note: "" };

export default function Checkout() {
    const { cart, subtotal, settings, meta, clearBag } = useStore();
    const navigate = useNavigate();
    const [form, setForm] = useState(() => {
        try {
            return { ...empty, ...JSON.parse(localStorage.getItem("impulse.customer") || "{}"), note: "" };
        } catch {
            return empty;
        }
    });
    const [method, setMethod] = useState("delivery");
    const [zoneId, setZoneId] = useState("");
    const p = settings.payments;
    const payOptions = [
        p.card?.enabled && meta.cardAvailable && { id: "card", title: "Pay with card", desc: "Card, bank transfer or USSD through Paystack. You'll be taken to a secure page." },
        p.transfer?.enabled && { id: "transfer", title: "Bank transfer", desc: "We'll show our account details after you place the order." },
        p.whatsapp?.enabled && { id: "whatsapp", title: "Finish on WhatsApp", desc: "Place the order, then confirm payment and delivery with our team in chat." },
    ].filter(Boolean);
    const [payment, setPayment] = useState(payOptions[0]?.id || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = "Checkout — Impulse.shops";
    }, []);

    const d = settings.delivery;
    const zonesForState = useMemo(() => {
        if (!form.state) return [];
        const exact = d.zones.filter((z) => z.states.includes(form.state));
        return exact.length ? exact : d.zones.filter((z) => z.states.length === 0);
    }, [form.state, d.zones]);

    useEffect(() => {
        if (!zonesForState.find((z) => z.id === zoneId)) setZoneId(zonesForState[0]?.id || "");
    }, [zonesForState, zoneId]);

    const zone = zonesForState.find((z) => z.id === zoneId);
    const free = d.freeOver > 0 && subtotal >= d.freeOver;
    const fee = method === "pickup" ? 0 : zone ? (free ? 0 : zone.fee) : null;
    const total = subtotal + (fee || 0);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    if (cart.length === 0) {
        return (
            <div className="wrap empty empty--page">
                <p className="display-l">Your bag is empty.</p>
                <Link to="/shop" className="btn btn--ink">Back to the shop</Link>
            </div>
        );
    }

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        if (!payment) return setError("No payment option is available right now. Please message us on WhatsApp.");
        setBusy(true);
        try {
            const { note, ...remember } = form;
            try {
                localStorage.setItem("impulse.customer", JSON.stringify(remember));
            } catch { /* ignore */ }

            const res = await api("/orders", {
                method: "POST",
                body: {
                    customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
                    shipping: { method, state: form.state, city: form.city, address: form.address, landmark: form.landmark, zoneId },
                    paymentMethod: payment,
                    note,
                    items: cart.map((l) => ({ productId: l.productId, option: l.option, qty: l.qty })),
                },
            });
            clearBag();
            if (res.paymentUrl) {
                window.location.href = res.paymentUrl;
                return;
            }
            navigate(`/order/${res.order.number}?k=${res.order.accessKey}&new=1`);
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    return (
        <div className="wrap checkout">
            <form className="checkout__grid" onSubmit={submit}>
                <div className="checkout__form">
                    <h1 className="display-xl">Checkout</h1>

                    <fieldset className="fs">
                        <legend><span className="fs__n">01</span> Contact</legend>
                        <div className="fields fields--2">
                            <Field label="First name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" required />
                            <Field label="Last name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" required />
                            <Field label="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
                            <Field label="Phone (WhatsApp preferred)" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="080..." required />
                        </div>
                    </fieldset>

                    <fieldset className="fs">
                        <legend><span className="fs__n">02</span> Delivery</legend>
                        {d.pickup?.enabled && (
                            <div className="seg" role="radiogroup" aria-label="Delivery method">
                                <button type="button" role="radio" aria-checked={method === "delivery"} className={method === "delivery" ? "is-active" : ""} onClick={() => setMethod("delivery")}>Deliver to me</button>
                                <button type="button" role="radio" aria-checked={method === "pickup"} className={method === "pickup" ? "is-active" : ""} onClick={() => setMethod("pickup")}>{d.pickup.label || "Pick up"}</button>
                            </div>
                        )}

                        {method === "pickup" ? (
                            <p className="note">{d.pickup.note}</p>
                        ) : (
                            <div className="fields fields--2">
                                <label className="field">
                                    <span>State</span>
                                    <select value={form.state} onChange={set("state")} required>
                                        <option value="">Select state</option>
                                        {meta.states.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                                <Field label="City / area" value={form.city} onChange={set("city")} autoComplete="address-level2" required />
                                <Field className="span-2" label="Street address" value={form.address} onChange={set("address")} autoComplete="street-address" required />
                                <Field className="span-2" label="Landmark or directions (optional)" value={form.landmark} onChange={set("landmark")} />

                                {zonesForState.length > 1 && (
                                    <div className="span-2 radios">
                                        <p className="label">Which part of {form.state}?</p>
                                        {zonesForState.map((z) => (
                                            <label key={z.id} className={`radio ${zoneId === z.id ? "is-active" : ""}`}>
                                                <input type="radio" name="zone" checked={zoneId === z.id} onChange={() => setZoneId(z.id)} />
                                                <span className="radio__main">
                                                    <span>{z.name}</span>
                                                    <span className="muted small">{z.eta}</span>
                                                </span>
                                                <span>{free ? "Free" : money(z.fee)}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {zonesForState.length === 1 && zone && (
                                    <p className="note span-2">{zone.name}: {free ? "free delivery" : money(zone.fee)}, {zone.eta.toLowerCase()}.</p>
                                )}
                            </div>
                        )}
                    </fieldset>

                    <fieldset className="fs">
                        <legend><span className="fs__n">03</span> Payment</legend>
                        <div className="radios">
                            {payOptions.map((o) => (
                                <label key={o.id} className={`radio ${payment === o.id ? "is-active" : ""}`}>
                                    <input type="radio" name="payment" checked={payment === o.id} onChange={() => setPayment(o.id)} />
                                    <span className="radio__main">
                                        <span>{o.title}</span>
                                        <span className="muted small">{o.desc}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        <label className="field">
                            <span>Order note (optional)</span>
                            <textarea rows="3" value={form.note} onChange={set("note")} placeholder="Gift wrapping, delivery time, anything we should know" />
                        </label>
                    </fieldset>
                </div>

                <aside className="checkout__summary">
                    <div className="summary">
                        <p className="eyebrow">Order summary</p>
                        <ul className="mini">
                            {cart.map((l) => (
                                <li key={l.key}>
                                    <span className="mini__img"><img src={img(l.image, 200)} alt="" /><em>{l.qty}</em></span>
                                    <span className="mini__name">{l.name}{l.option && <small>{l.optionLabel}: {l.option}</small>}</span>
                                    <span>{money(l.price * l.qty)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="row-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                        <div className="row-between">
                            <span>Delivery</span>
                            <span>{fee === null ? <span className="muted">Choose a state</span> : fee === 0 ? "Free" : money(fee)}</span>
                        </div>
                        <div className="row-between summary__total"><span>Total</span><span>{money(total)}</span></div>
                        {error && <p className="form-error" role="alert">{error}</p>}
                        <button className="btn btn--ink btn--block" disabled={busy}>
                            {busy ? "Placing your order…" : payment === "card" ? `Pay ${money(total)}` : "Place order"}
                        </button>
                        <p className="small muted center">By placing your order you agree to our <Link to="/returns" className="link-under">returns policy</Link>.</p>
                    </div>
                </aside>
            </form>
        </div>
    );
}

function Field({ label, className = "", ...props }) {
    return (
        <label className={`field ${className}`}>
            <span>{label}</span>
            <input {...props} />
        </label>
    );
}
