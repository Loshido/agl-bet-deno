import { component$, Slot } from "@builder.io/qwik";
import { Link, routeLoader$, useLocation } from "@builder.io/qwik-city";

export const useIdentity = routeLoader$(ctx => {
    return ctx.sharedMap.get('identity') as undefined | 'root' | string
})

export default component$(() => {
    const identity = useIdentity()
    const loc = useLocation()
    return <>
        <div class="p-1.5 rounded-md flex flex-row items-center gap-2
            transition-colors bg-white/25 w-full md:w-fit font-avenir">
            <Link href="/admin/comptes/" prefetch={false}
                class={["px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2",
                "transition-colors hover:bg-white/25 font-avenir w-full md:w-fit",
                loc.url.pathname === '/admin/comptes/' &&  'bg-white/25']}>
                Comptes
            </Link>
            <Link  href="/admin/comptes/pending" prefetch={false}
                class={["px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2",
                "transition-colors hover:bg-white/25 font-avenir w-full md:w-fit",
                loc.url.pathname === '/admin/comptes/pending/' && 'bg-white/25']}>
                En attente
            </Link>
            {
                identity.value === 'root' && <Link  href="/admin/comptes/admins/" prefetch={false}
                    class={["px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2",
                    "transition-colors hover:bg-white/25 font-avenir w-full md:w-fit",
                    loc.url.pathname === '/admin/comptes/admins/' && 'bg-white/25']}>
                    Administrateurs
                </Link>
            }
        </div>
        <Slot/>
    </>
})