import express from "express";
import { db } from "../db.js";
import { rateLimit, requireAdmin } from "../lib/security.js";
import { asyncRoute, HttpError, isEmail, num, orderNumber, str, token } from "../lib/util.js";
import { initializePayment, paystackEnabled, verifyPayment } from "../lib/paystack.js";

const router = express.Router();

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const getSettings = () => db.get("settings", "site");

// what a customer is allowed to see about their own order
const publicOrder = (o) => ({
    number: o.number,
    accessKey: o.accessKey,
    createdAt: o.createdAt,
    items: o.items,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    customer: { firstName: o.customer.firstName, lastName: o.customer.lastName, email: o.customer.email, phone: o.customer.phone },
    shipping: o.shipping,
    payment: { method: o.payment.method, status: o.payment.status },
    status: o.status,
    history: o.history,
});

export function deliveryQuote(settings, { method, state, zoneId }, subtotal) {
    const d = settings.delivery;
    if (method === "pickup") {
        if (!d.pickup?.enabled) throw new HttpError(400, "Pickup is not available right now");
        return { fee: 0, zoneName: d.pickup.label || "Pickup" };
    }
    const zones = d.zones || [];
    const zone =
        zones.find((z) => z.id === zoneId && (z.states.length === 0 || z.states.includes(state))) ||
        zones.find((z) => z.states.includes(state)) ||
        zones.find((z) => z.states.length === 0);
    if (!zone) throw new HttpError(400, "We don't deliver to that location yet");
    const free = d.freeOver > 0 && subtotal >= d.freeOver;
    return { fee: free ? 0 : zone.fee, zoneName: zone.name, zoneId: zone.id, eta: zone.eta };
}

/* ---------------- checkout ---------------- */

const checkoutLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 25, message: "Too many checkout attempts, try again shortly." });
const lookupLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 40 });

router.post("/orders", checkoutLimit, asyncRoute(async (req, res) => {
    const settings = await getSettings();
    const body = req.body || {};

    const customer = {
        firstName: str(body.customer?.firstName, 60),
        lastName: str(body.customer?.lastName, 60),
        email: str(body.customer?.email, 120).toLowerCase(),
        phone: str(body.customer?.phone, 30),
    };
    if (!customer.firstName || !customer.lastName) throw new HttpError(400, "Please enter your full name");
    if (!isEmail(customer.email)) throw new HttpError(400, "Please enter a valid email address");
    if (customer.phone.replace(/\D/g, "").length < 10) throw new HttpError(400, "Please enter a valid phone number");

    const method = body.shipping?.method === "pickup" ? "pickup" : "delivery";
    const shipping = {
        method,
        state: str(body.shipping?.state, 60),
        city: str(body.shipping?.city, 80),
        address: str(body.shipping?.address, 300),
        landmark: str(body.shipping?.landmark, 160),
    };
    if (method === "delivery" && (!shipping.state || !shipping.city || !shipping.address)) {
        throw new HttpError(400, "Please complete your delivery address");
    }

    const paymentMethod = ["card", "transfer", "whatsapp"].includes(body.paymentMethod) ? body.paymentMethod : "whatsapp";
    const p = settings.payments;
    const allowed =
        (paymentMethod === "card" && p.card?.enabled && paystackEnabled()) ||
        (paymentMethod === "transfer" && p.transfer?.enabled) ||
        (paymentMethod === "whatsapp" && p.whatsapp?.enabled);
    if (!allowed) throw new HttpError(400, "That payment option isn't available");

    // prices always come from the database, never from the browser
    const lines = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (lines.length === 0) throw new HttpError(400, "Your bag is empty");

    const items = [];
    const stockChanges = [];
    for (const line of lines) {
        const product = await db.get("products", str(line.productId, 40));
        const qty = Math.max(1, Math.min(20, Math.round(num(line.qty, 1))));
        if (!product || product.status === "draft") throw new HttpError(400, "An item in your bag is no longer available");
        const option = str(line.option, 40);
        if (product.options?.values?.length && !product.options.values.includes(option)) {
            throw new HttpError(400, `Please choose a ${product.options.label.toLowerCase() || "option"} for ${product.name}`);
        }
        const alreadyTaken = stockChanges.filter((s) => s.id === product._id).reduce((n, s) => n + s.qty, 0);
        if (product.stock < qty + alreadyTaken) {
            throw new HttpError(400, product.stock - alreadyTaken > 0
                ? `Only ${product.stock - alreadyTaken} left of ${product.name}`
                : `${product.name} has just sold out`);
        }
        stockChanges.push({ id: product._id, qty });
        items.push({
            productId: product._id,
            slug: product.slug,
            name: product.name,
            image: product.images?.[0] || "",
            option,
            optionLabel: product.options?.label || "",
            price: product.price,
            qty,
        });
    }

    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const quote = deliveryQuote(settings, { method, state: shipping.state, zoneId: str(body.shipping?.zoneId, 40) }, subtotal);
    const now = new Date().toISOString();

    const order = await db.insert("orders", {
        number: orderNumber(),
        accessKey: token(12),
        createdAt: now,
        items,
        subtotal,
        deliveryFee: quote.fee,
        total: subtotal + quote.fee,
        customer,
        shipping: { ...shipping, zoneId: quote.zoneId || "", zoneName: quote.zoneName, eta: quote.eta || "" },
        note: str(body.note, 500),
        payment: { method: paymentMethod, status: "pending", reference: "" },
        status: "pending",
        history: [{ status: "pending", at: now, note: "Order placed" }],
    });

    // hold the stock as soon as the order exists
    for (const s of stockChanges) {
        const product = await db.get("products", s.id);
        await db.update("products", s.id, {
            stock: Math.max(0, product.stock - s.qty),
            sold: (product.sold || 0) + s.qty,
        });
    }

    let paymentUrl = "";
    if (paymentMethod === "card") {
        const reference = `${order.number}-${token(3)}`;
        try {
            const tx = await initializePayment({
                email: customer.email,
                amount: order.total,
                reference,
                callbackUrl: `${process.env.STORE_URL}/order/${order.number}?k=${order.accessKey}`,
                metadata: { orderNumber: order.number },
            });
            paymentUrl = tx.authorization_url;
            await db.update("orders", order._id, { payment: { ...order.payment, reference } });
        } catch (e) {
            console.log("Paystack init failed:", e.message);
        }
    }

    res.status(201).json({ success: true, order: publicOrder(order), paymentUrl });
}));

