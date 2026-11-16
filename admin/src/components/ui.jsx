import { useRef, useState } from "react";
import { img, uploadImages } from "../lib/api";
import { useAdmin } from "../lib/admin";

const paths = {
    grid: <><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
    tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8" r="1.2" /></>,
    folder: <path d="M3 7h6l2 2h10v10H3z" />,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5" /><path d="M16 4.5a3 3 0 0 1 0 6M18 15c1.8.6 2.8 2.2 3 5" /></>,
    layout: <><rect x="3" y="4" width="18" height="16" /><path d="M3 9h18M9 9v11" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>,
    truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 10h18M7 15h4" /></>,
    store: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9h16v2a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 11z" /><path d="M5 13v7h14v-7" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>,
    logout: <><path d="M14 4h6v16h-6" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
    menu: <path d="M3 8h18M3 16h18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
    up: <path d="M6 15l6-6 6 6" />,
    down: <path d="M6 9l6 6 6-6" />,
    left: <path d="M15 5l-7 7 7 7" />,
    right: <path d="M9 5l7 7-7 7" />,
    trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    image: <><rect x="3" y="4" width="18" height="16" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-9 9" /></>,
    star: <path d="M12 3c.7 5.3 2 8.7 9 9-7 .3-8.3 3.7-9 9-.7-5.3-2-8.7-9-9 7-.3 8.3-3.7 9-9z" />,
    whatsapp: <><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.6-1.1-2-2l1-1-1-2z" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export const Icon = ({ name, size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {paths[name]}
    </svg>
);

export const PageHead = ({ title, sub, children }) => (
    <header className="phead">
        <div>
            <h1>{title}</h1>
            {sub && <p>{sub}</p>}
        </div>
        {children && <div className="phead__actions">{children}</div>}
    </header>
);

export const Field = ({ label, hint, className = "", children, ...props }) => (
    <label className={`field ${className}`}>
        {label && <span className="field__label">{label}</span>}
        {children || <input {...props} />}
        {hint && <span className="field__hint">{hint}</span>}
    </label>
);

export const Area = ({ label, hint, className = "", ...props }) => (
    <label className={`field ${className}`}>
        {label && <span className="field__label">{label}</span>}
        <textarea {...props} />
        {hint && <span className="field__hint">{hint}</span>}
    </label>
);

export const Toggle = ({ checked, onChange, label, hint }) => (
    <label className="toggle">
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle__ui" aria-hidden="true" />
        <span className="toggle__text">
            <span>{label}</span>
            {hint && <small>{hint}</small>}
        </span>
    </label>
);

export const Badge = ({ tone = "neutral", children }) => <span className={`badge badge--${tone}`}>{children}</span>;

export const Card = ({ title, sub, action, children, className = "" }) => (
    <section className={`card ${className}`}>
        {(title || action) && (
            <div className="card__head">
                <div>
                    {title && <h2>{title}</h2>}
                    {sub && <p>{sub}</p>}
                </div>
                {action}
            </div>
        )}
        {children}
    </section>
);

export const Empty = ({ title, children }) => (
    <div className="emptybox">
        <Icon name="star" size={22} />
        <p className="emptybox__t">{title}</p>
        {children && <div className="emptybox__b">{children}</div>}
    </div>
);

// one image (hero slide, category cover...)
export function ImageField({ value, onChange, label = "Image", ratio = "16 / 10" }) {
    const { notify } = useAdmin();
    const [busy, setBusy] = useState(false);
    const input = useRef();

    const pick = async (files) => {
        if (!files?.length) return;
        setBusy(true);
        try {
            const [url] = await uploadImages([files[0]]);
            onChange(url);
        } catch (e) {
            notify(e.message, "error");
        }
        setBusy(false);
    };

    return (
        <div className="field">
            <span className="field__label">{label}</span>
            <div
                className={`imgfield ${busy ? "is-busy" : ""}`}
                style={{ aspectRatio: ratio }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}
            >
                {value ? <img src={img(value, 900)} alt="" /> : <span className="imgfield__empty"><Icon name="image" size={22} />Drop an image or click to upload</span>}
                <div className="imgfield__actions">
                    <button type="button" className="btn btn--sm btn--light" onClick={() => input.current.click()}>{value ? "Replace" : "Upload"}</button>
                    {value && <button type="button" className="btn btn--sm btn--light" onClick={() => onChange("")}>Remove</button>}
                </div>
                {busy && <span className="imgfield__busy">Uploading…</span>}
                <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
            </div>
        </div>
    );
}

// a gallery of product images: upload many, reorder, remove, first one is the cover
export function Gallery({ images, onChange }) {
    const { notify } = useAdmin();
    const [busy, setBusy] = useState(false);
    const [drag, setDrag] = useState(null);
    const input = useRef();

    const add = async (files) => {
        if (!files?.length) return;
        const room = 8 - images.length;
        if (room <= 0) return notify("A product can have up to 8 images", "error");
        setBusy(true);
        try {
            const urls = await uploadImages([...files].slice(0, room));
            onChange([...images, ...urls]);
        } catch (e) {
            notify(e.message, "error");
        }
        setBusy(false);
    };

    const move = (from, to) => {
        if (to < 0 || to >= images.length) return;
        const next = [...images];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x);
        onChange(next);
    };

    return (
        <div className="gallery">
            {images.map((src, i) => (
                <div
                    key={src + i}
                    className={`gallery__item ${drag === i ? "is-drag" : ""}`}
                    draggable
                    onDragStart={() => setDrag(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); }}
                    onDragEnd={() => setDrag(null)}
                >
                    <img src={img(src, 500)} alt="" />
                    {i === 0 && <span className="gallery__cover">Cover</span>}
                    <div className="gallery__tools">
                        <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left"><Icon name="left" size={14} /></button>
                        <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} aria-label="Move right"><Icon name="right" size={14} /></button>
                        <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove image"><Icon name="trash" size={14} /></button>
                    </div>
                </div>
            ))}
            {images.length < 8 && (
                <button
                    type="button"
                    className={`gallery__add ${busy ? "is-busy" : ""}`}
                    onClick={() => input.current.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
                >
                    <Icon name="plus" size={20} />
                    <span>{busy ? "Uploading…" : "Add images"}</span>
                    <small>JPG, PNG or WebP · drag to reorder</small>
                </button>
            )}
            <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </div>
    );
}

// sticky bar that appears when a form has unsaved changes
export const SaveBar = ({ dirty, saving, onSave, onReset, label = "You have unsaved changes" }) => (
    <div className={`savebar ${dirty ? "is-on" : ""}`}>
        <span>{label}</span>
        <div>
            {onReset && <button type="button" className="btn btn--ghost btn--sm" onClick={onReset} disabled={saving}>Discard</button>}
            <button type="button" className="btn btn--ink btn--sm" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
    </div>
);

export const ORDER_STATUS = {
    pending: ["Pending", "warn"],
    confirmed: ["Confirmed", "info"],
    processing: ["Processing", "info"],
    shipped: ["Shipped", "blue"],
    delivered: ["Delivered", "ok"],
    cancelled: ["Cancelled", "neutral"],
};
export const PAY_STATUS = {
    pending: ["Unpaid", "warn"],
    paid: ["Paid", "ok"],
    failed: ["Failed", "bad"],
    refunded: ["Refunded", "neutral"],
};
export const PAY_METHOD = { card: "Card (Paystack)", transfer: "Bank transfer", whatsapp: "WhatsApp" };
