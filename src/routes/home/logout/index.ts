import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ctx => {
    ctx.cookie.delete('token', {
        path: '/',
    })
    ctx.cookie.delete('transactions', {
        path: '/home/bank/history',
    })

    throw ctx.redirect(302, '/')
}