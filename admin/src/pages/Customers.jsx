import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, date, money, waLink } from "../lib/api";
import { useAdmin } from "../lib/admin";
import { Empty, Icon, PageHead } from "../components/ui";

export default function Customers() {
    const { notify } = useAdmin();
    const [data, setData] = useState(null);
    const [tab, setTab] = useState("customers");
    const [q, setQ] = useState("");

    useEffect(() => {
        api("/admin/customers").then(setData).catch((e) => notify(e.message, "error"));
    }, []);

    const customers = useMemo(() => {
        const list = data?.customers || [];
        if (!q) return list;
        const n = q.toLowerCase();
        return list.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(n));
    }, [data, q]);

    const exportCsv = () => {
        const rows = tab === "customers"
            ? [["Name", "Email", "Phone", "State", "Orders", "Spent", "Last order"], ...customers.map((c) => [c.name, c.email, c.phone, c.state, c.orders, c.spent, c.lastOrder])]
            : [["Email", "Subscribed"], ...data.subscribers.map((s) => [s.email, s.createdAt])];
        const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `impulse-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="page">
            <PageHead title="Customers" sub="Everyone who has ordered, and everyone on the email list.">
                {data && <button className="btn btn--ghost" onClick={exportCsv}>Export CSV</button>}
            </PageHead>

            <div className="toolbar">
                <div className="tabs">
                    <button className={tab === "customers" ? "is-active" : ""} onClick={() => setTab("customers")}>Customers <span className="tabs__n">{data?.customers.length ?? 0}</span></button>
                    <button className={tab === "subscribers" ? "is-active" : ""} onClick={() => setTab("subscribers")}>Email list <span className="tabs__n">{data?.subscribers.length ?? 0}</span></button>
                </div>
                {tab === "customers" && (
                    <label className="search">
                        <Icon name="search" size={16} />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or phone" />
                    </label>
                )}
            </div>

            {!data ? (
                <div className="card"><div className="skeleton-rows" /></div>
            ) : tab === "customers" ? (
                customers.length === 0 ? (
                    <div className="card"><Empty title="No customers yet">Customers appear here after their first order.</Empty></div>
                ) : (
                    <div className="card card--flush">
                        <table className="table">
                            <thead><tr><th>Name</th><th>Contact</th><th>State</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th><th /></tr></thead>
                            <tbody>
                                {customers.map((c) => (
                                    <tr key={c.email}>
                                        <td>{c.name}</td>
                                        <td>{c.email}<small className="block muted">{c.phone}</small></td>
                                        <td className="muted">{c.state || "—"}</td>
                                        <td className="num">{c.orders}</td>
                                        <td className="num mono">{money(c.spent)}</td>
                                        <td className="muted">{date(c.lastOrder)}</td>
                                        <td className="actions">
                                            <a className="iconbtn" href={waLink(c.phone)} target="_blank" rel="noreferrer" title="WhatsApp"><Icon name="whatsapp" size={16} /></a>
                                            <Link className="iconbtn" to={`/orders?q=${encodeURIComponent(c.email)}`} title="Orders"><Icon name="receipt" size={16} /></Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : data.subscribers.length === 0 ? (
                <div className="card"><Empty title="No subscribers yet">People who sign up in the website footer show up here.</Empty></div>
            ) : (
                <div className="card card--flush">
                    <table className="table">
                        <thead><tr><th>Email</th><th>Signed up</th></tr></thead>
                        <tbody>
                            {data.subscribers.map((s) => (
                                <tr key={s._id}><td>{s.email}</td><td className="muted">{date(s.createdAt)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
