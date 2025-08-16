import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import Podium from "~/components/classement/podium.tsx";

import kv from "~/lib/kv.ts";
import { listen } from "~/lib/live.ts";
type NamedUser = { pseudo: string, agl: number }
export const useClassement = routeLoader$(async () => {
    const db = await kv()

    const _agl = await Array.fromAsync(db.list<number>({
        prefix: ['agl']
    }) )
    const users: { pseudo: string, agl: number }[] = []
    for await (const agl of _agl) {
        users.push({
            agl: agl.value,
            pseudo: agl.key.at(1) as string
        })
    }

    users.sort((a, b) => b.agl - a.agl)

    return users
})

export default component$(() => {
    const loader = useClassement()
    const classement = useStore<{ pseudo: string, agl: number }[]>([])

    useVisibleTask$(async () => {
        classement.push(...loader.value)
        await listen<[string, number]>('/events/agl', ([ pseudo, agl ]) => {
            const i = classement.findIndex(u => u.pseudo === pseudo)
            classement[i].agl = agl
            classement.sort((a, b) => b.agl - a.agl)
        })
    })

    return <>
        <div class="mx-auto my-4 md:my-8">
            <Podium 
                players={
                    classement.length < 3
                    ? [{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 }]
                    : classement.slice(0, 3) as [NamedUser, NamedUser, NamedUser]} />
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
            classement
                .slice(3)
                .map((joueur, i) => <div key={joueur.pseudo}
                class="grid grid-cols-7 lg:px-48 xl:px-96">
                <p class="font-light text-pink text-sm text-center">
                    { i + 4 }
                </p>
                <p class="font-bold col-span-4 animate-updated w-fit">
                    { joueur.pseudo }
                </p>
                <p class="text-sm font-sobi col-span-2 animate-updated w-fit">
                    { joueur.agl } <span 
                        class="text-pink text-xs">agl</span>
                </p>
            </div>)
        }
    </>
})