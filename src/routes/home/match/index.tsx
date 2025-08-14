import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import Affiche from "~/components/equipes/affiche";

export interface Match {
    id: number,
    titre: string,
    informations: string,
    ouverture: Date,
    fermeture: Date,
    participants: number,
    agl: number,
    equipes: string[]
}

import pg from "~/lib/pg";
import cache from "~/lib/cache";
import redis from "~/lib/redis";
export const useMatchs = routeLoader$(async () => {
    return await cache<Match[]>(async () => {
        const rd = redis
        const matchs = await rd.hVals('matchs')

        if(matchs.length !== 0) {
            try {
                const parsed = matchs
                    .map(match => JSON.parse(match))
                    .map(match => ({
                        ...match,
                        ouverture: new Date(match.ouverture),
                        fermeture: new Date(match.fermeture),
                    }))
                    .filter(match => 
                        match.fermeture > Date.now()) as Match[]
                return ['ok', parsed]
            } catch(e) {
                console.error('[redis] parsing Match failed')
            }
        }
        return ['no', async matchs => {
            matchs.forEach(async match => {
                await rd.hSet('matchs', match.id, JSON.stringify(match))
            })
        }]
    }, async () => {
        const client = await pg();
    
        const response = await client.query<Match>(
            `SELECT * FROM matchs
            WHERE fermeture > now() AND ouverture < now()
            ORDER BY fermeture ASC`
        )
        
        client.release()
    
        return response.rows
    })
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