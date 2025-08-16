import { component$, Slot, useVisibleTask$ } from "@builder.io/qwik";
import { Link, type RequestHandler, routeLoader$, useDocumentHead, useLocation } from "@builder.io/qwik-city";

export interface SharedPayload {
    pseudo: string,
    agl: number,
    credit?: 'remboursement' | 'en attente'
}

import { verify } from "~/lib/jwt.ts";
import kv, { User } from "~/lib/kv.ts"
export const onRequest: RequestHandler = async ctx => {
    const token = ctx.cookie.get('token');
    if(!token) throw ctx.redirect(302, '/');
    
    const payload = await verify(token.value)
    if(!payload) throw ctx.redirect(302, '/')
    
    // Get data from database
    const db = await kv()
    const user = await db.get<User>(['user', true, payload.pseudo])
    if(!user.value) throw ctx.redirect(302, '/logout')

    ctx.sharedMap.set('payload', {
        pseudo: payload.pseudo,
        agl: user.value.agl
    })
}

import Live from "~/assets/icons/live.svg?jsx"
import Leader from "~/assets/icons/leader.svg?jsx"
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
                    liens.map((lien, i) => <Link key={i} href={lien.path} prefetch={false}
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
                href="/home/bank" prefetch={false}>
                { payload.value.agl } <span class="text-sm text-pink">agl</span>
            </Link>
        </header>
        <Slot/>
    </section>
})