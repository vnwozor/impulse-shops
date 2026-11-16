import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, date, img, money, waLink } from "../lib/api";
import { useAdmin } from "../lib/admin";
import { Badge, Empty, Icon, ORDER_STATUS, PAY_METHOD, PAY_STATUS, PageHead } from "../components/ui";

const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];
const STATUS_MESSAGES = {
    confirmed: "your order is confirmed and we're getting it ready.",
    processing: "your order is being prepared.",
    shipped: "your order is on its way to you.",
    delivered: "your order has been delivered. Thank you for shopping with us.",
};

export default function Orders() {
    const { notify } = useAdmin();
    const [orders, setOrders] = useState(null);
    const [params, setParams] = useSearchParams();
    const [q, setQ] = useState(() => params.get("q") || "");

    const status = params.get("status") || "all";
    const payment = params.get("payment") || "";
    const openId = params.get("open");

    const load = () => api("/admin/orders").then((d) => setOrders(d.orders)).catch((e) => notify(e.message, "error"));
    useEffect(() => { load(); }, []);

    const setParam = (k, v) => {
        const next = new URLSearchParams(params);
        v ? next.set(k, v) : next.delete(k);
        setParams(next, { replace: true });
    };

    const counts = useMemo(() => {
        const c = { all: 0, open: 0 };
        for (const o of orders || []) {
            c.all++;
            c[o.status] = (c[o.status] || 0) + 1;
            if (["pending", "confirmed", "processing"].includes(o.status)) c.open++;
        }
        return c;
    }, [orders]);

    const shown = useMemo(() => {
        let list = orders || [];
        if (status === "open") list = list.filter((o) => ["pending", "confirmed", "processing"].includes(o.status));
        else if (status !== "all") list = list.filter((o) => o.status === status);
        if (payment) list = list.filter((o) => o.payment.status === payment && o.status !== "cancelled");
        if (q) {
            const n = q.toLowerCase();
            list = list.filter((o) => `${o.number} ${o.customer.firstName} ${o.customer.lastName} ${o.customer.email} ${o.customer.phone}`.toLowerCase().includes(n));
        }
        return list;
    }, [orders, status, payment, q]);

    const open = orders?.find((o) => o._id === openId);

    const update = async (order, body, message) => {
        try {
            const d = await api(`/admin/orders/${order._id}`, { method: "PUT", body });
            setOrders((list) => list.map((o) => (o._id === order._id ? d.order : o)));
            notify(message || "Order updated");
        } catch (e) {
            notify(e.message, "error");
        }
    };

    return (
        <div className="page">
            <PageHead title="Orders" sub="Update an order's status as it moves. Customers see it on their tracking page." />

            <div className="toolbar">
                <label className="search">
                    <Icon name="search" size={16} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, name, email or phone" />
                </label>
                <div className="tabs">
                    {[["all", "All"], ["open", "To fulfil"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]].map(([v, l]) => (
                        <button key={v} className={status === v ? "is-active" : ""} onClick={() => setParam("status", v === "all" ? "" : v)}>
                            {l} <span className="tabs__n">{counts[v] || 0}</span>
                        </button>
                    ))}
                </div>
                <select className="select" value={payment} onChange={(e) => setParam("payment", e.target.value)}>
                    <option value="">Any payment</option>
                    <option value="pending">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                </select>
            </div>

            {!orders ? (
                <div className="card"><div className="skeleton-rows" /></div>
            ) : shown.length === 0 ? (
                <div className="card"><Empty title={orders.length ? "No orders match these filters" : "No orders yet"}>{!orders.length && "When a customer checks out on the website, the order appears here."}</Empty></div>
            ) : (
                <div className="card card--flush">
                    <table className="table table--click">
                        <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Status</th><th className="num">Total</th></tr></thead>
                        <tbody>
                            {shown.map((o) => (
                                <tr key={o._id} onClick={() => setParam("open", o._id)} className={openId === o._id ? "is-selected" : ""}>
                                    <td className="mono">{o.number}</td>
                                    <td className="muted nowrap">{date(o.createdAt, true)}</td>
                                    <td>{o.customer.firstName} {o.customer.lastName}<small className="block muted">{o.shipping.method === "pickup" ? "Pickup" : o.shipping.state}</small></td>
                                    <td className="muted">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                                    <td><Badge tone={PAY_STATUS[o.payment.status][1]}>{PAY_STATUS[o.payment.status][0]}</Badge><small className="block muted">{PAY_METHOD[o.payment.method]}</small></td>
                                    <td><Badge tone={ORDER_STATUS[o.status][1]}>{ORDER_STATUS[o.status][0]}</Badge></td>
                                    <td className="num mono">{money(o.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <OrderPanel order={open} onClose={() => setParam("open", "")} onUpdate={update} />
        </div>
    );
}

function OrderPanel({ order, onClose, onUpdate }) {
    const { confirm, settings } = useAdmin();
    const [note, setNote] = useState("");
    useEffect(() => setNote(order?.adminNote || ""), [order?._id]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const o = order;
    const at = o ? FLOW.indexOf(o.status) : -1;
    const next = o && at >= 0 && at < FLOW.length - 1 ? FLOW[at + 1] : null;

    const setStatus = async (status) => {
        if (status === "cancelled") {
            const ok = await confirm({ title: `Cancel order ${o.number}?`, body: "The items go back into stock. This can't be undone.", action: "Cancel order", danger: true });
            if (!ok) return;
        }
        onUpdate(o, { status }, `Marked as ${ORDER_STATUS[status][0].toLowerCase()}`);
    };

    const customerMessage = o && STATUS_MESSAGES[o.status]
        ? `Hi ${o.customer.firstName}, this is ${settings.store.name}. Quick update on order ${o.number}: ${STATUS_MESSAGES[o.status]}`
        : o ? `Hi ${o.customer.firstName}, this is ${settings.store.name} about your order ${o.number}.` : "";

    return (
        <div className={`panel ${o ? "is-open" : ""}`} aria-hidden={!o}>
            <div className="panel__scrim" onClick={onClose} />
            <aside className="panel__box">
                {o && (
                    <>
                        <div className="panel__head">
                            <div>
                                <p className="eyebrow">{date(o.createdAt, true)}</p>
                                <h2 className="mono">{o.number}</h2>
                            </div>
                            <button className="iconbtn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
                        </div>

                        <div className="panel__body">
                            <section className="psec">
                                <div className="psec__row">
                                    <Badge tone={ORDER_STATUS[o.status][1]}>{ORDER_STATUS[o.status][0]}</Badge>
                                    <Badge tone={PAY_STATUS[o.payment.status][1]}>{PAY_STATUS[o.payment.status][0]}</Badge>
                                    <span className="muted small">{PAY_METHOD[o.payment.method]}</span>
                                </div>
                                {o.status !== "cancelled" && (
                                    <>
                                        <div className="steps">
                                            {FLOW.map((s, i) => (
                                                <button key={s} className={`step ${i <= at ? "is-done" : ""} ${i === at ? "is-now" : ""}`} onClick={() => i !== at && setStatus(s)}>
                                                    <span className="step__dot">{i <= at && <Icon name="check" size={11} />}</span>
                                                    <span>{ORDER_STATUS[s][0]}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="psec__actions">
                                            {next && <button className="btn btn--ink btn--sm" onClick={() => setStatus(next)}>Mark as {ORDER_STATUS[next][0].toLowerCase()}</button>}
                                            {o.payment.status !== "paid" ? (
                                                <button className="btn btn--ghost btn--sm" onClick={() => onUpdate(o, { paymentStatus: "paid", ...(o.status === "pending" ? { status: "confirmed" } : {}) }, "Payment recorded")}>Mark as paid</button>
                                            ) : (
                                                <button className="btn btn--ghost btn--sm" onClick={() => onUpdate(o, { paymentStatus: "refunded" }, "Marked as refunded")}>Mark refunded</button>
                                            )}
                                            <button className="btn btn--danger-ghost btn--sm" onClick={() => setStatus("cancelled")}>Cancel order</button>
                                        </div>
                                    </>
                                )}
                            </section>

                            <section className="psec">
                                <p className="eyebrow">Items</p>
                                <ul className="rows">
                                    {o.items.map((i, k) => (
                                        <li key={k} className="rowlink">
                                            <img src={img(i.image, 120)} alt="" className="thumb" />
                                            <span className="grow">{i.name}{i.option && <small className="block muted">{i.optionLabel}: {i.option}</small>}</span>
                                            <span className="muted mono">×{i.qty}</span>
                                            <span className="mono">{money(i.price * i.qty)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <dl className="totals">
                                    <div><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
                                    <div><dt>Delivery · {o.shipping.zoneName}</dt><dd>{o.deliveryFee ? money(o.deliveryFee) : "Free"}</dd></div>
                                    <div className="totals__total"><dt>Total</dt><dd>{money(o.total)}</dd></div>
                                </dl>
                            </section>

                            <section className="psec psec--2">
                                <div>
                                    <p className="eyebrow">Customer</p>
                                    <p>{o.customer.firstName} {o.customer.lastName}</p>
                                    <p><a className="link" href={`mailto:${o.customer.email}`}>{o.customer.email}</a></p>
                                    <p><a className="link" href={`tel:${o.customer.phone}`}>{o.customer.phone}</a></p>
                                </div>
                                <div>
                                    <p className="eyebrow">{o.shipping.method === "pickup" ? "Pickup" : "Deliver to"}</p>
                                    {o.shipping.method === "pickup" ? <p>Customer will pick up</p> : (
                                        <>
                                            <p>{o.shipping.address}</p>
                                            {o.shipping.landmark && <p className="muted">{o.shipping.landmark}</p>}
                                            <p>{o.shipping.city}, {o.shipping.state}</p>
                                        </>
                                    )}
                                </div>
                            </section>

                            {o.note && (
                                <section className="psec">
                                    <p className="eyebrow">Customer note</p>
                                    <p className="quote">{o.note}</p>
                                </section>
                            )}

                            <section className="psec">
                                <a className="btn btn--wa btn--sm" href={waLink(o.customer.phone, customerMessage)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16} /> Message customer on WhatsApp</a>
                            </section>

                            <section className="psec">
                                <p className="eyebrow">Private note</p>
                                <textarea className="note-input" rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only you can see this. Rider name, tracking number…" />
                                {note !== (o.adminNote || "") && <button className="btn btn--ghost btn--sm" onClick={() => onUpdate(o, { adminNote: note }, "Note saved")}>Save note</button>}
                            </section>

                            <section className="psec">
                                <p className="eyebrow">History</p>
                                <ol className="history">
                                    {[...o.history].reverse().map((h, i) => (
                                        <li key={i}><span>{h.note || ORDER_STATUS[h.status]?.[0]}</span><span className="muted mono">{date(h.at, true)}</span></li>
                                    ))}
                                </ol>
                            </section>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}
