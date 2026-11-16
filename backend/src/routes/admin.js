import express from "express";
import { db } from "../db.js";
import { checkAdmin, rateLimit, requireAdmin, signAdmin } from "../lib/security.js";
import { asyncRoute, HttpError, isEmail, num, str } from "../lib/util.js";
import { storeImage, upload } from "../lib/uploads.js";
import { paystackEnabled } from "../lib/paystack.js";
import { NIGERIAN_STATES } from "../seed.js";

const router = express.Router();

/* ---------------- auth ---------------- */

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: "Too many sign-in attempts. Try again in 15 minutes." });

router.post("/admin/login", loginLimit, (req, res) => {
    const { email, password } = req.body || {};
    if (!checkAdmin(email || "", password || "")) {
        return res.status(401).json({ success: false, message: "Email or password is incorrect" });
    }
    res.json({ success: true, token: signAdmin() });
});

router.get("/admin/me", requireAdmin, (req, res) => res.json({ success: true, email: process.env.ADMIN_EMAIL }));

/* ---------------- uploads ---------------- */

router.post("/admin/upload", requireAdmin, (req, res, next) => {
    upload.array("files", 8)(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        try {
            const urls = [];
            for (const file of req.files || []) urls.push(await storeImage(file, req));
            res.json({ success: true, urls });
        } catch (e) {
            next(e);
        }
    });
});

/* ---------------- settings ---------------- */

router.get("/settings", asyncRoute(async (req, res) => {
    const settings = await db.get("settings", "site");
    const { _id, ...rest } = settings;
    res.json({ success: true, settings: rest, cardAvailable: paystackEnabled(), states: NIGERIAN_STATES });
}));

// each section of the settings is saved on its own from the admin
const SECTIONS = ["store", "announcement", "hero", "home", "delivery", "payments", "content"];

router.put("/admin/settings/:section", requireAdmin, asyncRoute(async (req, res) => {
    const { section } = req.params;
    if (!SECTIONS.includes(section)) throw new HttpError(400, "Unknown settings section");
    const value = req.body?.value;
    if (value === undefined || typeof value !== "object") throw new HttpError(400, "Nothing to save");
    if (JSON.stringify(value).length > 60000) throw new HttpError(400, "That is too much content to save at once");

    if (section === "delivery") {
        value.freeOver = Math.max(0, Math.round(num(value.freeOver, 0)));
        value.zones = (value.zones || []).map((z) => ({
            id: str(z.id, 40) || Math.random().toString(36).slice(2, 9),
            name: str(z.name, 80),
            states: (z.states || []).filter((s) => NIGERIAN_STATES.includes(s)),
            fee: Math.max(0, Math.round(num(z.fee, 0))),
            eta: str(z.eta, 80),
        })).filter((z) => z.name);
    }
    if (section === "store" && value.email && !isEmail(value.email)) throw new HttpError(400, "Store email doesn't look right");
    if (section === "store" && value.whatsapp) value.whatsapp = String(value.whatsapp).replace(/\D/g, "").replace(/^0/, "234");

    const settings = await db.get("settings", "site");
    const updated = await db.put("settings", "site", { ...settings, [section]: value });
    const { _id, ...rest } = updated;
    res.json({ success: true, settings: rest });
}));

/* ---------------- dashboard ---------------- */

router.get("/admin/stats", requireAdmin, asyncRoute(async (req, res) => {
    const [orders, products] = await Promise.all([db.all("orders"), db.all("products")]);
    const live = orders.filter((o) => o.status !== "cancelled");
    const paid = live.filter((o) => o.payment.status === "paid");

    // last 30 days of sales, one bucket per day (Lagos time)
    const days = [];
    const fmt = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5);
        days.push({ date: fmt(d), revenue: 0, orders: 0 });
    }
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
    for (const o of live) {
        const bucket = byDate[fmt(o.createdAt)];
        if (bucket) {
            bucket.orders += 1;
            if (o.payment.status === "paid") bucket.revenue += o.total;
        }
    }

    const sales = {};
    for (const o of live) for (const i of o.items) {
        sales[i.productId] ||= { productId: i.productId, name: i.name, image: i.image, qty: 0, revenue: 0 };
        sales[i.productId].qty += i.qty;
        sales[i.productId].revenue += i.qty * i.price;
    }

    res.json({
        success: true,
        stats: {
            revenue: paid.reduce((n, o) => n + o.total, 0),
            orders: live.length,
            awaitingPayment: live.filter((o) => o.payment.status === "pending").length,
            toFulfil: live.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length,
            averageOrder: paid.length ? Math.round(paid.reduce((n, o) => n + o.total, 0) / paid.length) : 0,
            products: products.length,
            lowStock: products.filter((p) => p.status !== "draft" && p.stock <= 1)
                .map((p) => ({ _id: p._id, name: p.name, stock: p.stock, image: p.images?.[0] })),
            days,
            topProducts: Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
            recent: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
        },
    });
}));

router.get("/admin/customers", requireAdmin, asyncRoute(async (req, res) => {
    const [orders, subscribers] = await Promise.all([db.all("orders"), db.all("subscribers")]);
    const map = {};
    for (const o of orders) {
        const key = o.customer.email;
        map[key] ||= { email: key, name: `${o.customer.firstName} ${o.customer.lastName}`, phone: o.customer.phone, orders: 0, spent: 0, lastOrder: o.createdAt, state: o.shipping.state };
        const c = map[key];
        c.orders += 1;
        if (o.status !== "cancelled" && o.payment.status === "paid") c.spent += o.total;
        if (o.createdAt > c.lastOrder) {
            c.lastOrder = o.createdAt;
            c.phone = o.customer.phone;
        }
    }
    res.json({
        success: true,
        customers: Object.values(map).sort((a, b) => b.lastOrder.localeCompare(a.lastOrder)),
        subscribers: subscribers.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
}));

/* ---------------- newsletter ---------------- */

router.post("/subscribe", rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), asyncRoute(async (req, res) => {
    const email = str(req.body?.email, 120).toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address");
    const exists = (await db.all("subscribers")).some((s) => s.email === email);
    if (!exists) await db.insert("subscribers", { email, createdAt: new Date().toISOString() });
    res.json({ success: true });
}));

export default router;
