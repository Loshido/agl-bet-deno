import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import kv, { type User } from "~/lib/kv.ts";

export const useTransactions = routeLoader$(async () => {
    const db = await kv()
    
    const _users = db.list<User>({
        prefix: ['user', true]
    })

    const users = []
    for await(const user of _users) {
        users.push(user.key.at(2) as string)
    }

    return users
})

export default component$(() => {
    const transactions = useTransactions()
    return <>
        <h1 class="font-bold text-2xl my-4">
            Transactions des utilisateurs
        </h1>
        <section class="flex flex-col gap-1">
        {
            transactions.value.map(tr => <Link
                key={tr}
                class="py-1.5 px-2 font-bold text-center hover:bg-white/50
                bg-white/25 cursor-pointer select-none rounded-sm"
                href={`/admin/transactions/${ tr }`}>
                {tr}
            </Link>)
        }
        </section>
    </>
})