import { build } from "vite";
import config from "./vite.ts";
import { denoServerAdapter } from "@builder.io/qwik-city/adapters/deno-server/vite";

await build({
    ...config,
    plugins: [
        ...config.plugins || [],
        denoServerAdapter({
            ssg: {
                include: ["/*"],
                origin: "http://localhost",
            }
        }),
    ],
    build: {
        ssr: true,
        rollupOptions: {
            input: ["~/entry.deno.ts", "@qwik-city-plan"],
        },
        minify: false,
    },
});

Deno.exit(0);