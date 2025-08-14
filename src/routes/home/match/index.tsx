import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import Affiche from "~/components/equipes/affiche.tsx";

import kv, { Match } from "~/lib/kv.ts"
export const useMatchs = routeLoader$(async () => {
    const db = await kv()

    const _matchs = db.list<Match>({
        prefix: ['match', false]
    })
    const matchs: (Match & { id: string })[] = []
    const now = new Date()
    for await (const match of _matchs) {
        if(now < match.value.ouverture || 
            now > match.value.fermeture || 
            match.value.gagnant) continue;
        matchs.push({
            ...match.value,
            id: match.key.at(2) as string
        })
    }

    return matchs
})

export default component$(() => {
    const matchs = useMatchs()

    if(matchs.value.length === 0) return <section 
        class="min-h-96 text-center my-auto text-xl">
        Aucun match n'est sur le point de commencer 😧
    </section>

    return <>
        {
            matchs.value.map(match => 
                <Affiche
                    key={match.id}
                    match={match}/>)
        }
    </>
})