import { component$, useComputed$, useSignal, useStore } from "@builder.io/qwik";
import { Link, routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";
import Equipe from "./Equipe.tsx";
import { usePayload } from "~/routes/home/layout.tsx";

import { verify } from "~/lib/jwt.ts";
import { id as gen } from "env"
import kv, { User, Match, Paris } from "~/lib/kv.ts";
export const useMatch = routeLoader$(async ctx => {
    const db = await kv()
    const id = ctx.params.id

    const match = await db.get<Match>(['match', false, id])
    const now = new Date()

    if(!match.value || 
        now < match.value.ouverture || 
        now > match.value.fermeture) return null;    

    const _paris = db.list<Paris>({
        prefix: ['paris'],
    })
    const paris: Paris[] = []
    for await (const pari of _paris) {
        if(pari.value.match !== id) continue;
        paris.push(pari.value)
    } 

    const equipes: { [equipe: string]: number } = {}
    
    match.value.equipes.forEach(equipe => equipes[equipe] = 0)
    paris.forEach(row => {
        if(row.equipe in equipes) 
            equipes[row.equipe] += row.agl
    })

    return {
        ...match.value,
        equipes: Object.keys(equipes)
            .map(equipe => [
                equipe, 
                equipes[equipe]
            ]) 
    } satisfies Omit<Match, 'equipes'> & {
        equipes: [string, number][]
    }
})

export const parier = server$(async function(pari: number, equipe: string) {
    const cookie = this.cookie.get('token')
    if(!cookie) return false
    
    const payload = await verify(cookie.value, this.env)
    if(!payload) return false
    
    const pseudo = payload.pseudo
    const match = this.params.id
    const db = await kv()
    
    const user = await db.get<User>(['user', true, pseudo])
    if(!user.value) return false

    console.info(`[match] Pari entrant (${pseudo}, ${pari} agl, ${equipe})`)
    try {
        const tr = db.atomic()

        if(user.value.agl < pari) {
            console.info(`[match] ${pseudo} n'a pas assez d'agl`)
            throw new Error("Pas assez d'argents")
        }
        tr.set(['user', true, pseudo], {
            ...user.value,
            agl: user.value.agl - pari
        })
        tr.set(['transaction', pseudo, gen(10)], {
            agl: -pari,
            raison:  `Pari pour ${ equipe } (${match})`,
            at: new Date()
        })
        
        tr.set(['paris', pseudo, gen(10), match], {
            agl: pari,
            equipe,
            at: new Date()
        })
        
        const _match = await db.get<Match>(['match', false, match])
        if(!_match.value) 
            throw new Error(`[match] Le match ${match} n'existe pas.`)

        tr.set(['match', false, match], {
            ..._match.value,
            participants: _match.value.participants + 1,
            agl: _match.value.agl + pari
        })
        this.sharedMap.delete('payload')
        
        await tr.commit()

    } catch(e) {
        console.error(`[match][^${pseudo}]`,e)
        return false
    }
    return true
})

export default component$(() => {
    const match = useMatch();
    const payload = usePayload()
    const input = useSignal<HTMLInputElement>()
    const nav = useNavigate()
    const pari = useStore<{ 
        agl: number, 
        equipe: string | null, 
        cote: number | null
    }>({
        agl: 0,
        equipe: null,
        cote: null
    })
    const gain = useComputed$(() => {
        if(!pari.cote) return NaN
        if(!match.value) return NaN
        return Math.floor(pari.agl * (match.value.agl + pari.agl) 
        / ((match.value.agl / pari.cote) + pari.agl))
    })

    if(!match.value) return <section class="min-h-64 h-full w-full flex flex-col 
        items-center justify-center">
        <p class="text-2xl font-semibold">
            Ce match n'existe pas.
        </p> 
        <Link href="/home/match" prefetch={false}
            class="text-pink hover:text-pink/75 transition-colors">
                Revenir aux matchs
        </Link>
    </section>

    return <>
        <h1 class="text-3xl mt-4 font-sobi">
            { match.value.titre }
        </h1>
        <p class="text-white/75 text-wrap">
            { match.value.informations }
            <span class="text-white/75 text-xs italic"
                title="Période d'ouverture des paris"> - { 
                match.value.ouverture.toLocaleTimeString(undefined, {
                    timeStyle: 'short'
                }) } - { 
                match.value.fermeture.toLocaleTimeString(undefined, {
                    timeStyle: 'short'
                })
            }</span>
        </p>

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full min-h-96">
            { match.value.equipes.map(([equipe, agl]) => <Equipe
                key={equipe}
                equipe={equipe}
                image={null}
                cote={agl > 0 ? Math.floor(match.value.agl / agl * 100) / 100 : 0}
                onClick$={() => {
                    pari.equipe = equipe
                    pari.cote = agl > 0 ? match.value.agl / agl : 0
                }}
                class={ pari.equipe === equipe
                    ? 'bg-pink/25'
                    : 'bg-white/10' }
            />) }
        </div>

        <div class="absolute w-full flex flex-col gap-2 items-center
            bottom-0 left-0 p-4 md:p-8 lg:p-16 bg-midnight z-10">
            
            {
                pari.equipe && pari.agl > 0 && <div 
                    class="text-xl font-sobi text-white/50 flex 
                    flex-row gap-2">
                    <p>
                        Gains potentiels
                    </p>
                    {
                        <p class="text-pink/50">
                            +{ pari.cote ? gain.value : pari.agl + match.value.agl }
                        </p>
                    }
                </div>
            }
            
            <div class="sm:grid grid-cols-6 gap-2 font-sobi text-xl w-full">
                <button class="hidden sm:block h-full w-full rounded-md 
                    bg-white/25 py-2 text-center
                    transition-colors hover:bg-white/50"
                    onClick$={() => {
                        if(pari.agl - 100 < 0) return
                        pari.agl -= 100
                        if(input.value) {
                            input.value.value = pari.agl.toString()
                        }
                    }}>
                    -100</button>
                <button class="hidden sm:block h-full w-full rounded-md 
                    bg-white/25 py-2 text-center
                    transition-colors hover:bg-white/50"
                    onClick$={() => {
                        if(pari.agl - 10 < 0) return
                        pari.agl -= 10
                        if(input.value) {
                            input.value.value = pari.agl.toString()
                        }
                    }}>
                    -10</button>
                <input class="col-span-2 h-full w-full rounded-md
                    bg-white/25 py-2 text-center outline-none"
                    placeholder="Paris" ref={input}
                    type="number" onInput$={(_, t) => pari.agl = parseInt(t.value)} />
                <button class="hidden sm:block h-full w-full rounded-md 
                    bg-white/25 py-2 text-center
                    transition-colors hover:bg-white/50"
                    onClick$={() => {
                        pari.agl += 10
                        if(input.value) {
                            input.value.value = pari.agl.toString()
                        }
                    }}>
                    +10</button>
                <button class="hidden sm:block h-full w-full rounded-md 
                    bg-white/25 py-2 text-center
                    transition-colors hover:bg-white/50"
                    onClick$={() => {
                        pari.agl += 100
                        if(input.value) {
                            input.value.value = pari.agl.toString()
                        }
                    }}>
                    +100</button>
            </div>
            <button class="w-full px-4 py-2 font-sobi text-2xl 
                bg-pink rounded-md text-center disabled:bg-pink/50
                disabled:text-white/50"
                disabled={ !pari.equipe  || pari.agl === 0 
                    || pari.agl > payload.value.agl }
                onClick$={async (_, t) => {
                    if(t.disabled || !pari.equipe) return;
                    const succes = await parier(pari.agl, pari.equipe);

                    if(succes) {
                        nav('/home/live')
                    }
                }}>
                Parier
            </button>
        </div>
    </>
})