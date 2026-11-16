// Vercel serverless entry: every request is routed here by vercel.json
import { app, ready } from "../src/app.js";

export default async function handler(req, res) {
    await ready;
    return app(req, res);
}
