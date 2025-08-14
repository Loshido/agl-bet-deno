import type { RequestHandler } from "@builder.io/qwik-city";
import cookie from "~/lib/cookie";

export const onGet: RequestHandler = async ctx => {
    ctx.cookie.delete('token', {
        path: '/',
        domain: cookie.domain
    })
    ctx.cookie.delete('transactions', {
        path: '/home/bank/history',
        domain: cookie.domain
    })

    throw ctx.redirect(302, '/')
}