// confirmation page + Paystack return
router.get("/orders/:number", lookupLimit, asyncRoute(async (req, res) => {
    const all = await db.all("orders");
    let order = all.find((o) => o.number === req.params.number && o.accessKey === req.query.k);
    if (!order) throw new HttpError(404, "We couldn't find that order");

    if (order.payment.method === "card" && order.payment.status === "pending" && order.payment.reference && paystackEnabled()) {
        try {
            const tx = await verifyPayment(order.payment.reference);
            if (tx.status === "success" && tx.amount >= Math.round(order.total * 100)) {
                const now = new Date().toISOString();
                order = await db.update("orders", order._id, {
                    payment: { ...order.payment, status: "paid" },
                    status: order.status === "pending" ? "confirmed" : order.status,
                    history: [...order.history, { status: "confirmed", at: now, note: "Card payment received" }],
                });
            }
        } catch (e) {
            console.log("Paystack verify failed:", e.message);
        }
    }
    res.json({ success: true, order: publicOrder(order) });
}));

router.post("/orders/track", lookupLimit, asyncRoute(async (req, res) => {
    const number = str(req.body.number, 20).toUpperCase();
    const email = str(req.body.email, 120).toLowerCase();
    if (!number || !email) throw new HttpError(400, "Enter your order number and email");
    const order = (await db.all("orders")).find((o) => o.number === number && o.customer.email === email);
    if (!order) throw new HttpError(404, "No order matches those details. Check the number on your confirmation.");
    res.json({ success: true, order: publicOrder(order) });
}));

/* ---------------- admin ---------------- */

router.get("/admin/orders", requireAdmin, asyncRoute(async (req, res) => {
    const list = (await db.all("orders")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ success: true, orders: list });
}));

router.put("/admin/orders/:id", requireAdmin, asyncRoute(async (req, res) => {
    const order = await db.get("orders", req.params.id);
    if (!order) throw new HttpError(404, "Order not found");
    const now = new Date().toISOString();
    const patch = {};
    const history = [...order.history];

    if (req.body.status && req.body.status !== order.status) {
        if (!ORDER_STATUSES.includes(req.body.status)) throw new HttpError(400, "Unknown status");
        if (order.status === "cancelled") throw new HttpError(400, "A cancelled order can't be reopened. Place a new order instead.");
        patch.status = req.body.status;
        history.push({ status: req.body.status, at: now, note: str(req.body.note, 200) });

        // cancelling puts the pieces back on the shelf
        if (req.body.status === "cancelled") {
            for (const item of order.items) {
                const product = await db.get("products", item.productId);
                if (product) {
                    await db.update("products", product._id, {
                        stock: product.stock + item.qty,
                        sold: Math.max(0, (product.sold || 0) - item.qty),
                    });
                }
            }
        }
    }
    if (req.body.paymentStatus && req.body.paymentStatus !== order.payment.status) {
        if (!PAYMENT_STATUSES.includes(req.body.paymentStatus)) throw new HttpError(400, "Unknown payment status");
        patch.payment = { ...order.payment, status: req.body.paymentStatus };
        history.push({ status: patch.status || order.status, at: now, note: `Payment marked ${req.body.paymentStatus}` });
    }
    if ("adminNote" in req.body) patch.adminNote = str(req.body.adminNote, 1000);
    patch.history = history;

    const updated = await db.update("orders", order._id, patch);
    res.json({ success: true, order: updated });
}));

export default router;
