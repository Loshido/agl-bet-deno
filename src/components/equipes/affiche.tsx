import { component$ } from "@builder.io/qwik";
import Equipe from "./equipe.tsx";
import { Link } from "@builder.io/qwik-city";
import Users from "~/assets/icons/users.svg?jsx"

interface Match {
    id: number,
    titre: string,
    informations: string,
    ouverture: Date,
    fermeture: Date,
    participants: number,
    agl: number,
    equipes: string[]
}

type Props = { match: Match }
export default component$(({ match }: Props) => {
    return <div class="w-full flex flex-col gap-1 bg-white/10 p-4 rounded-md relative">
        <h2 class="font-sobi text-2xl">
            { match.titre }
        </h2>
        <p class="text-white/75 text-wrap">
            { match.informations }
            <span class="text-white/75 text-xs italic"
                title="Période d'ouverture des paris"> - { 
                match.ouverture.toLocaleTimeString(undefined, {
                    timeStyle: 'short'
                }) } - { 
                match.fermeture.toLocaleTimeString(undefined, {
                    timeStyle: 'short'
                })
            }</span>
        </p>
        <div class="flex flex-row items-center justify-center py-4 overflow-x-auto gap-2">
            {
                match.equipes.map((equipe, i, a) => <>
                    <Equipe class="py-2" key={i}
                        nom={equipe}
                        image={null}/>
                    {
                        i + 1 !== a.length && <span class="font-sobi text-pink">
                            VS
                        </span>
                    }
                </>)
            }
        </div>
        <div class="flex flex-row items-center gap-2">
            <Users width={16} height={16} class="h-3 w-3"/>
            <p class="font-sobi text-lg">
                { match.participants }
            </p>

            <div class="h-5 w-0.5 mx-2 rounded-md bg-white/25"/>

            <p class="font-sobi text-lg">
                { match.agl }
                <span class="text-pink text-sm mx-2">
                    agl
                </span>
            </p>
        </div>
        <Link href={`/home/match/${match.id}`}
            class="absolute bottom-4 right-4 px-3 py-1.5 bg-pink rounded-md font-sobi">
            Parier
        </Link>
    </div>
})