import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

import kv, { User } from "~/lib/kv.ts";

export const useUtilisateurs = routeLoader$(async () => {
    const db = await kv()

    const _users = db.list<User>({
        prefix: ['user', true]
    })
    const users: (User & { pseudo: string })[] = []
    for await(const user of _users) {
        users.push({
            ...user.value,
            pseudo: user.key.at(2) as string
        })
    }

    return users
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