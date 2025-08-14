import { $, component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import Dialog from "~/components/Dialog.tsx";

import { tokens, sauvegarderAdministrateurs } from "~/routes/admin/auth.ts";
import webhook from "./webhook.ts";
import { id } from "env";

export const useAdminAccounts = routeLoader$(() => {
    const users: [string, string, boolean][] = [];
    tokens.forEach((meta, token) => {
        users.push([token, meta.name, meta.claimed]);
    })

    return users
})

export const supprimer = server$(async (token: string) => {
    tokens.delete(token)
    await sauvegarderAdministrateurs()
})

export const nouveau = server$(async (nom: string) => {
    const token = id(32)

    tokens.set(token, {
        name: nom,
        claimed: false
    })
    await webhook(token, nom)
    await sauvegarderAdministrateurs()
})

export default component$(() => {
    const users = useAdminAccounts()
    const dialog = useSignal(false)
    return <>
        {
            users.value.map((user, i) => <div key={i}
                class="flex flex-row items-center px-2 gap-2">
                <p title={user[2] ? 'Ce jeton a déjà été réclamé' : 'Ce jeton est en attente'}>
                    <span class="font-bold mx-2"> {user[1]} </span>
                </p>
                <div class="px-2 py-1 bg-white/25 hover:bg-white/50 transition-colors rounded-sm
                    cursor-pointer select-none"
                    onClick$={async () => {
                        const confirmation = prompt('Entrez `oui` pour supprimer le jeton')
                        if(confirmation === 'oui') {
                            await supprimer(user[0])
                        }
                    }}>
                    Supprimer
                </div>
            </div>)
        }
        <div class="px-2 py-1 bg-white/25 hover:bg-white/50 transition-colors rounded-sm
            cursor-pointer select-none w-fit"
            onClick$={() => dialog.value = true}>
            Nouveau jeton
        </div>
        <Dialog exit={$(() => dialog.value = false)} open={dialog.value}>
            <input type="text" name="staff" 
                class="bg-white/25 px-4 py-2 font-sobi text-xl outline-none rounded-md text-white"
                placeholder="Nom du staff"
                onKeyDown$={async (e, t) => {
                    if(e.key === 'Enter') {
                        if(t.value.length === 0) {
                            return;
                        }
                        dialog.value = false
                        await nouveau(t.value)
                        t.value = ''
                    }
                }} />
        </Dialog>
    </>
}) 