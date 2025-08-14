import { component$, useComputed$, useSignal, useStore } from "@builder.io/qwik";
import { Link, routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";

import type { Match } from "..";
interface Pari {
    agl: number,
    equipe: string
}

import pg from "~/lib/pg";
import redis from "~/lib/redis";
import cache from "~/lib/cache";
export const useMatch = routeLoader$(async ctx => {
    const match = await cache<Match | null>(async () => {
        const rd = redis
        const data = await rd.hGet('matchs', ctx.params.id);

        if(data) {
            try {
                const match = JSON.parse(data)
                const parsed = {
                    ...match,
                    ouverture: new Date(match.ouverture),
                    fermeture: new Date(match.fermeture)
                } as Match
                return ['ok', parsed]
            } catch(e) {
                console.error('[redis] parsing Match failed')
            }
        }
        return ['no', async match => {
            if(!match) return
            
            await rd.hSet('matchs', ctx.params.id, JSON.stringify(match))
        }]
    }, async () => {
        const client = await pg();
    
        const response = await client.query<Match>(
            `SELECT * FROM matchs
            WHERE id = $1 AND ouverture < now() AND fermeture > now()`,
            [ctx.params.id]
        )
        client.release()
        if(!response.rowCount) return null

        return response.rows[0]
    })
    if(!match) return null

    const client = await pg()
    const paris = await client.query<Pari>(
        `SELECT agl, equipe FROM paris
        WHERE match = $1`,
        [ctx.params.id]
    )

    const equipes: { [equipe: string]: number } = {}
    
    match.equipes.forEach(equipe => equipes[equipe] = 0)
    paris.rows.forEach(row => {
        if(row.equipe in equipes) {
            equipes[row.equipe] += row.agl
        }
    })

    client.release()

    return {
        ...match,
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
    const payload = decode(cookie.value)
    if(!payload) return false

    const pseudo = payload.pseudo
    const match = this.params.id
    const client = await pg()
    console.info(`[match] Pari entrant (${pseudo}, ${pari} agl, ${equipe})`)
    try {
        await client.query('BEGIN')
        const compte = await client.query(
            `UPDATE utilisateurs SET agl = agl - $2
            WHERE pseudo = $1 AND agl >= $2`,
            [pseudo, pari]
        )
        if(!compte.rowCount) {
            console.info(`[match] ${pseudo} n'a pas assez d'agl`)
            throw new Error("Pas assez d'argents")
        }

        await client.query(
            `INSERT INTO transactions (pseudo, agl, raison)
            VALUES ($1, $2, $3)`,
            [pseudo, -pari, `Pari pour ${ equipe } (${match})`]
        )
        
        await client.query(
            `INSERT INTO paris (pseudo, agl, match, equipe)
            VALUES ($1, $2, $3, $4)`,
            [pseudo, pari, match, equipe]
        )
        
        const matchs = await client.query<Match>(
            `UPDATE matchs SET participants = participants + 1, agl = agl + $2
            WHERE id = $1 RETURNING *`,
            [match, pari]
        )
        if(!matchs.rowCount) {
            throw new Error("Match non mis à jours.")
        }
        this.sharedMap.delete('payload')
        
        await client.query('COMMIT')
        client.release()
        await redis.hDel('payload', pseudo)

        const new_match = matchs.rows[0]
        await redis.hSet('matchs', new_match.id, JSON.stringify(new_match))
    } catch(e) {
        console.error(`[match][^${pseudo}]`,e)
        await client.query('ROLLBACK')
        client.release()
        return false
    }
    return true
})

import Equipe from "./Equipe";
import { decode } from "~/lib/jwt";
import { usePayload } from "~/routes/home/layout";
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
        <Link href="/home/match" 
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