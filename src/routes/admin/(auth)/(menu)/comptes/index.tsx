import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

import kv from "~/lib/kv.ts";

export const useUtilisateurs = routeLoader$(async () => {
    const db = await kv()

    const users = await Array.fromAsync(db.list<number>({
        prefix: ['agl']
    }))

    return users.map(u => ({
        pseudo: u.key.at(1) as string,
        agl: u.value
    }))
})

export default component$(() => {
    const utilisateurs = useUtilisateurs()
    return <>
        {
            utilisateurs.value.map((utilisateur, i) => <div 
                key={i}
                class="grid grid-cols-4 gap-2 *:transition-colors items-center">
                <p class="col-span-2">
                    {utilisateur.pseudo} 
                </p>
                <p class="font-sobi">
                    {utilisateur.agl} <span class="text-xs text-pink">agl</span>
                </p>
                <Link class="py-1.5 px-2 font-bold text-center hover:bg-white/50 
                    bg-white/25 cursor-pointer select-none rounded-sm" prefetch={false}
                    href={`/admin/comptes/${ utilisateur.pseudo }`}>
                    Voir
                </Link>
            </div>)
        }
    </>
})