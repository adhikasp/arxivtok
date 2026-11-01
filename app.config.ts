import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@solidjs/start/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Pure client-side SPA: `vinxi build` emits static files to .output/public.
// The API lives in ./server (Rust); in dev, /api is proxied to it.
export default defineConfig({
    ssr: false,
    server: { preset: "static" },
    vite: {
        resolve: {
            alias: {
                "@": resolve(__dirname, "./src"),
            },
        },
        server: {
            host: true,
            allowedHosts: ["localhost", "dev.editfa.st", "*.editfa.st"],
            proxy: {
                "/api": process.env.API_URL ?? "http://127.0.0.1:3001",
            },
        },
    },
});
