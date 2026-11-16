import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, img, money, STORE_URL } from "../lib/api";
import { useAdmin } from "../lib/admin";
import { Badge, Empty, Icon, PageHead } from "../components/ui";

export default function Products() {
    const { categories, notify, confirm, loadCategories } = useAdmin();
    const [products, setProducts] = useState(null);
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("");
    const [filter, setFilter] = useState("all");
    const navigate = useNavigate();

    const load = () => api("/admin/products").then((d) => setProducts(d.products)).catch((e) => notify(e.message, "error"));
    useEffect(() => { load(); }, []);

    const patch = async (p, change, message) => {
        setProducts((list) => list.map((x) => (x._id === p._id ? { ...x, ...change } : x)));
        try {
            await api(`/admin/products/${p._id}`, { method: "PATCH", body: change });
            if (message) notify(message);
        } catch (e) {
            notify(e.message, "error");
            load();
        }
    };

    const remove = async (p) => {
        const ok = await confirm({ title: `Delete “${p.name}”?`, body: "It will be removed from the website. Past orders keep their copy of the details.", action: "Delete product", danger: true });
        if (!ok) return;
        try {
            await api(`/admin/products/${p._id}`, { method: "DELETE" });
            setProducts((list) => list.filter((x) => x._id !== p._id));
            loadCategories();
            notify("Product deleted");
        } catch (e) {
            notify(e.message, "error");
        }
    };

    const shown = useMemo(() => {
        let list = products || [];
        if (cat) list = list.filter((p) => p.category === cat);
        if (filter === "active") list = list.filter((p) => p.status !== "draft");
        if (filter === "draft") list = list.filter((p) => p.status === "draft");
        if (filter === "low") list = list.filter((p) => p.stock <= 1);
        if (filter === "featured") list = list.filter((p) => p.featured);
        if (q) {
            const n = q.toLowerCase();
            list = list.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(n));
        }
        return list;
    }, [products, q, cat, filter]);

    const catName = (slug) => categories.find((c) => c.slug === slug)?.name || slug;

    return (
        <div className="page">
            <PageHead title="Products" sub={products ? `${products.length} in total` : " "}>
                <Link to="/products/new" className="btn btn--ink"><Icon name="plus" size={16} /> Add product</Link>
            </PageHead>

            <div className="toolbar">
                <label className="search">
                    <Icon name="search" size={16} />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" />
                </label>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="select">
                    <option value="">All categories</option>
                    {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
                </select>
                <div className="tabs">
                    {[["all", "All"], ["active", "Live"], ["draft", "Hidden"], ["low", "Low stock"], ["featured", "Featured"]].map(([v, l]) => (
                        <button key={v} className={filter === v ? "is-active" : ""} onClick={() => setFilter(v)}>{l}</button>
                    ))}
                </div>
            </div>

            {!products ? (
                <div className="card"><div className="skeleton-rows" /></div>
            ) : shown.length === 0 ? (
                <div className="card"><Empty title={products.length ? "No products match" : "No products yet"}>{!products.length && <Link to="/products/new" className="btn btn--ink">Add your first product</Link>}</Empty></div>
            ) : (
                <div className="card card--flush">
                    <table className="table table--products">
                        <thead>
                            <tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Featured</th><th>Visible</th><th /></tr>
                        </thead>
                        <tbody>
                            {shown.map((p) => (
                                <tr key={p._id} className={p.status === "draft" ? "is-dim" : ""}>
                                    <td>
                                        <Link to={`/products/${p._id}`} className="prod">
                                            <img src={img(p.images[0], 160)} alt="" className="thumb thumb--lg" />
                                            <span>
                                                <span className="prod__name">{p.name}</span>
                                                <span className="prod__meta">
                                                    {p.isNew && <Badge tone="blue">New</Badge>}
                                                    {p.compareAt > p.price && <Badge tone="warn">On sale</Badge>}
                                                    {p.options?.values?.length > 0 && <span className="muted">{p.options.values.length} {p.options.label.toLowerCase() || "options"}</span>}
                                                </span>
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="muted">{catName(p.category)}</td>
                                    <td className="num mono">{money(p.price)}</td>
                                    <td className="num">
                                        <StockInput value={p.stock} onSave={(stock) => patch(p, { stock }, `Stock updated to ${stock}`)} />
                                    </td>
                                    <td><Switch checked={p.featured} onChange={(v) => patch(p, { featured: v })} label="Featured" /></td>
                                    <td><Switch checked={p.status !== "draft"} onChange={(v) => patch(p, { status: v ? "active" : "draft" }, v ? "Product is live" : "Product hidden from the website")} label="Visible on website" /></td>
                                    <td className="actions">
                                        <a href={`${STORE_URL}/product/${p.slug}`} target="_blank" rel="noreferrer" className="iconbtn" title="View on website"><Icon name="external" size={16} /></a>
                                        <button className="iconbtn" onClick={() => navigate(`/products/${p._id}`)} title="Edit"><Icon name="file" size={16} /></button>
                                        <button className="iconbtn iconbtn--danger" onClick={() => remove(p)} title="Delete"><Icon name="trash" size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const Switch = ({ checked, onChange, label }) => (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
        <span />
    </button>
);

function StockInput({ value, onSave }) {
    const [v, setV] = useState(value);
    useEffect(() => setV(value), [value]);
    const commit = () => {
        const n = Math.max(0, parseInt(v, 10) || 0);
        if (n !== value) onSave(n);
        else setV(value);
    };
    return (
        <input
            className={`stock ${value === 0 ? "is-out" : value === 1 ? "is-low" : ""}`}
            type="number" min="0" value={v}
            onChange={(e) => setV(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label="Stock"
        />
    );
}
