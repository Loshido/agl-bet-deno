import { component$, useStore } from "@builder.io/qwik";
import { Link, routeAction$, z, zod$ } from "@builder.io/qwik-city";

import pg from "~/lib/pg";
import type { SharedPayload } from "~/routes/home/layout";
export const useEnvoyer = routeAction$(async (data, ctx) => {
    const payload = ctx.sharedMap.get('payload') as SharedPayload | undefined

    if(!payload || data.pseudo.length === 0) {
        return {
            message: "Les pseudos ont un problème",
            status: false
        }
    }
    if(payload.pseudo === data.pseudo) {
        return {
            message: "Tu ne peux te virer de l'argents à toi-même.",
            status: false
        }
    }
    if(data.somme <= 0) {
        return {
            message: "On ne peut retirer une somme négative ou nulle. 🕵️",
            status: false
        }
    }

    const origine = payload.pseudo;
    const destinataire = data.pseudo;
    const somme = data.somme;
    
    const client = await pg()
    try {
        await client.query('BEGIN')

        const ids = await client.query(
            `SELECT pseudo FROM utilisateurs 
            WHERE pseudo = $1 OR pseudo = $2`,
            [origine, destinataire])
        if(!ids.rowCount || ids.rowCount != 2) {
            await client.query('ROLLBACK');
            client.release()
            return {
                message: "L'utilisateur n'existe pas 🕵️",
                status: false,
            }
        }

        const compte = await client.query(
            `UPDATE utilisateurs SET agl = agl - $1
            WHERE pseudo = $2 AND agl >= $1`,
            [somme, origine]
        );
        if(!compte.rowCount) throw new Error(
            "L'origine du virement n'a pas les fonds.");

        await client.query(`UPDATE utilisateurs SET agl = agl + $1
            WHERE pseudo = $2`, [somme, destinataire])
        await client.query(`INSERT INTO transactions (pseudo, agl, raison) VALUES
            ($1, $2, $3),
            ($4, $5, $6)`,
            [
                origine, -somme, `Virement à ${destinataire}`,
                destinataire, somme, `Virement de ${origine}`
            ]
        )
        
        await client.query('COMMIT')
        await redis.hDel('payload', origine)
        await redis.hDel('payload', destinataire)
    } catch(e) {
        await client.query('ROLLBACK')
        client.release()
        throw e
    }
    
    client.release()

    return {
        message: "Votre virement a été effectué avec succès. 💵",
        status: true,
    }
}, zod$({
    somme: z.number(),
    pseudo: z.string()
}))

import Back from "~/assets/icons/back.svg?jsx"
import { usePayload } from "../../layout";
import redis from "~/lib/redis";
export default component$(() => {    
    const payload = usePayload()
    const envoie = useEnvoyer()
    const data = useStore({
        pseudo: '',
        montant: 0,
        message: ''
    })

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
        <h1 class="px-4 sm:px-8 text-2xl font-bold">
            Envoyer de l'argents
        </h1>
        <input type="text" class="mx-4 px-4 sm:px-8 py-4 bg-white/25 rounded-md
            font-sobi text-xl outline-none" onInput$={(_, t) => data.pseudo = t.value}
            placeholder="Pseudo" />
        <input type="number" class="mx-4 px-4 sm:px-8 py-4 bg-white/25 rounded-md
            font-sobi text-xl outline-none" onInput$={(_, t) => data.montant = parseInt(t.value)}
            placeholder="Montant" />
        <input type="submit" value="Envoyer" 
            class="mx-4 px-4 sm:px-8 py-4 bg-pink rounded-md hover:bg-pink/75
            font-sobi text-xl cursor-pointer" onClick$={async () => {
                if(data.pseudo.length === 0) {
                    data.message = 'Vous devez entrer un pseudo correcte!'
                    return
                }
                if(data.montant <= 0) {
                    data.message = "Saisissez un montant!"
                    return
                }
                if(data.montant > payload.value.agl) {
                    data.message = "Vous devez avoir assez d'argent!"
                    return
                }
                const response = await envoie.submit({
                    somme: data.montant,
                    pseudo: data.pseudo
                })
                if(response.value.message) {
                    data.message = response.value.message
                    if(response.value.status) {
                        payload.value.agl -= data.montant
                    }
                }
            }}/>
        <p class="mx-4">
            { data.message }
        </p>
    </section>
})