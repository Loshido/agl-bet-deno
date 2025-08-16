import { component$, Slot } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { verify } from "~/lib/jwt.ts";

export const onGet: RequestHandler = ({ cacheControl }) => {
    cacheControl({
        staleWhileRevalidate: 60 * 60 * 24 * 7,
        maxAge: 5,
    });
};

export const onRequest: RequestHandler = async ctx => {
    const token = ctx.cookie.get('token')
    if(ctx.url.pathname === '/' && token) {
        const payload = await verify(token.value)
        if(payload) throw ctx.redirect(302, '/home')
    }
}

export default component$(() => {
    return <Slot />;
});

export const head: DocumentHead = {
    title: "AGL Bet",
    meta: [
        {
            name: "description",
            content: "Une plateforme de paris fictifs pour l'évènement All Game Long",
        },
    ],
};