import crypto from "crypto";
import jwt from "jsonwebtoken";

export function securityHeaders(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}

// small in-memory limiter; enough for a single server
export function rateLimit({ windowMs, max, message = "Too many requests, please slow down." }) {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    }, windowMs).unref();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const entry = hits.get(key) || { count: 0, reset: now + windowMs };
        if (entry.reset < now) {
            entry.count = 0;
            entry.reset = now + windowMs;
        }
        entry.count += 1;
        hits.set(key, entry);
        if (entry.count > max) return res.status(429).json({ success: false, message });
        next();
    };
}

const safeEqual = (a, b) => {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function checkAdmin(email, password) {
    return safeEqual(String(email).toLowerCase(), String(process.env.ADMIN_EMAIL).toLowerCase()) &&
        safeEqual(password, process.env.ADMIN_PASSWORD);
}

export const signAdmin = () => jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });

export function requireAdmin(req, res, next) {
    const header = req.headers.authorization || "";
    const t = header.startsWith("Bearer ") ? header.slice(7) : "";
    try {
        const payload = jwt.verify(t, process.env.JWT_SECRET);
        if (payload.role !== "admin") throw new Error("bad role");
        next();
    } catch {
        res.status(401).json({ success: false, message: "Please sign in again" });
    }
}
