import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = process.env.API_TARGET || "http://localhost:4000";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            "/api": api,
            "/uploads": api,
        },
    },
});
