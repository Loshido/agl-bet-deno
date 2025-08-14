import { component$ } from "@builder.io/qwik";
import { routeLoader$, server$, useNavigate } from "@builder.io/qwik-city";
import pg from "~/lib/pg";
import { usePayload } from "../layout";
import { decode } from "~/lib/jwt";

interface Pari {
    id: number,
    titre: string,
    informations: string,
    match: number,
    agl: number,
    equipe: string,
    at: Date    
}

export const useLive = routeLoader$(async ctx => {
    const payload = await ctx.resolveValue(usePayload)
    const client = await pg();

    const response = await client.query<Pari>(
        `SELECT 
            p.id, p.match, p.agl, 
            p.equipe, p.at,
            m.titre, m.informations
        FROM paris p
        JOIN matchs m ON m.id = p.match
        WHERE pseudo = $1 AND fermeture > now()`,
        [payload.pseudo]
    )

    client.release()

    return response.rows
})

import redis from "~/lib/redis";
export const retirer = server$(async function(id: number, match: number) {
    const token = this.cookie.get('token')
    if(!token) return false
    const payload = decode(token.value)
    if(!payload) return false

    const pseudo = payload.pseudo
    const client = await pg()

    try {
        await client.query('BEGIN')
        const paris = await client.query<{ agl: number, equipe: string }>(
            `DELETE FROM paris 
            WHERE id = $2 AND pseudo = $1
            RETURNING agl, equipe`,
            [pseudo, id]
        )

        if(!paris.rowCount) {
            throw new Error('Pari introuvable')
        }
        const pari = paris.rows[0]

        const matchs = await client.query<unknown & { id: number }>(
            `UPDATE matchs SET 
            agl = agl - $2, participants = participants - 1
            WHERE id = $1
            RETURNING *`,
            [match, pari.agl])
        if(!matchs.rowCount) {
            throw new Error("Le match n'a pas été mis à jours")
        }

        await client.query(
            `INSERT INTO transactions (pseudo, agl, raison)
            VALUES ($1, $2, $3)`,
            [pseudo, pari.agl, "Annulation pari pour " + pari.equipe]
        )

        await client.query(
            `UPDATE utilisateurs
            SET agl = agl + $2
            WHERE pseudo = $1`,
            [pseudo, pari.agl]
        )
        
        await client.query('COMMIT')
        const new_match = matchs.rows[0]
        await redis.hSet('matchs', new_match.id, JSON.stringify(new_match))
    } catch {
        await client.query('ROLLBACK')
        client.release()
        return false
    }
    client.release()
    await redis.hDel('payload', pseudo)
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