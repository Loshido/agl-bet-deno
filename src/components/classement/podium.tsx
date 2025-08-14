import { component$ } from "@builder.io/qwik";

type Player = {
    pseudo: string,
    agl: number
}

interface Podium {
    players: [Player, Player, Player]
}

import Podium from "~/assets/classement/podium.svg?jsx"
import Spotlight from "~/assets/classement/spotlight.svg?jsx"
export default component$(({ players }: Podium) => {
    return <div class="grid grid-cols-3 grid-rows-8 relative isolate
        h-[160px] md:h-[320px] w-[300px] md:w-[600px]">
        <div class="row-span-3 col-start-1 col-end-2 row-end-6
            flex items-center justify-center flex-col gap-2">
            <h3 class="font-sobi text-xs md:text-xl text-center">
                { players[1].pseudo }
            </h3>
            <p class="font-sobi text-xs md:text-base">
                { players[1].agl }
                <span class="md:text-sm text-pink"> agl</span>
            </p>
        </div>
        <div class="row-span-3 col-start-2 col-end-3 row-end-4
            flex items-center justify-center flex-col gap-2">
            <h3 class="font-sobi text-xs md:text-xl text-center">
                { players[0].pseudo }
            </h3>
            <p class="font-sobi text-xs md:text-base">
                { players[0].agl }
                <span class="md:text-sm text-pink"> agl</span>
            </p>
        </div>
        <div class="row-span-3 col-start-3 -col-end-1 row-end-7
            flex items-center justify-center flex-col gap-2">
            <h3 class="font-sobi text-xs md:text-xl text-center">
                { players[2].pseudo }
            </h3>
            <p class="font-sobi text-xs md:text-base">
                { players[2].agl }
                <span class="text-xs md:text-sm text-pink"> agl</span>
            </p>
        </div>
        <Podium class={["absolute bottom-0 left-0 -z-10", 
            "h-[100px] md:h-[200px] w-[300px] md:w-[600px]"]}/>
        <Spotlight class="absolute -z-20 blur-xl
            bottom-0 left-[-50px] w-[400px] h-[200px]
            md:left-[-100px] md:w-[800px] md:h-[400px]"/>
        <Spotlight class="absolute -scale-x-100 -z-20 blur-xl
            bottom-0 right-[-50px] w-[400px] h-[200px]
            md:right-[-100px] md:w-[800px] md:h-[400px]"/>
    </div>
})