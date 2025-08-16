import { component$, useSignal } from "@builder.io/qwik";
import { type DocumentHead, Link, routeLoader$, server$, useLocation } from "@builder.io/qwik-city";
import Button from "~/components/admin/button.tsx";

import { admin, tokens } from "~/lib/admin.ts";
import kv, { User, Retrait } from "~/lib/kv.ts";
import { id as gen } from "env";
const modifyAGL = server$(async function(pseudo: string, agl: number) {
    const token = this.cookie.get('admin');
    const administrateur = admin === token?.value
        ? { name: 'root' }
        : tokens.get(token?.value || '')
    if(!administrateur) {
        return
    }

    const db = await kv()

    const tr = db.atomic()

    const from = await db.get<number>(['agl', pseudo])
    if(!from.value) throw new Error()
    
    tr.set(['transaction', pseudo, gen(10)], {
        agl: agl - from.value,
        raison: `Action staff`,
        at: new Date()
    })

    tr.set(['agl', pseudo], agl)

    console.log(`[admin] ${ pseudo } a désormais ${agl} agl`
        + ` (${ administrateur.name })`)

    await tr.commit()
})

export const useProfile = routeLoader$(async ctx => {
    const pseudo = ctx.params.pseudo
    const db = await kv()


    const agl = await db.get<number>(['agl', pseudo])
    if(!agl.value) return null
    const _retraits = db.list<Retrait>({
        prefix: ['retrait', pseudo]
    })
    const retraits: Retrait[] = []
    for await (const retrait of _retraits) {
        retraits.push(retrait.value)
    }

    return {
        pseudo,
        agl: agl.value,
        retraits
    }
})

export default component$(() => {
    const loc = useLocation()
    const profile = useProfile()
    const entree = useSignal('')

    return <div>
        <h1 class="font-bold text-2xl my-4">
            Profile de { loc.params.pseudo }
        </h1>
        {
            profile.value === null 
            ? <>
                Profile introuvable ⚠️
            </>
            : <>
                <div class="p-2 grid grid-cols-3 gap-2 items-center">
                    <p class="col-span-2 font-sobi text-2xl">
                        <span contentEditable="true" class="outline-none"
                            onInput$={(_, t) => entree.value = t.innerText}>
                            {profile.value.agl}
                        </span>
                        <span class="text-xs text-pink mx-2">
                            agl
                        </span>
                    </p>
                    <Button onClick$={async () => {
                        const agl = parseInt(entree.value)
                        if(agl >= 0) {
                            await modifyAGL(profile.value.pseudo, agl)
                        }
                    }}>
                        Modifier
                    </Button>
                </div>
                <hr class="my-4 border-white/25 rounded-md"/>

                <hr class="my-4 border-white/25 rounded-md"/>

                <h2 class="font-black text-xl my-2">
                    Retraits
                </h2>
                <div class="flex flex-col gap-1 w-full">
                    <div class="grid grid-cols-4 font-bold py-2">
                        <p class="text-center">
                            Heure
                        </p>
                        <p class="col-span-2 text-center">
                            Argents
                        </p>
                        <div class="col-span text-center">
                            Confirmation
                    </div>
                    </div>
                    {
                        profile.value.retraits.map((retrait, i) => <div key={i} 
                            class="grid grid-cols-4">
                            <p class="text-sm text-center">
                                { retrait.at.toLocaleTimeString(undefined, { 
                                    timeStyle: 'short' 
                                }) }
                            </p>
                            <p class="font-sobi text-xs col-span-2 text-center">
                                { retrait.agl } <span class=" text-pink">
                                    agl
                                </span>
                            </p>
                            <p class="text-sm text-center">
                                { retrait.complete ? 'confirmé' : 'en attente' }
                            </p>
                        </div>)
                    }
                </div>

                <hr class="my-4 border-white/25 rounded-md"/>
                <Link prefetch={false}
                    href={`/admin/transactions/${profile.value.pseudo}`}
                    class="font-black text-xl my-2
                    py-1.5 px-2 text-center hover:bg-white/50
                    bg-white/25 cursor-pointer select-none rounded-sm">
                    Transactions
                </Link>
            </>
        }
    </div>
})

export const head: DocumentHead = {
    frontmatter: {
        back_url: '/admin/comptes/'
    }
}