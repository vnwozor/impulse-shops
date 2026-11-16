import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, compact, date, img, money } from "../lib/api";
import { Badge, Card, Empty, Icon, ORDER_STATUS, PAY_STATUS, PageHead } from "../components/ui";

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api("/admin/stats").then((d) => setStats(d.stats)).catch((e) => setError(e.message));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    if (error) return <div className="page"><Empty title={error} /></div>;
    if (!stats) return <div className="page"><PageHead title={greeting} /><div className="kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="kpi kpi--skeleton" />)}</div></div>;

    const last7 = stats.days.slice(-7);
    const prev7 = stats.days.slice(-14, -7);
    const sum = (arr, k) => arr.reduce((n, d) => n + d[k], 0);
    const rev7 = sum(last7, "revenue");
    const revPrev = sum(prev7, "revenue");
    const change = revPrev ? Math.round(((rev7 - revPrev) / revPrev) * 100) : null;

    return (
        <div className="page">
            <PageHead title={greeting} sub="Here's how the store is doing.">
                <Link to="/products/new" className="btn btn--ink"><Icon name="plus" size={16} /> Add product</Link>
            </PageHead>

            <div className="kpis">
                <Kpi label="Revenue (paid)" value={compact(stats.revenue)} note={`${compact(rev7)} in the last 7 days${change !== null ? ` · ${change >= 0 ? "+" : ""}${change}%` : ""}`} />
                <Kpi label="Orders" value={stats.orders} note={`${sum(last7, "orders")} in the last 7 days`} />
                <Kpi label="To fulfil" value={stats.toFulfil} note="Pending, confirmed or being prepared" to="/orders?status=open" alert={stats.toFulfil > 0} />
                <Kpi label="Awaiting payment" value={stats.awaitingPayment} note="Orders not marked paid yet" to="/orders?payment=pending" alert={stats.awaitingPayment > 0} />
            </div>

            <div className="dash">
                <Card title="Sales, last 30 days" sub="Paid revenue per day" className="dash__chart">
                    <Chart days={stats.days} />
                </Card>

                <Card title="Low stock" sub="One or none left" action={<Link to="/products" className="link">All products</Link>}>
                    {stats.lowStock.length === 0 ? (
                        <p className="muted pad">Everything is well stocked.</p>
                    ) : (
                        <ul className="rows">
                            {stats.lowStock.slice(0, 6).map((p) => (
                                <li key={p._id}>
                                    <Link to={`/products/${p._id}`} className="rowlink">
                                        <img src={img(p.image, 120)} alt="" className="thumb" />
                                        <span className="grow ellipsis">{p.name}</span>
                                        <Badge tone={p.stock === 0 ? "bad" : "warn"}>{p.stock === 0 ? "Sold out" : "1 left"}</Badge>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Recent orders" action={<Link to="/orders" className="link">All orders</Link>} className="dash__orders">
                    {stats.recent.length === 0 ? (
                        <Empty title="No orders yet">Orders placed on the website show up here instantly.</Empty>
                    ) : (
                        <table className="table">
                            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Payment</th><th>Status</th><th className="num">Total</th></tr></thead>
                            <tbody>
                                {stats.recent.map((o) => (
                                    <tr key={o._id}>
                                        <td><Link to={`/orders?open=${o._id}`} className="mono link">{o.number}</Link></td>
                                        <td>{o.customer.firstName} {o.customer.lastName}</td>
                                        <td className="muted">{date(o.createdAt)}</td>
                                        <td><Badge tone={PAY_STATUS[o.payment.status][1]}>{PAY_STATUS[o.payment.status][0]}</Badge></td>
                                        <td><Badge tone={ORDER_STATUS[o.status][1]}>{ORDER_STATUS[o.status][0]}</Badge></td>
                                        <td className="num mono">{money(o.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <Card title="Best sellers" sub="By revenue, all time">
                    {stats.topProducts.length === 0 ? (
                        <p className="muted pad">Nothing sold yet.</p>
                    ) : (
                        <ul className="rows">
                            {stats.topProducts.map((p, i) => (
                                <li key={p.productId} className="rowlink">
                                    <span className="mono muted">{String(i + 1).padStart(2, "0")}</span>
                                    <img src={img(p.image, 120)} alt="" className="thumb" />
                                    <span className="grow ellipsis">{p.name}<small className="muted block">{p.qty} sold</small></span>
                                    <span className="mono">{compact(p.revenue)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}

function Kpi({ label, value, note, to, alert }) {
    const body = (
        <>
            <span className="kpi__label">{label}{alert && <i className="kpi__dot" />}</span>
            <span className="kpi__value">{value}</span>
            <span className="kpi__note">{note}</span>
        </>
    );
    return to ? <Link to={to} className="kpi kpi--link">{body}</Link> : <div className="kpi">{body}</div>;
}

function Chart({ days }) {
    const [hover, setHover] = useState(null);
    const max = Math.max(1, ...days.map((d) => d.revenue));
    const h = 180;
    const w = days.length * 20;
    const active = hover !== null ? days[hover] : null;
    const total = days.reduce((n, d) => n + d.revenue, 0);

    return (
        <div className="chart">
            <div className="chart__readout">
                <span className="chart__big">{money(active ? active.revenue : total)}</span>
                <span className="muted">
                    {active ? `${new Date(active.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${active.orders} order${active.orders === 1 ? "" : "s"}` : "Total, last 30 days"}
                </span>
            </div>
            <svg viewBox={`0 0 ${w} ${h + 20}`} preserveAspectRatio="none" className="chart__svg" onMouseLeave={() => setHover(null)} role="img" aria-label="Daily paid revenue for the last 30 days">
                {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line key={f} x1="0" x2={w} y1={h - h * f} y2={h - h * f} className="chart__grid" />
                ))}
                {days.map((d, i) => {
                    const bh = d.revenue ? Math.max(3, (d.revenue / max) * (h - 8)) : 1.5;
                    return (
                        <g key={d.date} onMouseEnter={() => setHover(i)}>
                            <rect x={i * 20} y="0" width="20" height={h} fill="transparent" />
                            <rect x={i * 20 + 4} y={h - bh} width="12" height={bh} rx="2" className={`chart__bar ${hover === i ? "is-on" : ""} ${d.revenue ? "" : "is-zero"}`} />
                        </g>
                    );
                })}
            </svg>
            <div className="chart__axis">
                <span>{new Date(days[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <span>Today</span>
            </div>
        </div>
    );
}
