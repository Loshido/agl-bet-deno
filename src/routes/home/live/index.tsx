import { component$ } from "@builder.io/qwik";
import { routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";
import { usePayload } from "../layout.tsx";
import { decode } from "~/lib/jwt.ts";

import { id as gen } from "env";
import kv, { Paris, Match, User } from "~/lib/kv.ts";
interface ProcessedData {
    id: string,
    titre: string,
    informations: string,
    match: string,
    agl: number,
    equipe: string,
    at: Date
}

export const useLive = routeLoader$(async ctx => {
    const payload = await ctx.resolveValue(usePayload)
    const db = await kv()

    const _paris = db.list<Paris>({
        prefix: ['paris', payload.pseudo]
    }) 
    const paris: ProcessedData[] = []
    for await (const pari of _paris) {
        const match_id = pari.key.at(3) as string
        const match = await db.get<Match>(['match', false, match_id])
        if(!match.value) continue;

        paris.push({
            id: pari.key.at(2) as string,
            titre: match.value.titre,
            informations: match.value.informations,
            match: match_id,
            agl: pari.value.agl,
            equipe: pari.value.equipe,
            at: pari.value.at
        })
    }

    return paris
})

export const retirer = server$(async function(id: string, match: string) {
    const token = this.cookie.get('token')
    if(!token) return false

    const payload = decode(token.value)
    if(!payload) return false

    const pseudo = payload.pseudo
    const db = await kv()

    try {
        const tr = db.atomic()
        const [_pari, _match, _user] = await db.getMany<[Paris, Match, number]>([
            ['paris', pseudo, id, match],
            ['match', false, match],
            ['agl', pseudo]
        ])
        if(!_pari.value || !_match.value || !_user.value) return false

        tr.delete(['paris', pseudo, id, match])

        tr.set(['match', false, match], {
            ..._match.value,
            agl: _match.value.agl - _pari.value.agl,
            participants: _match.value.participants - 1
        })
        tr.set(['transaction', pseudo, gen(10)], {
            agl: _pari.value.agl,
            raison: `Annulation pari pour ${_pari.value.equipe}`,
            at: new Date()
        })

        tr.set(['agl', pseudo], _user.value + _pari.value.agl)
        
        await tr.commit()
    } catch {
        return false
    }
    return true
})

export default component$(() => {
    const live = useLive()
    const nav = useNavigate()

    return <>
        <h1 class="text-2xl font-bold my-2">
            Paris actifs
        </h1>
        {
            live.value.length === 0 ? <section 
                class="min-h-96 text-center my-auto text-xl">
                Vous n'avez aucun pari actif 🤑
            </section>
            : null
        }
        {  
            live.value.map(pari => <div key={pari.id}
                class="bg-white/10 p-4 rounded-md
                grid grid-cols-2 grid-rows-3">
                <div class="row-span-2 flex flex-col">
                    <h1 class="font-sobi text-lg">
                        { pari.titre }
                    </h1>
                    <p class="text-xs text-white/50 font-light">
                        { pari.informations }
                    </p>
                </div>
                <div class="row-span-3 h-full w-full font-sobi text-xl
                    flex items-center text-center justify-end">
                    { pari.agl } 
                    <span class="text-sm font-avenir mx-2">
                        sur { pari.equipe }
                    </span> 
                </div>
                <div class="text-xs text-gray-500/75 w-fit hover:text-gray-500
                    py-1 cursor-pointer select-none uppercase font-bold" 
                    onClick$={async () => {
                        const succes = await retirer(pari.id, pari.match)
                        if(succes) {
                            nav(undefined, {
                                forceReload: true
                            })
                        }
                    }}>
                    se retirer
                </div>
            </div>)
        }
    </>
})