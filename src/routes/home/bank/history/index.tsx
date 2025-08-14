import { component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

type TransactionProps = {
    agl: number,
    raison: string,
    date: Date
}
const Transaction = (transaction: TransactionProps) => <div 
    class="grid grid-cols-6 w-full h-auto p-1 sm:px-2 py-1 items-center">
    <div class="font-sobi text-2xl text-center col-span-2">
        { 
            transaction.agl > 0 
            ? <span class="text-pink">+{ transaction.agl }</span>
            : <span class="text-white">{ transaction.agl }</span> 
        }
    </div>
    <div class="text-xs font-bold text-center"
        title={transaction.date.toLocaleString()}>
        { 
            transaction.date.toLocaleTimeString(undefined, {
                timeStyle: 'short'
            }) 
        }
    </div>
    <div class="col-span-3">
        { transaction.raison }
    </div>
</div>

import pg from "~/lib/pg"
import type { SharedPayload } from "~/routes/home/layout";
export const useHistorique = routeLoader$(async ctx => {
    // derniere mise à jours
    const latest = ctx.cookie.get('transactions');
    const from = latest?.number() || 0

    const payload = ctx.sharedMap.get('payload') as SharedPayload
    if(Math.abs(from - Date.now()) < 1000) {
        return {
            agl: payload.agl,
            transactions: []
        }
    }
    
    const client = await pg()
    
    const response = await client.query<{ id: number, agl: number, raison: string, at: Date}>(
        `SELECT id, agl, raison, at FROM transactions
        WHERE pseudo = $1 AND at >= $2
        ORDER BY at DESC`,
        [
            payload.pseudo,
            new Date(from)
        ]
    )

    client.release()
    if(!response.rowCount) return {
        agl: payload.agl,
        transactions: []
    }

    ctx.cookie.set('transactions', Date.now(), {
        path: '/home/bank/history',
        domain: cookie.domain,
        secure: cookie.secure,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 4)
    })
    return {
        agl: payload.agl,
        transactions: response.rows,
    }
})

import Back from "~/assets/icons/back.svg?jsx"
import cookie from "~/lib/cookie";
export default component$(() => {    
    const payload = useHistorique()
    const transactions = useStore<{
        id: number, agl: number, raison: string, at: Date
    }[]>([])

    useVisibleTask$(() => {
        const cached = localStorage.getItem('transactions');
        if(cached) {
            const parsed = JSON.parse(cached) as {
                id: number, agl: number, raison: string, at: string
            }[]
            
            transactions.push(...parsed.map(tr => ({
                ...tr,
                at: new Date(tr.at)
            })))
        }
        
        if(payload.value.transactions.length == 0) return
        for(const transaction of payload.value.transactions) {
            if(transactions.find(tr => tr.id === transaction.id)) {
                continue;
            }
            transactions.push(transaction)
        }
        transactions.sort((a, b) => b.at.getTime() - a.at.getTime())

        localStorage.setItem('transactions', 
            JSON.stringify(transactions)
        )
    })

    return <section class="flex flex-col gap-4 p-2 md:px-80">
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
            Historique des transactions
        </h1>
        <section class="flex flex-col w-full">
            {
                transactions.map(tr => <Transaction
                    key={tr.id}
                    agl={tr.agl}
                    raison={tr.raison}
                    date={tr.at}/>)
            }
        </section>
    </section>
})