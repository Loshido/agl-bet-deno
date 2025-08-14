import { component$, useSignal } from "@builder.io/qwik";
import { Link, routeAction$, z, zod$ } from "@builder.io/qwik-city";

import { id as gen } from "env";
import kv, { User } from "~/lib/kv.ts";
export const useRetrait = routeAction$(async (data, ctx) => {
    const payload = ctx.sharedMap.get('payload') as SharedPayload | undefined
    if(!payload?.pseudo) {
        return {
            message: "L'utilisateur est introuvable",
            status: false
        }
    }
    if(data.somme <= 0) {
        return {
            message: "On ne peut retirer une somme négative ou nulle. 🕵️",
            status: false
        }
    }

    const db = await kv()
    try {
        const user = await db.get<User>(['user', true, payload.pseudo])
        if(!user.value) 
            throw new Error("L'utilisateur n'existe pas")
        if(user.value.agl < data.somme) 
            throw new Error(payload.pseudo + " n'a pas les fonds nécessaires pour un retrait")
            
        const tr = db.atomic()

        tr.set(['user', true, payload.pseudo], {
            ...user.value,
            agl: user.value.agl - data.somme
        })
        
        tr.set(['transaction', payload.pseudo, gen(10)], {
            agl: -data.somme,
            raison: `Retrait`,
            at: new Date()
        })

        tr.set(['retrait', payload.pseudo, gen(10)], {
            agl: data.somme,
            at: new Date(),
            complete: false
        })
        await tr.commit()
    } catch(e) {
        throw e
    }

    return {
        message: "Votre retrait a été enregistré avec succès. 💵",
        status: true,
    }
}, zod$({
    somme: z.number()
}))

import Back from "~/assets/icons/back.svg?jsx"
import { type SharedPayload, usePayload } from "~/routes/home/layout.tsx";
export default component$(() => {    
    const payload = usePayload()
    const latest = useSignal(0)
    const somme = useSignal<number>()
    const message = useSignal('')
    const retrait = useRetrait()

    return <section class="flex flex-col gap-4 p-2 lg:px-80">
        <header class="w-full flex flex-row items-center justify-center p-4 relative">
            <Link class="p-2 rounded-md flex flex-row items-center gap-2 
                bg-white/25 hover:bg-white/50
                absolute left-4"
                href="/home/bank" prefetch={false}>
                <Back/>
            </Link>
            <h2 class="font-sobi text-white text-4xl">
                { payload.value.agl } <span class="text-sm text-pink">agl</span>
            </h2>
        </header>
        <h1 class="px-4 sm:px-8 text-2xl font-bold">
            Retirer de l'argents
        </h1>
        <p class="px-4 sm:px-8">
            Pour procéder, vous devez valider un retrait 
            puis demander les <span class="text-pink font-sobi text-sm">agl </span>
            à un membre du staff.
        </p>

        <input type="number" class="mx-4 px-4 sm:px-8 py-4 bg-white/25 rounded-md
            font-sobi text-xl outline-none" bind:value={somme}
            placeholder="Montant"/>
        <input type="submit" value="Retirer" 
            class="mx-4 px-4 sm:px-8 py-4 bg-pink rounded-md hover:bg-pink/75
            font-sobi text-xl cursor-pointer" onClick$={async () => {
                if(!somme.value) {
                    message.value = 'La somme doit être positive... 🧑‍🎓'
                    return
                }
                if(somme.value > payload.value.agl) {
                    message.value = 'Vous devez avoir cette somme... 🕵️'
                    return
                }
                if(latest.value + 1000 * 5 > Date.now()) {
                    message.value = 'Veuillez être patient, vous risquerez de vider votre compte.'
                    return
                }

                latest.value = Date.now()
                const data = await retrait.submit({
                    somme: somme.value
                })

                if(data.value.message) {
                    message.value = data.value.message
                    if(data.value.status === true) {
                        payload.value.agl -= somme.value
                    }
                }
            }} />
        <p class="mx-4">
            { message.value }
        </p>
    </section>
})