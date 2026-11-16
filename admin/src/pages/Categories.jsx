import { useState } from "react";
import { api, img } from "../lib/api";
import { useAdmin } from "../lib/admin";
import { Empty, Field, Icon, ImageField, PageHead } from "../components/ui";

export default function Categories() {
    const { categories, loadCategories, notify, confirm } = useAdmin();
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        if (!editing.name.trim()) return notify("Give the category a name", "error");
        setBusy(true);
        try {
            if (editing._id) await api(`/admin/categories/${editing._id}`, { method: "PUT", body: editing });
            else await api("/admin/categories", { method: "POST", body: editing });
            await loadCategories();
            notify("Category saved");
            setEditing(null);
        } catch (e) {
            notify(e.message, "error");
        }
        setBusy(false);
    };

    const move = async (c, dir) => {
        const list = [...categories];
        const i = list.findIndex((x) => x._id === c._id);
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        try {
            await Promise.all(list.map((x, k) => api(`/admin/categories/${x._id}`, { method: "PUT", body: { order: k } })));
            await loadCategories();
        } catch (e) {
            notify(e.message, "error");
        }
    };

    const remove = async (c) => {
        const ok = await confirm({ title: `Delete ${c.name}?`, body: c.count ? `It still has ${c.count} product(s). Move them to another category first.` : "It will disappear from the menu.", action: "Delete", danger: true });
        if (!ok) return;
        try {
            await api(`/admin/categories/${c._id}`, { method: "DELETE" });
            await loadCategories();
            notify("Category deleted");
        } catch (e) {
            notify(e.message, "error");
        }
    };

    return (
        <div className="page">
            <PageHead title="Categories" sub="These appear in the Shop menu and on the homepage, in this order.">
                <button className="btn btn--ink" onClick={() => setEditing({ name: "", image: "" })}><Icon name="plus" size={16} /> New category</button>
            </PageHead>

            {categories.length === 0 ? (
                <div className="card"><Empty title="No categories yet" /></div>
            ) : (
                <div className="catgrid">
                    {categories.map((c, i) => (
                        <div key={c._id} className="catcard">
                            <div className="catcard__img">{c.image ? <img src={img(c.image, 500)} alt="" /> : <Icon name="image" size={24} />}</div>
                            <div className="catcard__body">
                                <div>
                                    <p className="catcard__name">{c.name}</p>
                                    <p className="muted small">{c.count} product{c.count === 1 ? "" : "s"} · /shop/{c.slug}</p>
                                </div>
                                <div className="catcard__tools">
                                    <button className="iconbtn" onClick={() => move(c, -1)} disabled={i === 0} aria-label="Move up"><Icon name="left" size={15} /></button>
                                    <button className="iconbtn" onClick={() => move(c, 1)} disabled={i === categories.length - 1} aria-label="Move down"><Icon name="right" size={15} /></button>
                                    <button className="iconbtn" onClick={() => setEditing({ ...c })} aria-label="Edit"><Icon name="file" size={15} /></button>
                                    <button className="iconbtn iconbtn--danger" onClick={() => remove(c)} aria-label="Delete"><Icon name="trash" size={15} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <div className="modal" role="dialog" aria-modal="true">
                    <div className="modal__scrim" onClick={() => setEditing(null)} />
                    <div className="modal__box modal__box--wide">
                        <h3>{editing._id ? "Edit category" : "New category"}</h3>
                        <div className="fields">
                            <Field label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus hint={editing._id ? "Renaming keeps the same web address." : ""} />
                            <ImageField label="Cover image" ratio="4 / 3" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} />
                        </div>
                        <div className="modal__actions">
                            <button className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
                            <button className="btn btn--ink" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save category"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
