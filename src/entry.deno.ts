import { createQwikCity } from "@builder.io/qwik-city/middleware/deno";
import qwikCityPlan from "@qwik-city-plan";
import { manifest } from "@qwik-client-manifest";
import render from "./entry.ssr.tsx";

// Create the Qwik City Deno middleware
const { router, notFound, staticFile } = createQwikCity({
    render,
    qwikCityPlan,
    manifest,
});

// Allow for dynamic port
const port = Number(Deno.env.get("PORT") ?? 80);

/* eslint-disable */
console.log(`Server starter: http://localhost:${port}/app/`);

Deno.serve({ port }, async (request: Request, info: any) => {
    const staticResponse = await staticFile(request);
    if (staticResponse) {
        return staticResponse;
    }

    // Server-side render this request with Qwik City
    const qwikCityResponse = await router(request, info);
    if (qwikCityResponse) {
        return qwikCityResponse;
    }

    // Path not found
    return notFound(request);
});