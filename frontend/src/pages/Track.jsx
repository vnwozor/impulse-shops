import { useEffect, useState } from "react";
import { api, formatDate } from "../lib/api";
import { OrderItems, Timeline, shippingLines } from "../components/OrderView";

export default function Track() {
    const [form, setForm] = useState({ number: "", email: "" });
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        document.title = "Track your order — Impulse.shops";
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const d = await api("/orders/track", { method: "POST", body: form });
            setOrder(d.order);
        } catch (err) {
            setError(err.message);
            setOrder(null);
        }
        setBusy(false);
    };

    return (
        <div className="wrap track">
            <div className="track__intro">
                <p className="eyebrow">Orders</p>
                <h1 className="display-xl">Track your order</h1>
                <p className="lead">Enter the order number from your confirmation (it starts with IMP) and the email you used at checkout.</p>
                <form className="track__form" onSubmit={submit}>
                    <label className="field">
                        <span>Order number</span>
                        <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="IMP-123456" required />
                    </label>
                    <label className="field">
                        <span>Email</span>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </label>
                    <button className="btn btn--ink" disabled={busy}>{busy ? "Checking…" : "Track order"}</button>
                </form>
                {error && <p className="form-error" role="alert">{error}</p>}
            </div>

            {order && (
                <div className="track__result">
                    <div>
                        <p className="eyebrow">Order {order.number} · {formatDate(order.createdAt)}</p>
                        <Timeline order={order} />
                        <div className="orderpage__block">
                            <p className="eyebrow">{order.shipping.method === "pickup" ? "Pickup" : "Delivering to"}</p>
                            {shippingLines(order).map((l) => <p key={l} className="muted">{l}</p>)}
                        </div>
                    </div>
                    <OrderItems order={order} />
                </div>
            )}
        </div>
    );
}
