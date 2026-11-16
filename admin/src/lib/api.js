export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const STORE_URL = (import.meta.env.VITE_STORE_URL || "http://localhost:5173").replace(/\/$/, "");

const TOKEN_KEY = "impulse.admin.token";
export const getToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
        return "";
    }
};
export const setToken = (t) => {
    try {
        t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
};

let onUnauthorized = () => {};
export const handleUnauthorized = (fn) => (onUnauthorized = fn);

export async function api(path, { method = "GET", body } = {}) {
    let res;
    try {
        res = await fetch(`${API_URL}/api${path}`, {
            method,
            headers: {
                ...(body ? { "Content-Type": "application/json" } : {}),
                Authorization: `Bearer ${getToken()}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error("Can't reach the server. Is the API running?");
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.endsWith("/login")) onUnauthorized();
    if (!res.ok || data.success === false) throw new Error(data.message || "Something went wrong");
    return data;
}

export async function uploadImages(files) {
    const form = new FormData();
    [...files].forEach((f) => form.append("files", f));
    const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) onUnauthorized();
    if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
    return data.urls;
}

export const img = (src, width) => {
    if (!src) return "";
    if (src.startsWith("/uploads")) return `${API_URL}${src}`;
    if (width && src.includes("images.unsplash.com")) return src.replace(/w=\d+/, `w=${width}`);
    return src;
};

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
export const money = (n) => naira.format(n || 0).replace("NGN", "₦").replace(/\s/g, "");
export const compact = (n) =>
    n >= 1e6 ? `₦${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "")}m` : n >= 1e3 ? `₦${Math.round(n / 1e3)}k` : money(n);

export const date = (iso, withTime = false) =>
    new Date(iso).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: withTime ? undefined : "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });

export const waLink = (phone, text = "") => {
    let n = String(phone || "").replace(/\D/g, "");
    if (n.startsWith("0")) n = `234${n.slice(1)}`;
    return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
};
