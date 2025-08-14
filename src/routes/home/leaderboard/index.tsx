import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import Podium from "~/components/classement/podium.tsx";

import kv, { User } from "~/lib/kv.ts";
type NamedUser = User & { pseudo: string }
export const useClassement = routeLoader$(async () => {
    const db = await kv()

    const _users = db.list<User>({
        prefix: ['user', true]
    }) 
    const users: (User & { pseudo: string })[] = []
    for await (const user of _users) {
        users.push({
            ...user.value,
            pseudo: user.key.at(2) as string
        })
    }

    users.sort((a, b) => b.agl - a.agl)

    return users
})

export default component$(() => {
    const classement = useClassement()
    return <>
        <div class="mx-auto my-4 md:my-8">
            <Podium 
                players={
                    classement.value.length < 3
                    ? [{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 }]
                    : classement.value.slice(0, 3) as [NamedUser, NamedUser, NamedUser]} />
        </div>
        <div class="grid grid-cols-7 font-black 
            lg:px-48 xl:px-96">
            <p class="font-sobi text-sm text-center">
                N°
            </p>
            <p class="font-bold col-span-4">
                Pseudo
            </p>
            <p class="text-sm col-span-2">
                Score
            </p>
        </div>
        {
            classement.value
                .slice(3)
                .map((joueur, i) => <div key={i}
                class="grid grid-cols-7 lg:px-48 xl:px-96">
                <p class="font-light text-pink text-sm text-center">
                    { i + 4 }
                </p>
                <p class="font-bold col-span-4">
                    { joueur.pseudo }
                </p>
                <p class="text-sm font-sobi col-span-2">
                    { joueur.agl } <span 
                        class="text-pink text-xs">agl</span>
                </p>
            </div>)
        }
    </>
})