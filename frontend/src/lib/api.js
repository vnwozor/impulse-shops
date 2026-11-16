// In development Vite proxies /api and /uploads to the backend.
// In production set VITE_API_URL to the API's address, e.g. https://api.impulse.shops
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export async function api(path, { method = "GET", body } = {}) {
    let res;
    try {
        res = await fetch(`${API_URL}/api${path}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error("We couldn't reach the store. Check your connection and try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.message || "Something went wrong");
    return data;
}

// uploaded images are stored as /uploads/...; remote ones are full URLs
export const img = (src, width) => {
    if (!src) return "";
    if (src.startsWith("/uploads")) return `${API_URL}${src}`;
    if (width && src.includes("images.unsplash.com")) return src.replace(/w=\d+/, `w=${width}`);
    return src;
};

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
export const money = (n) => naira.format(n || 0).replace("NGN", "₦").replace(/\s/g, "");

export const waLink = (number, text = "") =>
    `https://wa.me/${String(number || "").replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const formatDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) =>
    new Date(iso).toLocaleDateString("en-GB", opts);
