import { component$, useSignal } from "@builder.io/qwik";
import { type DocumentHead, routeLoader$, server$ } from "@builder.io/qwik-city";
import Equipe from "~/routes/home/match/[id]/Equipe.tsx";

import kv, { Match, Paris, User } from "~/lib/kv.ts";
import { id as gen } from "env"
export const useMatch = routeLoader$(async ctx => {
    const id = ctx.params.id;
    const db = await kv()

    const match = await db.get<Match>(['match', false, id])

    if(!match.value) {
        throw ctx.redirect(302, '/admin/matchs')
    }

    return match.value
})

export const choisirGagnant = server$(async function(gagnant: string) {
    const db = await kv()
    try {
        const id = this.params.id
        const tr = db.atomic()

        const match = await db.get<Match>(['match', false, id])

        if(!match.value) 
            throw new Error(`match ${id} doesn't exist`)

        tr.delete(['match', false, id])
        tr.set(['match', true, id], {
            ...match.value,
            statut: gagnant
        })

        const cagnotte = match.value.agl

        const _paris = db.list<Paris>({
            prefix: ['paris'],
        })

        const paris: { pseudo: string, agl: number }[] = []
        for await(const pari of _paris) {
            if(pari.value.equipe !== gagnant) continue;
            if(pari.value.match === id) continue;

            paris.push({ agl: pari.value.agl , pseudo: pari.key.at(1) as string })
        }

        const cagnotte_gagnante = paris.reduce(
            (pre, val) => val.agl + pre, 0)
        const cote = cagnotte / cagnotte_gagnante
        console.log(`[admin] Le gagnant du match ${ this.params.id }`
            + ` est ${gagnant} avec une cote à ${cote}`);
            
        const users: Map<string, User> = new Map() 
        for(const { pseudo, agl } of paris) {
            if(!users.has(pseudo)) {
                const user = await db.get<User>(['user', true, pseudo])
                if(!user.value) return;

                users.set(pseudo, user.value)
            }
            const user = users.get(pseudo)!
            
            const pay = Math.ceil(cote * agl)
            tr.set(['user', true, pseudo], {
                ...user,
                agl: user.agl + pay
            })
            tr.set(['transaction', pseudo, gen(10)], {
                agl: pay,
                raison: `Pari gagnant ${ id }`,
                at: new Date()
            })
        }

        await tr.commit()
    } catch(e) {
        console.error('[admin][db]',e)
    }
})

export default component$(() => {
    const match = useMatch()
    const gagnant = useSignal<string | null>(null)
    return <>
        <h2 class="font-sobi text-2xl">
            { match.value.titre }
        </h2>
        <p class="text-white/75 text-wrap">
            { match.value.informations }
        </p>
        <h2 class="text-xl font-semibold">
            Choix du gagnant
        </h2>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 w-full">
            { 
                match.value.equipes.map(equipe => <Equipe
                key={equipe}
                equipe={equipe}
                image={null}
                cote={0}
                onClick$={() => {
                    gagnant.value = equipe
                }}
                class={ gagnant.value === equipe
                    ? 'bg-pink/25'
                    : 'bg-white/10' }
            />) }
        </div>

        <button disabled={!gagnant.value}
            class="px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2
                transition-colors w-fit font-avenir
                disabled:bg-white/25 disabled:cursor-not-allowed disabled:text-white/50
                hover:bg-pink/75 bg-pink/50 cursor-pointer"
            onClick$={async () => {
                const confirmation = prompt(
                    `Entrez 'oui' pour choisir ${gagnant.value} en tant que gagnant du match.`
                )
                if(confirmation === 'oui' && gagnant.value) {
                    await choisirGagnant(gagnant.value)
                }
            }}>
            Envoyer
        </button>
    </>
})

export const head: DocumentHead = {
    frontmatter: {
        back_url: '/admin/matchs'
    }
}