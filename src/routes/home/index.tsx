import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ctx => {
    throw ctx.redirect(302, '/home/match')
}