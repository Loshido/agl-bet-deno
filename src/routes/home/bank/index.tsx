import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { usePayload } from "../layout.tsx";

import Back from "~/assets/icons/back.svg?jsx"
import Send from "~/assets/icons/send.svg?jsx"
import History from "~/assets/icons/history.svg?jsx"
import Withdraw from "~/assets/icons/withdraw.svg?jsx"
import Logout from "~/assets/icons/logout.svg?jsx"
export default component$(() => {    
    const payload = usePayload()

    return <section class="flex flex-col gap-4 p-2 lg:px-80">
        <header class="w-full flex flex-row items-center justify-center p-4 relative">
            <Link class="p-2 rounded-md flex flex-row items-center gap-2 
                bg-white/25 hover:bg-white/50
                absolute left-4"
                href="/home/match" prefetch={false}>
                <Back/>
            </Link>
            <h2 class="font-sobi text-white text-4xl">
                { payload.value.agl } <span class="text-sm text-pink">agl</span>
            </h2>
        </header>
        <nav class="w-full h-full flex flex-col justify-between select-none">
            <div class="flex flex-col gap-2">
                <Link class="font-sobi text-3xl p-4 hover:bg-white/10 rounded-md
                    hover:text-pink text-white group
                    transition-colors duration-500
                    flex flex-row items-center gap-2"
                    href="/home/bank/send" prefetch={false}>
                    <Send class="w-10 h-10 *:stroke-3 *:duration-500 *:transition-colors
                        *:stroke-white group-hover:*:stroke-pink"/>
                    Envoyer de l'argent
                </Link>
                <Link class="font-sobi text-3xl p-4 hover:bg-white/10 rounded-md
                    hover:text-pink text-white group
                    transition-colors duration-500
                    flex flex-row items-center gap-2"
                    href="/home/bank/withdraw" prefetch={false}>
                    <Withdraw class="w-10 h-10 *:stroke-3 *:duration-500 *:transition-colors
                        *:stroke-white group-hover:*:stroke-pink"/>
                    Retirer de l'argent
                </Link>
                <Link class="font-sobi text-3xl p-4 hover:bg-white/10 rounded-md
                    hover:text-pink text-white group
                    transition-colors duration-500
                    flex flex-row items-center gap-2"
                    href="/home/bank/history" prefetch={false}>
                    <History class="w-10 h-10 *:stroke-3 *:duration-500 *:transition-colors
                        *:stroke-white group-hover:*:stroke-pink"/>
                    Historique
                </Link>
            </div>
            <div class="flex flex-col gap-2">
                <Link class="font-sobi text-3xl p-4 hover:bg-white/10 rounded-md
                    hover:text-pink text-white group
                    transition-colors duration-500
                    flex flex-row items-center gap-2"
                    href="/home/logout" prefetch={false}>
                    <Logout class="w-10 h-10 *:stroke-3 *:duration-500 *:transition-colors
                        *:stroke-white group-hover:*:stroke-pink"/>
                    Déconnexion
                </Link>
            </div>
        </nav>
    </section>
})