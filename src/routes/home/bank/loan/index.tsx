import { component$ } from "@builder.io/qwik";

import { routeAction$, zod$, z, Link, server$ } from "@builder.io/qwik-city";

import pg from "~/lib/pg";
import type { SharedPayload } from "~/routes/home/layout";
export const useCredit = routeAction$(async (data, ctx) => {
    const payload = ctx.sharedMap.get('payload') as SharedPayload | undefined
    if(!payload) return {
        message: "L'utilisateur est introuvable",
        status: false
    }
    const apport = data.apport;
    const interets = 0.8 * Math.exp(0.0366 * Math.log(apport * 3)) - 1
    const credit = apport * 3
    const du = (interets + 1) * credit

    const client = await pg()
        try {
            await client.query('BEGIN')
            const prets = await client.query(`SELECT id FROM credits
                WHERE pseudo = $1 AND status != 'rembourse'`,
                [payload.pseudo]);
            if(prets.rowCount) {
                const rd = redis
                const data = await rd.hGet('payload', payload.pseudo)
                if(data) {
                    const user = JSON.parse(data)
                    await rd.hSet('payload', payload.pseudo, JSON.stringify({
                        ...user,
                        credit: 'en attente'
                    }))
                }
                throw {
                    message: "Vous avez déjà un prêt en attente.",
                    status: false
                }
            }

            const argents = await client.query(`UPDATE utilisateurs SET agl = agl - $2 
                WHERE pseudo = $1 AND agl >= $2`,
                [payload.pseudo, apport]);
            if(!argents.rowCount) throw {
                message: "Vous n'avez pas assez d'argents pour cet apport.",
                status: false
            }

            await client.query(`INSERT INTO credits (pseudo, interets, apport, credit, du)
                VALUES ($1, $2, $3, $4, $5)`,
                [payload.pseudo, interets, Math.round(apport), Math.round(credit), Math.floor(du)]);
            
            await client.query(`INSERT INTO transactions (pseudo, agl, raison)
                VALUES ($1, $2, $3)`, 
                [payload.pseudo, -apport, "Apport pour crédit"])
            
            await client.query('COMMIT')
        } catch(e) {
            await client.query('ROLLBACK')
            console.error(e)
            if(typeof e === 'object' && e !== null && 'message' in e) {
                client.release()
                return e as {
                    message: string,
                    status: boolean
                }
            }
            throw e
        }
        client.release()
        await redis.hDel('payload', payload.pseudo)
        return {
            message: "Votre prêt est en attente",
            status: true
        }
}, zod$({
    apport: z.number().min(100).max(200000)
}))

import { credits as creditsCache } from "~/lib/cache";
export const loadCreditData = server$(async function(){
    const empty = {
        interets: 0,
        credit: 0,
        du: 0,
        status: 'en attente',
    }
    const token = this.cookie.get('token')
    if(!token) return empty
    const payload = decode(token.value)
    if(!payload) return empty

    const cache = await creditsCache.getItem(payload.pseudo)
    if(cache) {
        return cache
    }
    const client = await pg();

    const credits = await client.query<{
        interets: number,
        credit: number,
        du: number,
        status: 'en attente' | 'remboursement'
    }>(
        `SELECT interets, credit, du, status
        FROM credits
        WHERE pseudo = $1 AND status != 'rembourse'`,
        [payload.pseudo])

    client.release()

    if(credits.rowCount === 1) {
        await creditsCache.setItem(payload.pseudo, credits.rows[0])
        return credits.rows[0]
    }
    console.error(`[db][credit] le crédit de ${payload.pseudo} n'est pas conforme ou inexistant.`)
    return empty
})

export const useRemboursement = routeAction$(async (_, ctx) => {
    const payload = ctx.sharedMap.get('payload') as SharedPayload | undefined
    if(!payload) return {
        message: "L'utilisateur est introuvable",
        status: false
    }
    const client = await pg();
    try {
        await client.query('BEGIN')

        const credit = await client.query<{ interets: number, credit: number, du: number }>(
            `SELECT interets, credit, du FROM credits
            WHERE pseudo = $1 AND status = 'remboursement'`,
            [payload.pseudo]
        );

        if(!credit.rowCount) throw {
            message: "Vous n'avez pas de crédits",
            status: false
        }

        const argents = await client.query(
            `UPDATE utilisateurs SET agl = agl - $2
            WHERE pseudo = $1 AND agl >= $2`,
            [payload.pseudo, credit.rows[0].du]
        )
        payload.agl -= credit.rows[0].du

        if(!argents.rowCount) throw {
            message: "Vous n'avez pas assez d'argents",
            status: false
        }

        await client.query(
            `UPDATE credits SET status = 'rembourse'
            WHERE pseudo = $1 AND status = 'remboursement'`,
            [payload.pseudo]
        );

        await client.query(
            `INSERT INTO transactions (pseudo, agl, raison)
            VALUES ($1, $2, $3)`,
            [payload.pseudo, -credit.rows[0].du, "Remboursement crédit"]
        )

        await client.query('COMMIT')
        await creditsCache.removeItem(payload.pseudo)
    } catch(e) {
        await client.query('ROLLBACK')
        client.release()
        console.error("[db][credit]", e)
        if(typeof e === 'object' && e && 'message' in e && typeof e.message === 'string') {
            return e as {
                message: string,
                status: boolean
            }
        }

        throw e
    }
    client.release()
    ctx.sharedMap.set('payload', {
        ...payload,
        credit: undefined
    } as SharedPayload)

    const rd = redis
    const data = await rd.hGet('payload', payload.pseudo)
    if(data) {
        const user = JSON.parse(data)
        await rd.hSet('payload', payload.pseudo, JSON.stringify({
            ...user,
            credit: undefined,
            agl: payload.agl
        }))
    }
    return {
        message: "Votre crédit est remboursé.",
        status: true
    }
})

import { usePayload } from "~/routes/home/layout";

import Back from "~/assets/icons/back.svg?jsx"
import Attente from "./attente";
import Demande from "./demande";
import Remboursement from "./remboursement";
import { decode } from "~/lib/jwt";
import redis from "~/lib/redis";
export default component$(() => {  
    const payload = usePayload();

    return <section class="flex flex-col gap-4 p-2 lg:px-80">
        <header class="w-full flex flex-row items-center justify-center p-4 relative">
            <Link class="p-2 rounded-md flex flex-row items-center gap-2 
                bg-white/25 hover:bg-white/50
                absolute left-4"
                href="/home/bank">
                <Back/>
            </Link>
            <h2 class="font-sobi text-white text-4xl">
                { payload.value.agl } <span class="text-sm text-pink">agl</span>
            </h2>
        </header>
        {
            payload.value.credit === 'en attente' && 
                <Attente/>
        }
        {
            payload.value.credit === undefined && 
                <Demande payload={payload}/>
        }
        {
            payload.value.credit === 'remboursement' && 
                <Remboursement/>
        }
    </section>
})