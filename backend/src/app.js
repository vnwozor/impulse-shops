import "dotenv/config";
import express from "express";
import cors from "cors";
import { connect } from "./db.js";
import { seedIfEmpty } from "./seed.js";
import { rateLimit, securityHeaders } from "./lib/security.js";
import { UPLOAD_DIR } from "./lib/uploads.js";
import catalog from "./routes/catalog.js";
import orders from "./routes/orders.js";
import admin from "./routes/admin.js";

for (const key of ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]) {
    if (!process.env[key]) throw new Error(`Missing ${key} in the environment (see backend/.env.example)`);
}

export const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const origins = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(securityHeaders);
app.use(express.json({ limit: "200kb" }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", index: false, dotfiles: "deny" }));

app.use("/api", catalog);
app.use("/api", orders);
app.use("/api", admin);

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));

// never send stack traces to the browser
app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ success: false, message: status >= 500 ? "Something went wrong on our side" : err.message });
});

// connect once per server (or once per serverless instance on Vercel)
export const ready = connect().then(() => seedIfEmpty());
