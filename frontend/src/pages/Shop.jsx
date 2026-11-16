import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../context/Store";
import { api } from "../lib/api";
import ProductCard, { CardSkeleton } from "../components/ProductCard";

const SORTS = [
    ["new", "Newest"],
    ["popular", "Most wanted"],
    ["price-asc", "Price, low to high"],
    ["price-desc", "Price, high to low"],
];

export default function Shop() {
    const { category } = useParams();
    const [params, setParams] = useSearchParams();
    const { categories } = useStore();
    const [products, setProducts] = useState(null);
    const [error, setError] = useState("");
    const [hideSold, setHideSold] = useState(false);

    const sort = params.get("sort") || "new";
    const q = params.get("q") || "";
    const current = categories.find((c) => c.slug === category);

    useEffect(() => {
        setProducts(null);
        setError("");
        const qs = new URLSearchParams({ sort });
        if (category) qs.set("category", category);
        if (q) qs.set("q", q);
        api(`/products?${qs}`)
            .then((d) => setProducts(d.products))
            .catch((e) => setError(e.message));
    }, [category, sort, q]);

    const title = q ? `“${q}”` : current?.name || (sort === "new" && params.has("sort") ? "New in" : "All pieces");
    useEffect(() => {
        document.title = `${q ? `Search: ${q}` : current?.name || "Shop"} — Impulse.shops`;
    }, [q, current]);

    const shown = (products || []).filter((p) => !hideSold || p.stock > 0);

    const setSort = (value) => {
        const next = new URLSearchParams(params);
        next.set("sort", value);
        setParams(next, { replace: true });
    };

    return (
        <div className="shop wrap">
            <div className="shop__head">
                <nav className="crumbs" aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    {current ? <><Link to="/shop">Shop</Link><span>/</span><span>{current.name}</span></> : <span>Shop</span>}
                </nav>
                <h1 className="display-xl">{title}</h1>
                {products && <p className="shop__count">{shown.length} {shown.length === 1 ? "piece" : "pieces"}</p>}
            </div>

            <div className="shop__bar">
                <div className="chips" role="list">
                    <Link to={`/shop${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={`chip ${!category ? "is-active" : ""}`}>All</Link>
                    {categories.map((c) => (
                        <Link key={c._id} to={`/shop/${c.slug}${params.toString() ? `?${params}` : ""}`} className={`chip ${category === c.slug ? "is-active" : ""}`}>
                            {c.name}
                        </Link>
                    ))}
                </div>
                <div className="shop__tools">
                    <label className="check">
                        <input type="checkbox" checked={hideSold} onChange={(e) => setHideSold(e.target.checked)} />
                        <span>In stock only</span>
                    </label>
                    <label className="select">
                        <span className="sr-only">Sort by</span>
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            {error ? (
                <div className="empty"><p>{error}</p></div>
            ) : !products ? (
                <div className="grid grid--4">{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : shown.length === 0 ? (
                <div className="empty">
                    <p className="display-s">Nothing here yet.</p>
                    <p className="muted">{q ? "Try another word, or browse all pieces." : "New pieces arrive every week. Check back soon, or ask us to source one."}</p>
                    <Link to="/shop" className="btn btn--outline">Browse all</Link>
                </div>
            ) : (
                <div className="grid grid--4">
                    {shown.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
            )}
        </div>
    );
}
