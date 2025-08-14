import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { Link, type RequestHandler, routeLoader$, useDocumentHead, useLocation } from "@builder.io/qwik-city";

export interface SharedPayload {
    pseudo: string,
    agl: number,
    credit?: 'remboursement' | 'en attente'
}

import { verify } from "~/lib/jwt.ts";

interface Payload {
    agl: number,
    badges: [],
    reset?: true,
    credit?: 'en attente' | 'remboursement'
}
export const onRequest: RequestHandler = async ctx => {
    if(ctx.url.searchParams.has('delete-cache')) {
        ctx.cookie.delete('transactions', {
            domain: cookie.domain,
        })
    }

    const token = ctx.cookie.get('token');
    if(!token) throw ctx.redirect(302, '/');
    
    const payload = await verify(token.value, ctx.env)
    if(!payload) throw ctx.redirect(302, '/')
    
    const data = await cache<Payload>(async () => {
        // Get data from cache
        const rd = redis
        const data = await rd.hGet('payload', payload.pseudo)

        if(!data) return ['no', async fresh => {
            await rd.hSet('payload', payload.pseudo, JSON.stringify(fresh))
        }]
        const fresh = JSON.parse(data) as Payload
        return ['ok', fresh]
    }, async () => {
        // Get data from database
        const client = await pg()
        const response = await client.query<{ agl: number }>(
            `SELECT agl FROM utilisateurs WHERE pseudo = $1`,
            [payload.pseudo]
        )
        const credits = await client.query<{ status: 'remboursement' | 'en attente' | 'rembourse'}>(
            `SELECT status FROM credits WHERE pseudo = $1`, 
            [payload.pseudo])
        client.release()

        const credit = credits.rowCount && credits.rows.some(row => row.status !== 'rembourse')
            ? credits.rows.find(row => row.status !== 'rembourse')!.status as 'remboursement' | 'en attente'
            : undefined

        return {
            agl: response.rows[0].agl,
            badges: [],
            credit
        }
    })

    ctx.sharedMap.set('payload', {
        pseudo: payload.pseudo,
        agl: data.agl,
        credit: data.credit
    })

    if(data.reset) {
        const reset_location = ctx.url;
        reset_location.searchParams.append('delete-cache', '')
        throw ctx.redirect(302, reset_location.toString())
    }
}

import Live from "~/assets/icons/live.svg?jsx"
import Leader from "~/assets/icons/leader.svg?jsx"
import cookie from "~/lib/cookie";
const liens = [
    {
        path: '/home/match/',
        slot: <>
            match
        </>
    },
    {
        path: '/home/live/',
        slot: <>
            <Live/>
            <span class="hidden sm:block">
                Live
            </span>
        </>
    },
    {
        path: '/home/leaderboard/',
        slot: <>
            <Leader/>
            <span class="hidden sm:block">
                Classement
            </span>
        </>
    },
]

export const usePayload = routeLoader$(ctx => {
    return ctx.sharedMap.get('payload') as SharedPayload
})

export default component$(() => {
    const head = useDocumentHead();
    const loc = useLocation();
    const payload = usePayload()

    useVisibleTask$(() => {
        if(loc.url.searchParams.has('delete-cache')) {
            localStorage.clear()
            sessionStorage.clear()

            loc.url.searchParams.delete('delete-cache')
        }
    })

    if(head.frontmatter.home_layout === false) return <Slot/>

    return <section class="min-h-svh p-4 lg:p-16 md:p-8 flex flex-col gap-2 lg:gap-4 xl:gap-5 overflow-hidden relative">
        <header class="flex flex-row items-center justify-between text-xl font-sobi z-10">
            <nav class="flex flex-row items-center gap-2">
                {
                    liens.map((lien, i) => <Link key={i} href={lien.path}
                        class={[
                        "p-2 sm:px-3 rounded-md flex flex-row items-center gap-2",
                        lien.path === loc.url.pathname
                        ? "bg-pink text-white"
                        : "bg-white/25 hover:bg-white/50"
                    ]}>
                        { lien.slot }
                    </Link>)
                }
            </nav>
            <Link class="p-1.5 sm:p-2 bg-white/25 hover:bg-white/50 rounded-md font-sobi whitespace-nowrap"
                href="/home/bank">
                { payload.value.agl } <span class="text-sm text-pink">agl</span>
            </Link>
        </header>
        <Slot/>
    </section>
})