import { component$ } from "@builder.io/qwik";
import { type DocumentHead, routeLoader$, useLocation } from "@builder.io/qwik-city";

import kv, { type Transaction } from "~/lib/kv.ts"
export const useTransaction = routeLoader$(async ctx => {
    const pseudo = ctx.params.pseudo;

    const db = await kv()

    const _transactions = db.list<Transaction>({
        prefix: ['transaction', pseudo]
    })
    
    const transactions: Transaction[] = []
    for await(const transaction of _transactions) {
        transactions.push(transaction.value)
    }

    transactions.sort((a, b) => a.at.getTime() - b.at.getTime())

    return transactions
})

export default component$(() => {
    const loc = useLocation()
    const transactions = useTransaction()
    return <>
        <h1 class="font-bold text-2xl my-4">
            Transactions de {loc.params.pseudo}
        </h1>
        {
            transactions.value.map((tr, i) => <div key={i}
                class="grid grid-cols-7 gap-1 items-center">
                <div class="text-center text-xs">
                    { tr.at.toLocaleTimeString(undefined, { timeStyle: 'short' }) }
                </div>
                <div class="font-sobi text-center text-xs col-span-2">
                    { tr.agl } <span class="text-pink text-xs">agl</span>
                </div>
                <div class="col-span-4">
                    { tr.raison }
                </div>
            </div>)
        }
    </>
})

export const head: DocumentHead = {
    frontmatter: {
        back_url: '/admin/transactions'
    }
}