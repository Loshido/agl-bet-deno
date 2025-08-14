import { InlineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tailwindcss from "@tailwindcss/vite";
import deno from "@deno/vite-plugin"

export default {
    configFile: false,
    plugins: [
        qwikVite(),
        qwikCity(), 
        tailwindcss(),
        {
            name: "loshido-pathrser",
            resolveId: {
                order: 'pre',
                handler(source: string) {
                    if(source.startsWith('~/')) {
                        return {
                            id: Deno.cwd() + '/src' + source.slice(1),
                            external: false
                        }
                    }
                    if(source === "env") {
                        return "./src/lib/env.ts"
                    }
                }
            }
        },
        deno() 
    ],
    optimizeDeps: {
        exclude: [],
    },

    server: {
        watch: {
            ignored: ["**/data/*"]
        },
        headers: {
            "Cache-Control": "public, max-age=0",
        },
    },
    preview: {
        headers: {
            "Cache-Control": "public, max-age=600",
        },
    }
} as InlineConfig
