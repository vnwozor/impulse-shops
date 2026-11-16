import crypto from "crypto";

export const slugify = (s = "") =>
    String(s)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

export const orderNumber = () => `IMP-${crypto.randomInt(100000, 999999)}`;

export const token = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

export const str = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ""));

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
