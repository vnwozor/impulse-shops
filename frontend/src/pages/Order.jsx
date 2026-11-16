import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../context/Store";
import { api, money, waLink, formatDate } from "../lib/api";
import { OrderItems, Timeline, shippingLines } from "../components/OrderView";
import { IconWhatsApp } from "../components/Icons";

export default function Order() {
    const { number } = useParams();
    const [params] = useSearchParams();
    const { settings, notify } = useStore();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = `Order ${number} — Impulse.shops`;
        api(`/orders/${number}?k=${encodeURIComponent(params.get("k") || "")}`)
            .then((d) => setOrder(d.order))
            .catch((e) => setError(e.message));
    }, [number, params]);

    if (error) {
        return (
            <div className="wrap empty empty--page">
                <p className="display-m">{error}</p>
                <Link to="/track" className="btn btn--outline">Track an order</Link>
            </div>
        );
    }
    if (!order) return <div className="boot boot--inline" aria-busy="true"><span className="boot__mark" /></div>;

    const t = settings.payments.transfer;
    const hasBank = t.bankName && t.accountNumber;
    const pay = order.payment;
    const fresh = params.get("new") === "1";

    const summary = [
        `Hi Impulse.shops, I just placed order ${order.number}.`,
        ...order.items.map((i) => `• ${i.name}${i.option ? ` (${i.option})` : ""} × ${i.qty}`),
        `Total: ${money(order.total)}`,
        `Name: ${order.customer.firstName} ${order.customer.lastName}`,
        pay.method === "transfer" ? "I'll send proof of payment here." : "How would you like me to pay?",
    ].join("\n");

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            notify("Copied");
        } catch {
            notify(text);
        }
    };

    return (
        <div className="wrap orderpage">
            <div className="orderpage__head">
                <p className="eyebrow">Order {order.number} · {formatDate(order.createdAt)}</p>
                <h1 className="display-xl">{fresh ? <>Thank you, {order.customer.firstName}.</> : <>Your order</>}</h1>
                <p className="lead">
                    {pay.status === "paid"
                        ? "Payment received. We're getting your order ready and will message you when it's on the way."
                        : pay.method === "transfer"
                        ? "Your pieces are reserved. Complete the transfer below and send us the receipt on WhatsApp."
                        : pay.method === "whatsapp"
                        ? "Your pieces are reserved. Send us your order on WhatsApp to confirm payment and delivery."
                        : "We're waiting for your card payment to clear. This page updates when it does."}
                </p>
            </div>

            <div className="orderpage__grid">
                <div className="orderpage__main">
                    {pay.status !== "paid" && order.status !== "cancelled" && pay.method === "transfer" && (
                        <div className="paybox">
                            <p className="eyebrow">Transfer {money(order.total)} to</p>
                            {hasBank ? (
                                <dl className="paybox__dl">
                                    <div><dt>Bank</dt><dd>{t.bankName}</dd></div>
                                    <div><dt>Account name</dt><dd>{t.accountName}</dd></div>
                                    <div><dt>Account number</dt><dd><button className="copy" onClick={() => copy(t.accountNumber)}>{t.accountNumber} <span>Copy</span></button></dd></div>
                                    <div><dt>Reference</dt><dd><button className="copy" onClick={() => copy(order.number)}>{order.number} <span>Copy</span></button></dd></div>
                                </dl>
                            ) : (
                                <p>Our team will send the account details on WhatsApp. Tap below to get them now.</p>
                            )}
                            <a href={waLink(settings.store.whatsapp, summary)} className="btn btn--ink" target="_blank" rel="noreferrer"><IconWhatsApp /> {hasBank ? "Send receipt on WhatsApp" : "Get account details on WhatsApp"}</a>
                        </div>
                    )}
                    {pay.status !== "paid" && order.status !== "cancelled" && pay.method === "whatsapp" && (
                        <div className="paybox">
                            <p className="eyebrow">Next step</p>
                            <p>Send your order to our team. We'll reply with payment options and a delivery time.</p>
                            <a href={waLink(settings.store.whatsapp, summary)} className="btn btn--ink" target="_blank" rel="noreferrer"><IconWhatsApp /> Send order on WhatsApp</a>
                        </div>
                    )}

                    <section className="orderpage__block">
                        <p className="eyebrow">Status</p>
                        <Timeline order={order} />
                    </section>

                    <section className="orderpage__block orderpage__cols">
                        <div>
                            <p className="eyebrow">{order.shipping.method === "pickup" ? "Pickup" : "Delivering to"}</p>
                            <p>{order.customer.firstName} {order.customer.lastName}</p>
                            {shippingLines(order).map((l) => <p key={l} className="muted">{l}</p>)}
                        </div>
                        <div>
                            <p className="eyebrow">Contact</p>
                            <p>{order.customer.email}</p>
                            <p className="muted">{order.customer.phone}</p>
                        </div>
                    </section>
                    <p className="small muted">Keep your order number <strong>{order.number}</strong>. You can check progress any time on the <Link className="link-under" to="/track">track order</Link> page.</p>
                </div>

                <aside>
                    <OrderItems order={order} />
                </aside>
            </div>
        </div>
    );
}
