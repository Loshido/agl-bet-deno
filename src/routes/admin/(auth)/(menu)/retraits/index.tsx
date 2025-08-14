import { component$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import Button from "~/components/admin/button.tsx";


import kv, { type Retrait } from "~/lib/kv.ts";
export const useRetraits = routeLoader$(async () => {
    const db = await kv()

    const _retraits = db.list<Retrait>({
        prefix: ['retrait']
    })

    const retraits: (Retrait & { id: string, pseudo: string })[] = []

    for await (const retrait of _retraits) {
        if(retrait.value.complete) continue;
        retraits.push({
            pseudo: retrait.key.at(1) as string,
            id: retrait.key.at(2) as string,
            ...retrait.value
        })
    }
    return retraits
})

const actionRetrait = server$(async (pseudo: string, id: string) => {
    const db = await kv()

    const retrait = await db.get<Retrait>(['retrait', pseudo, id])
    if(retrait.value && !retrait.value.complete) {
        await db.set(['retrait', pseudo, id], {
            ...retrait.value,
            complete: true
        })
    }
})

export default component$(() => {
    const retraits = useRetraits()
    return <>
        <h1 class="font-bold text-2xl my-4">
            Confirmation des retraits
        </h1>
        {
            retraits.value.length === 0 && <p>
                👀 Il n'y a pas de retraits en attente...
            </p>
        }
        {
            retraits.value.map((retrait, i) => <div key={i}
                class="grid grid-cols-3 gap-2 *:transition-colors items-center">
                <p class="font-bold">
                    { retrait.pseudo }
                    <span class="font-light text-xs mx-2">
                        { retrait.at.toLocaleTimeString(undefined, { timeStyle: 'short' }) }
                    </span>
                </p>
                <p class="text-right font-sobi text-sm">
                    { retrait.agl }
                    <span class="mx-2 text-pink text-xs">
                        agl
                    </span>
                </p>
                <Button onClick$={async () => {
                    const confirmation = prompt(`Entrez 'oui' pour confirmer`)
                    if(confirmation === 'oui') await actionRetrait(retrait.pseudo, retrait.id)
                }}>
                    Effectué
                </Button>
            </div>)
        }
    </>
})