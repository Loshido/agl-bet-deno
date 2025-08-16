import { $, component$, useSignal } from "@builder.io/qwik";
import { Link, routeLoader$, server$ } from "@builder.io/qwik-city";
import Dialog from "~/components/Dialog.tsx";
import kv, { User, Match, Paris } from "~/lib/kv.ts";
import { id as gen } from "env"

export const useMatchs = routeLoader$(async () => {
    const db = await kv()

    const _matchs = db.list<Match>({
        prefix: ['match', false]
    })
    const matchs: (Match & { id: string })[] = []
    for await(const match of _matchs) {
        matchs.push({ ...match.value, id: match.key.at(2) as string })
    }

    return matchs
})

type Action = { type: 'supprimer' } | 
    { type: 'allonger', temps: number } |
    { type: 'fermer' }

export const actionMatch = server$(async (id: string, action: Action) => {
    const db = await kv()
    
    const _match = await db.get<Match>(['match', false, id])
    if(!_match.value) {
        return
        // todo
    }
    switch(action.type) {
        case 'allonger': {
            if(typeof action.temps !== 'number') {
                break
            }
            
            await db.set(['match', false, id], {
                ..._match.value,
                fermeture: new Date(_match.value.fermeture.getTime() + 1000 * 60 * action.temps)
            })
            break
        }
        case 'supprimer':
            try {
                const tr = db.atomic()

                const paris = db.list<Paris>({ prefix: ['paris'] })
                for await (const pari of paris) {
                    const pseudo = pari.key.at(1) as string
                    if(pari.value.match !== id) continue; 

                    tr.delete(pari.key)
                    const from = await db.get<number>(['agl', pseudo])
                    
                    if(!from.value) continue;

                    tr.set(['agl', pseudo], from.value + pari.value.agl)

                    tr.set(['transaction', pseudo, gen(10)], {
                        agl: pari.value.agl,
                        raison: `Annulation du pari (${id}).`,
                        at: new Date()
                    })
                }

                tr.delete(['match', false, id])
                await tr.commit()
            } catch {
                console.error(`Failed to delete match ${id}.`)
            }
            break
        case 'fermer':
            await db.set(_match.key, {
                ..._match.value,
                fermeture: new Date()
            })
            break
    }
})

export default component$(() => {
    const matchs = useMatchs()
    const selection = useSignal<null | string>(null)
    return <>
        <Link href="/admin/matchs/new" prefetch={false}
            class="px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2
            transition-colors bg-white/25 hover:bg-white/50 w-fit font-avenir">
            Créer un nouveau match
        </Link>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {
                matchs.value.map(match => <div key={match.id} 
                    class="flex flex-col sm:grid p-3 rounded-md grid-cols-3 justify-between gap-2
                    sm:items-center bg-white/25">
                    <div class="flex flex-col gap-2 col-span-2">
                        <h2 class="font-sobi text-2xl">
                            { match.titre }
                        </h2>
                        <p class="text-white/75 text-wrap">
                            { match.informations }
                            <span class="text-white/75 text-xs italic"
                                title="Période d'ouverture des paris"> - { 
                                match.ouverture.toLocaleTimeString(undefined, {
                                    timeStyle: 'short'
                                }) } - { 
                                match.fermeture.toLocaleTimeString(undefined, {
                                    timeStyle: 'short'
                                })
                            }</span>
                        </p>
                    </div>
                    <div class="w-full h-full flex flex-row justify-end items-start">
                        { 
                            match.fermeture.getTime() < Date.now()
                            ? <Link prefetch={false}
                                href={`/admin/matchs/${match.id}`}
                                class="px-2 py-1 bg-white/25 rounded-md
                                transition-colors hover:bg-pink/75">
                                Entrer résultats
                            </Link>
                            : <div class="px-2 py-1 bg-white/25 rounded-md
                                transition-colors hover:bg-pink/75
                                cursor-pointer select-none"
                                onClick$={() => selection.value = match.id}>
                                Intéragir
                            </div>
                        }
                    </div>
                </div>)
            }
        </div>
        <Dialog open={ selection.value !== null }
            exit={$(() => selection.value = null)}
            class="text-white">
            <div class="px-2 py-1 bg-white/25 rounded-md
                transition-colors hover:bg-pink/75
                cursor-pointer select-none"
                onClick$={async () => {
                    const confirmation = prompt(
                        `Entrez 'oui' pour supprimer le match N°${selection.value}`
                    );
                    if(confirmation === 'oui' && selection.value) {
                        await actionMatch(selection.value, {
                            type: "supprimer"
                        })
                        selection.value = null
                    }
                }}>
                Supprimer
            </div>
            <div class="px-2 py-1 bg-white/25 rounded-md
                transition-colors hover:bg-pink/75
                cursor-pointer select-none"
                onClick$={async () => {
                    const qt = prompt(
                        `Entrez la quantité de minutes que vous voulez ajouter`
                    )
                    const min = parseInt(qt || '-1')
                    if(min > 0 && selection.value) {
                        await actionMatch(selection.value, {
                            type: 'allonger',
                            temps: min
                        })
                        selection.value = null
                    }
                }}>
                Rallonger
            </div>
            <div class="px-2 py-1 bg-white/25 rounded-md
                transition-colors hover:bg-pink/75
                cursor-pointer select-none"
                onClick$={async () => {
                    const confirmation = prompt(
                        `Entrez 'oui' pour fermer les paris du match`
                    )
                    if(confirmation === 'oui' && selection.value) {
                        await actionMatch(selection.value, {
                            type: 'fermer',
                        })
                        selection.value = null
                    }
                }}>
                Fermer
            </div>
        </Dialog>
    </>
})