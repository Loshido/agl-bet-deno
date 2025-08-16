import { component$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import Button from "~/components/admin/button.tsx";

import kv, { User } from "~/lib/kv.ts";
import { STARTING_AGL } from "env";

export const usePending = routeLoader$(async () => {
    const db = await kv()

    const _users = db.list<User>({
        prefix: ['user', false]
    })
    const users: (User & { pseudo: string })[] = []
    for await(const user of _users) {
        users.push({
            ...user.value,
            pseudo: user.key.at(2) as string
        })
    }

    return users
})

export const actionUtilisateur = server$(async (pseudo: string, action: 'accepter' | 'refuser') => {
    const db = await kv()
    const user = await db.get(['user', false, pseudo])
    if(!user.value) {
        return
    }
    await db.delete(['user', false, pseudo])

    if(action === 'accepter') {
        await db.set(['user', true, pseudo], user.value)
        await db.set(['agl', pseudo], STARTING_AGL)
    }
})

export default component$(() => {
    const users = usePending()
    return <>
        {
            users.value.map((user, i) => <div
                key={i}
                class="grid grid-cols-4 gap-2 *:transition-colors">
                <p class="col-span-2 overflow-ellipsis font-medium">
                    { user.pseudo }
                    <span class="mx-2 font-light text-xs">
                        {
                            user.createdat.toLocaleTimeString(undefined, {
                                timeStyle: 'short'
                            })
                        }
                    </span>
                </p>     
                <Button onClick$={async () => {
                    await actionUtilisateur(user.pseudo, 'accepter');
                    users.value.splice(i, 1)
                } }>
                    Accepter
                </Button>           
                <Button onClick$={async () => {
                    await actionUtilisateur(user.pseudo, 'refuser')
                    users.value.splice(i, 1)
                }}>
                    Refuser
                </Button>           
           </div>)
        }
    </>
})