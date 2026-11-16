import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, money, STORE_URL } from "../lib/api";
import { useAdmin } from "../lib/admin";
import { Area, Card, Field, Gallery, Icon, PageHead, Toggle } from "../components/ui";

const blank = {
    name: "", brand: "", category: "", price: "", compareAt: "", stock: 1,
    options: { label: "Size", values: [] }, description: "", details: [], images: [],
    featured: false, isNew: true, condition: "New", status: "active",
};

const PRESETS = {
    "Clothing sizes": ["Size", ["XS", "S", "M", "L", "XL", "XXL"]],
    "Shoe sizes (EU)": ["Size (EU)", ["39", "40", "41", "42", "43", "44", "45", "46"]],
    "Belt sizes (cm)": ["Size (cm)", ["80", "85", "90", "95", "100", "105", "110"]],
    "Chain lengths": ["Length", ["45cm", "50cm", "55cm", "60cm"]],
    "Ring sizes": ["Ring size", ["5", "6", "7", "8", "9", "10", "11"]],
};

export default function ProductEdit() {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const { categories, notify, confirm, loadCategories } = useAdmin();
    const [p, setP] = useState(isNew ? null : undefined);
    const [original, setOriginal] = useState(null);
    const [optInput, setOptInput] = useState("");
    const [detailInput, setDetailInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isNew) {
            const start = { ...blank, category: categories[0]?.slug || "" };
            setP(start);
            setOriginal(start);
            return;
        }
        api(`/admin/products/${id}`)
            .then((d) => {
                const data = { ...blank, ...d.product, options: d.product.options || blank.options };
                setP(data);
                setOriginal(data);
            })
            .catch((e) => notify(e.message, "error"));
    }, [id, isNew]);

    useEffect(() => {
        if (isNew && p && !p.category && categories[0]) setP((x) => ({ ...x, category: categories[0].slug }));
    }, [categories]);

    if (!p) return <div className="page"><PageHead title={isNew ? "New product" : "Loading…"} /></div>;

    const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
    const dirty = JSON.stringify(p) !== JSON.stringify(original);
    const discount = Number(p.compareAt) > Number(p.price) && Number(p.price) > 0 ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

    const addOption = (raw) => {
        const vals = raw.split(",").map((s) => s.trim()).filter(Boolean);
        if (!vals.length) return;
        set("options", { ...p.options, values: [...new Set([...p.options.values, ...vals])] });
        setOptInput("");
    };
    const addDetail = () => {
        if (!detailInput.trim()) return;
        set("details", [...p.details, detailInput.trim()]);
        setDetailInput("");
    };

    const validate = () => {
        const e = {};
        if (!p.name.trim()) e.name = "Give the product a name";
        if (!p.category) e.category = "Choose a category";
        if (p.price === "" || Number(p.price) < 0) e.price = "Enter a price";
        if (!p.images.length) e.images = "Add at least one image";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = async () => {
        if (!validate()) {
            notify("Some fields need attention", "error");
            return;
        }
        setSaving(true);
        try {
            const body = { ...p, price: Number(p.price), compareAt: Number(p.compareAt) || 0, stock: Number(p.stock) || 0 };
            const d = isNew
                ? await api("/admin/products", { method: "POST", body })
                : await api(`/admin/products/${id}`, { method: "PUT", body });
            setOriginal(p);
            loadCategories();
            notify(isNew ? "Product added to the website" : "Product saved");
            if (isNew) navigate(`/products/${d.product._id}`, { replace: true });
            else {
                const fresh = { ...blank, ...d.product };
                setP(fresh);
                setOriginal(fresh);
            }
        } catch (e) {
            notify(e.message, "error");
        }
        setSaving(false);
    };

    const remove = async () => {
        const ok = await confirm({ title: `Delete “${p.name}”?`, body: "This removes it from the website.", action: "Delete product", danger: true });
        if (!ok) return;
        await api(`/admin/products/${id}`, { method: "DELETE" });
        loadCategories();
        notify("Product deleted");
        navigate("/products");
    };

    return (
        <div className="page page--form">
            <Link to="/products" className="back"><Icon name="left" size={14} /> Products</Link>
            <PageHead title={isNew ? "New product" : p.name || "Untitled"}>
                {!isNew && p.slug && <a href={`${STORE_URL}/product/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn--ghost"><Icon name="external" size={16} /> View</a>}
                <button className="btn btn--ink" onClick={save} disabled={saving}>{saving ? "Saving…" : isNew ? "Publish product" : "Save"}</button>
            </PageHead>

            <div className="formgrid">
                <div className="formgrid__main">
                    <Card title="Images" sub="The first image is the cover on the shop page. Drag to reorder.">
                        <Gallery images={p.images} onChange={(v) => set("images", v)} />
                        {errors.images && <p className="form-error">{errors.images}</p>}
                    </Card>

                    <Card title="Details">
                        <div className="fields">
                            <Field label="Name" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Structured Leather Shoulder Bag" className={errors.name ? "has-error" : ""} hint={errors.name} />
                            <Field label="Brand (optional)" value={p.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Shown above the name" />
                            <Area label="Description" rows={5} value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="What it is, how it feels, what fits inside, how it wears." />
                            <div className="field">
                                <span className="field__label">Key details</span>
                                <ul className="detail-list">
                                    {p.details.map((d, i) => (
                                        <li key={i}>
                                            <span>{d}</span>
                                            <button type="button" className="iconbtn" onClick={() => set("details", p.details.filter((_, j) => j !== i))} aria-label="Remove detail"><Icon name="close" size={14} /></button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="inline-add">
                                    <input value={detailInput} onChange={(e) => setDetailInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDetail())} placeholder="e.g. Comes with dust bag" />
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={addDetail}>Add</button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Options" sub="Sizes, lengths or colours the customer must pick. Leave empty if there's only one.">
                        <div className="fields fields--2">
                            <Field label="Option name" value={p.options.label} onChange={(e) => set("options", { ...p.options, label: e.target.value })} placeholder="Size" />
                            <Field label="Quick fill">
                                <select defaultValue="" onChange={(e) => { if (e.target.value) set("options", { label: PRESETS[e.target.value][0], values: PRESETS[e.target.value][1] }); e.target.value = ""; }}>
                                    <option value="">Choose a preset…</option>
                                    {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="chips">
                            {p.options.values.map((v) => (
                                <span key={v} className="chip">
                                    {v}
                                    <button type="button" onClick={() => set("options", { ...p.options, values: p.options.values.filter((x) => x !== v) })} aria-label={`Remove ${v}`}><Icon name="close" size={12} /></button>
                                </span>
                            ))}
                            <input
                                className="chip-input"
                                value={optInput}
                                onChange={(e) => setOptInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addOption(optInput); } }}
                                onBlur={() => addOption(optInput)}
                                placeholder={p.options.values.length ? "Add another" : "Type a value and press Enter"}
                            />
                        </div>
                    </Card>
                </div>

                <div className="formgrid__side">
                    <Card title="Visibility">
                        <div className="fields">
                            <Toggle checked={p.status !== "draft"} onChange={(v) => set("status", v ? "active" : "draft")} label="Visible on website" hint="Turn off to hide it without deleting" />
                            <Toggle checked={p.featured} onChange={(v) => set("featured", v)} label="Featured" hint="Shows in “Most wanted” on the homepage" />
                            <Toggle checked={p.isNew} onChange={(v) => set("isNew", v)} label="Mark as new" hint="Adds a “New” tag to the product" />
                        </div>
                    </Card>

                    <Card title="Pricing">
                        <div className="fields">
                            <Field label="Price (₦)" type="number" min="0" value={p.price} onChange={(e) => set("price", e.target.value)} className={errors.price ? "has-error" : ""} hint={errors.price || (p.price ? money(p.price) : "")} />
                            <Field label="Compare-at price (₦)" type="number" min="0" value={p.compareAt || ""} onChange={(e) => set("compareAt", e.target.value)} hint={discount ? `Shows as ${discount}% off` : "Optional. Set higher than the price to show a discount."} />
                        </div>
                    </Card>

                    <Card title="Organise">
                        <div className="fields">
                            <Field label="Category" className={errors.category ? "has-error" : ""} hint={errors.category}>
                                <select value={p.category} onChange={(e) => set("category", e.target.value)}>
                                    <option value="">Choose…</option>
                                    {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Condition">
                                <select value={p.condition} onChange={(e) => set("condition", e.target.value)}>
                                    <option>New</option>
                                    <option>Pre-owned</option>
                                </select>
                            </Field>
                            <Field label="Stock" type="number" min="0" value={p.stock} onChange={(e) => set("stock", e.target.value)} hint={Number(p.stock) === 0 ? "Shows as sold out" : "Goes down automatically when someone orders"} />
                        </div>
                    </Card>

                    {!isNew && (
                        <button className="btn btn--danger-ghost" onClick={remove}><Icon name="trash" size={16} /> Delete product</button>
                    )}
                </div>
            </div>

            <div className={`savebar ${dirty ? "is-on" : ""}`}>
                <span>Unsaved changes</span>
                <div>
                    <button className="btn btn--ghost btn--sm" onClick={() => setP(original)} disabled={saving}>Discard</button>
                    <button className="btn btn--ink btn--sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                </div>
            </div>
        </div>
    );
}
