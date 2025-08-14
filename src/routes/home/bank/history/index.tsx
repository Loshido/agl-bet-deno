import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

const TransactionRow = (transaction: Transaction) => <div 
    class="grid grid-cols-6 w-full h-auto p-1 sm:px-2 py-1 items-center">
    <div class="font-sobi text-2xl text-center col-span-2">
        { 
            transaction.agl > 0 
            ? <span class="text-pink">+{ transaction.agl }</span>
            : <span class="text-white">{ transaction.agl }</span> 
        }
    </div>
    <div class="text-xs font-bold text-center"
        title={transaction.at.toLocaleString()}>
        { 
            transaction.at.toLocaleTimeString(undefined, {
                timeStyle: 'short'
            }) 
        }
    </div>
    <div class="col-span-3">
        { transaction.raison }
    </div>
</div>

import type { SharedPayload } from "~/routes/home/layout.tsx";
import kv, { Transaction } from "~/lib/kv.ts";
export const useHistorique = routeLoader$(async ctx => {
    const payload = ctx.sharedMap.get('payload') as SharedPayload
    const db = await kv()
    
    const _transactions = db.list<Transaction>({
        prefix: ['transaction', payload.pseudo]
    }) 
    const transactions: Transaction[] = []
    for await (const tr of _transactions) {
        transactions.push(tr.value)
        if(!tr.value.at) console.info(tr.value, tr.key)
    }
    transactions.sort((a, b) => b.at.getTime() - a.at.getTime())

    return {
        agl: payload.agl,
        transactions,
    }
})

import Back from "~/assets/icons/back.svg?jsx"
export default component$(() => {    
    const payload = useHistorique()

    return <section class="flex flex-col gap-4 p-2 md:px-80">
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
            Historique des transactions
        </h1>
        <section class="flex flex-col w-full">
            {
                payload.value.transactions.map((tr,i) => <TransactionRow
                    key={i}
                    agl={tr.agl}
                    raison={tr.raison}
                    at={tr.at}/>)
            }
        </section>
    </section>
})