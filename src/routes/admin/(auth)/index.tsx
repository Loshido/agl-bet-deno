import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

export const useIdentity = routeLoader$(ctx => {
    return ctx.sharedMap.get('identity') as undefined | 'root' | string
})

export default component$(() => {
    const identity = useIdentity()

    return <section class="p-4 lg:p-16 md:p-8 flex flex-col gap-2 lg:gap-3 xl:gap-4 relative">
        <p class="py-2 mx-4 text-pink">
            Connecté en tant que { identity.value }
        </p>
        <Link class="text-4xl font-bold px-4 py-2 hover:bg-white/25 rounded-md
            cursor-pointer font-sobi transition-colors"
            href="/admin/comptes/pending">
            Comptes
        </Link>
        <Link class="text-4xl font-bold px-4 py-2 hover:bg-white/25 rounded-md
            cursor-pointer font-sobi transition-colors"
            href="/admin/matchs">
            Matchs
        </Link>
        <Link class="text-4xl font-bold px-4 py-2 hover:bg-white/25 rounded-md
            cursor-pointer font-sobi transition-colors"
            href="/admin/retraits">
            Retraits
        </Link>
        <Link class="text-4xl font-bold px-4 py-2 hover:bg-white/25 rounded-md
            cursor-pointer font-sobi transition-colors"
            href="/admin/transactions">
            Transactions
        </Link>
    </section>
})