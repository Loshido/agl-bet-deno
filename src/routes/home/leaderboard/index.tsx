import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import Podium from "~/components/classement/podium";
import cache from "~/lib/cache";

interface Utilisateur {
    pseudo: string,
    agl: number
}

import pg from "~/lib/pg";
import redis from "~/lib/redis";
export const useClassement = routeLoader$(async () => {
    return await cache<Utilisateur[]>(async () => {
        const rd = redis
        const data = await rd.get('leaderboard')
        if(data) {
            const leaderboard = JSON.parse(data) as Utilisateur[]
            return ['ok', leaderboard]
        }

        return ['no', async leaderboard => {
            await rd.set('leaderboard', JSON.stringify(leaderboard), {
                EX: 10
            })
        }]
    }, async () => {
        const client = await pg()
    
        // On déduit le crédit pour que le classement soit + accurate
        const response = await client.query<Utilisateur>(
            `SELECT utilisateurs.pseudo, agl + coalesce(-credits.du, 0) AS agl
            FROM utilisateurs
            LEFT JOIN credits ON utilisateurs.pseudo = credits.pseudo 
            AND credits.status != 'rembourse'
            ORDER BY (utilisateurs.agl + coalesce(-credits.du, 0)) DESC`
        )
    
        client.release()
        return response.rows
    })
})

export default component$(() => {
    const classement = useClassement()
    return <>
        <div class="mx-auto my-4 md:my-8">
            <Podium 
                players={
                    classement.value.length < 3
                    ? [{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 },{ pseudo: 'x', agl: 0 }]
                    : classement.value.slice(0, 3) as [Utilisateur, Utilisateur, Utilisateur]} />
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