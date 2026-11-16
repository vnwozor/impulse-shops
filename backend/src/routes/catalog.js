import express from "express";
import { db } from "../db.js";
import { requireAdmin } from "../lib/security.js";
import { asyncRoute, HttpError, num, slugify, str } from "../lib/util.js";

const router = express.Router();

/* ---------------- helpers ---------------- */

const cleanProduct = (body, existing = {}) => {
    const name = str(body.name ?? existing.name, 160);
    if (!name) throw new HttpError(400, "Product name is required");
    const category = slugify(body.category ?? existing.category ?? "");
    if (!category) throw new HttpError(400, "Choose a category");
    const price = Math.round(num(body.price ?? existing.price, NaN));
    if (!Number.isFinite(price) || price < 0) throw new HttpError(400, "Enter a valid price");

    const images = Array.isArray(body.images ?? existing.images)
        ? (body.images ?? existing.images).map((s) => str(s, 1000)).filter(Boolean).slice(0, 8)
        : [];
    const values = Array.isArray(body.options?.values)
        ? body.options.values.map((v) => str(v, 40)).filter(Boolean).slice(0, 30)
        : existing.options?.values || [];
    const details = Array.isArray(body.details ?? existing.details)
        ? (body.details ?? existing.details).map((d) => str(d, 200)).filter(Boolean).slice(0, 20)
        : [];

    return {
        name,
        brand: str(body.brand ?? existing.brand ?? "", 80),
        category,
        price,
        compareAt: Math.max(0, Math.round(num(body.compareAt ?? existing.compareAt, 0))),
        stock: Math.max(0, Math.round(num(body.stock ?? existing.stock, 0))),
        options: { label: str(body.options?.label ?? existing.options?.label ?? "", 40), values },
        description: str(body.description ?? existing.description ?? "", 4000),
        details,
        images,
        featured: Boolean(body.featured ?? existing.featured),
        isNew: Boolean(body.isNew ?? existing.isNew),
        condition: ["New", "Pre-owned"].includes(body.condition) ? body.condition : existing.condition || "New",
        status: body.status === "draft" ? "draft" : "active",
    };
};

const uniqueSlug = async (name, ignoreId) => {
    const base = slugify(name) || "item";
    const taken = new Set((await db.all("products")).filter((p) => p._id !== ignoreId).map((p) => p.slug));
    let slug = base;
    let i = 2;
    while (taken.has(slug)) slug = `${base}-${i++}`;
    return slug;
};

const sorters = {
    new: (a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    popular: (a, b) => (b.sold || 0) - (a.sold || 0) || Number(b.featured) - Number(a.featured),
};

/* ---------------- public ---------------- */

router.get("/products", asyncRoute(async (req, res) => {
    const { category, q, sort = "new", featured, isNew, limit } = req.query;
    let list = (await db.all("products")).filter((p) => p.status !== "draft");

    if (category) list = list.filter((p) => p.category === category);
    if (featured === "1") list = list.filter((p) => p.featured);
    if (isNew === "1") list = list.filter((p) => p.isNew);
    if (q) {
        const needle = String(q).toLowerCase();
        list = list.filter((p) =>
            [p.name, p.brand, p.category, p.description].join(" ").toLowerCase().includes(needle)
        );
    }
    list.sort(sorters[sort] || sorters.new);
    if (limit) list = list.slice(0, Math.min(100, num(limit, 100)));

    res.json({ success: true, products: list });
}));

router.get("/products/:key", asyncRoute(async (req, res) => {
    const all = await db.all("products");
    const product = all.find((p) => p.slug === req.params.key || p._id === req.params.key);
    if (!product || product.status === "draft") throw new HttpError(404, "This piece is no longer available");
    res.json({ success: true, product });
}));

router.get("/categories", asyncRoute(async (req, res) => {
    const [cats, products] = await Promise.all([db.all("categories"), db.all("products")]);
    const counts = {};
    for (const p of products) if (p.status !== "draft") counts[p.category] = (counts[p.category] || 0) + 1;
    cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    res.json({ success: true, categories: cats.map((c) => ({ ...c, count: counts[c.slug] || 0 })) });
}));

/* ---------------- admin ---------------- */

router.get("/admin/products", requireAdmin, asyncRoute(async (req, res) => {
    const list = (await db.all("products")).sort(sorters.new);
    res.json({ success: true, products: list });
}));

router.get("/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
    const product = await db.get("products", req.params.id);
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ success: true, product });
}));

router.post("/admin/products", requireAdmin, asyncRoute(async (req, res) => {
    const data = cleanProduct(req.body);
    const now = new Date().toISOString();
    const product = await db.insert("products", {
        ...data,
        slug: await uniqueSlug(data.name),
        sold: 0,
        createdAt: now,
        updatedAt: now,
    });
    res.status(201).json({ success: true, product });
}));

router.put("/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
    const existing = await db.get("products", req.params.id);
    if (!existing) throw new HttpError(404, "Product not found");
    const data = cleanProduct({ ...existing, ...req.body }, existing);
    const slug = data.name !== existing.name ? await uniqueSlug(data.name, existing._id) : existing.slug;
    const product = await db.update("products", existing._id, { ...data, slug, updatedAt: new Date().toISOString() });
    res.json({ success: true, product });
}));

// quick toggles from the product list (stock, featured, status)
router.patch("/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
    const patch = {};
    if ("featured" in req.body) patch.featured = Boolean(req.body.featured);
    if ("isNew" in req.body) patch.isNew = Boolean(req.body.isNew);
    if ("status" in req.body) patch.status = req.body.status === "draft" ? "draft" : "active";
    if ("stock" in req.body) patch.stock = Math.max(0, Math.round(num(req.body.stock, 0)));
    patch.updatedAt = new Date().toISOString();
    const product = await db.update("products", req.params.id, patch);
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ success: true, product });
}));

router.delete("/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
    const ok = await db.remove("products", req.params.id);
    if (!ok) throw new HttpError(404, "Product not found");
    res.json({ success: true });
}));

router.post("/admin/categories", requireAdmin, asyncRoute(async (req, res) => {
    const name = str(req.body.name, 60);
    if (!name) throw new HttpError(400, "Category name is required");
    const slug = slugify(name);
    const cats = await db.all("categories");
    if (cats.some((c) => c.slug === slug)) throw new HttpError(400, "That category already exists");
    const category = await db.insert("categories", { name, slug, image: str(req.body.image, 1000), order: cats.length });
    res.status(201).json({ success: true, category });
}));

router.put("/admin/categories/:id", requireAdmin, asyncRoute(async (req, res) => {
    const existing = await db.get("categories", req.params.id);
    if (!existing) throw new HttpError(404, "Category not found");
    const name = str(req.body.name ?? existing.name, 60) || existing.name;
    const patch = {
        name,
        image: str(req.body.image ?? existing.image, 1000),
        order: Math.round(num(req.body.order ?? existing.order, 0)),
    };
    const category = await db.update("categories", existing._id, patch);
    res.json({ success: true, category });
}));

router.delete("/admin/categories/:id", requireAdmin, asyncRoute(async (req, res) => {
    const existing = await db.get("categories", req.params.id);
    if (!existing) throw new HttpError(404, "Category not found");
    const used = (await db.all("products")).filter((p) => p.category === existing.slug).length;
    if (used) throw new HttpError(400, `Move or delete the ${used} product(s) in this category first`);
    await db.remove("categories", existing._id);
    res.json({ success: true });
}));

export default router;
