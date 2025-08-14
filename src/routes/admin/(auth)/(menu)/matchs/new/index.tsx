import { component$, useSignal, useStore } from "@builder.io/qwik";
import Icon from "~/assets/icon.png?jsx"
import parseDate, { prefilled } from "./date.ts"
import { type DocumentHead, server$, useNavigate } from "@builder.io/qwik-city";
import { id } from "env";

interface Match {
    titre: string,
    informations: string,
    ouverture: Date | null,
    fermeture: Date | null,
    equipes: string[]
}

import kv from "~/lib/kv.ts"
export const createMatch = server$(async (match: Match): Promise<string> => {
    if(match.titre.length === 0) 
        return "Le titre n'est pas défini"
    if(match.informations.length === 0) 
        return "La description n'est pas défini"
    if(match.fermeture === null) 
        return "La fermeture n'est pas défini"
    if(match.ouverture === null) 
        return "L'ouverture n'est pas défini"
    if(match.equipes.length < 2)
        return "Il n'y a pas assez d'équipes"
    if(match.equipes.some(eq => eq.length === 0))
        return "Une ou plusieurs équipes ne sont pas défini correctement"

    const db = await kv()

    await db.set(['match', false, id()], {
        titre: match.titre,
        informations: match.informations,
        ouverture: match.ouverture,
        fermeture: match.fermeture,
        participants: 0,
        agl: 0,
        equipes: match.equipes,
    })

    return 'ok'
})

export default component$(() => {
    const nav = useNavigate()
    const erreurs = useSignal('')
    const match = useStore<Match>({
        titre: '',
        informations: '',
        ouverture: null,
        fermeture: null,
        equipes: []
    })
    const { ouverture, fermeture } = prefilled()

    return <section class="w-full md:w-fit flex flex-col gap-1 
        bg-white/10 p-4 rounded-md relative
        md:mx-auto md:min-w-2xl">
        <h2 class={["font-sobi text-3xl outline-none",
            match.titre.length === 0 && 'text-pink animate-pulse']} 
            contentEditable="true"
            onInput$={(_, t) => match.titre = t.innerText}>
            Titre du match
        </h2>
        <div class="flex flex-col gap-2" >
            <span contentEditable="true" 
                onInput$={(_, t) => match.informations = t.innerText}
                class={["outline-none",
                match.informations.length === 0 && 'text-pink animate-pulse']}>
                Une description suffisament explicite
            </span>
            <div class="w-full grid grid-cols-2 py-2 text-xl
                justify-items-center items-center text-center justify-center">
                <div class="flex flex-col items-center gap-1">
                    <span class="text-sm text-center">
                        Ouverture
                    </span>
                    <input type="text" 
                        placeholder="JJ/MM HH:MM"
                        value={ouverture}
                        onInput$={(_, t) => {
                            const d = parseDate(t.value)
                            if(typeof d === 'string') {
                                erreurs.value = d
                            } else {
                                match.ouverture = d
                                erreurs.value = ''
                            }
                        }}
                        class={[
                        !match.ouverture && 'animate-pulse text-pink',
                        "font-avenir font-medium w-48 text-center outline-none"
                    ]} />
                </div>
                <div class="flex flex-col items-center gap-1">
                    <span class="text-sm text-center">
                        Fermeture
                    </span>
                    <input type="text" 
                        placeholder="JJ/MM HH:MM"
                        value={fermeture}
                        onInput$={(_, t) => {
                            const d = parseDate(t.value)
                            if(typeof d === 'string') {
                                erreurs.value = d
                            } else {
                                match.fermeture = d
                                erreurs.value = ''
                            }
                        }}
                        class={[
                        !match.fermeture && 'animate-pulse text-pink',
                        "font-avenir font-medium w-48 text-center outline-none"
                    ]} />
                </div>
            </div>
        </div>

        <div class="flex flex-row items-center py-4 overflow-x-auto gap-2">
            {
                match.equipes.map((equipe, i, a) => <div 
                    key={i}
                    class="flex flex-row items-center gap-2">
                    <div 
                        class="py-2 flex flex-col gap-1 
                            items-center justify-center">
                        <Icon class="h-12 w-12 rounded-md"/>
                        <p class={["font-sobi text-center outline-none",
                            equipe === '' && 'animate-pulse text-pink']}
                            contentEditable="true"
                            onInput$={(_, t) => {
                            match.equipes[i] = t.innerText
                        }}>Equipe</p>
                    </div>
                    {
                        i + 1 !== a.length && <span class="font-sobi text-pink">
                            VS
                        </span>
                    }
                </div>)
            }
            <div class={["py-2 flex flex-col gap-1 ml-4",
                "items-center justify-center group",
                "cursor-pointer select-none",
                match.equipes.length < 2 && 'animate-pulse text-pink']}
                onClick$={() => match.equipes.push('')}>
                <div class="h-12 w-12 bg-white/25 text-white flex items-center 
                    justify-center font-bold rounded-md  group-hover:bg-white/50 transition-colors">
                    +
                </div>
                <p class="font-sobi text-center">
                    Nouvelle équipe
                </p>
            </div>
            
        </div>
        <div class="flex flex-row items-center gap-2">

            <button class="px-2 py-1 sm:px-3 rounded-md flex flex-row items-center gap-2
                transition-colors w-fit font-avenir
                disabled:bg-white/25 disabled:cursor-not-allowed disabled:text-white/50
                hover:bg-pink/75 bg-pink/50 cursor-pointer"
                disabled={
                    match.equipes.length < 2 || 
                    !match.fermeture || !match.ouverture || 
                    match.equipes.some(eq => eq.length === 0) ||
                    match.titre.length == 0 || match.informations.length== 0
                }
                onClick$={async (_, t) => {
                    if(!t.disabled) {
                        const response = await createMatch(match);
                        if(response === 'ok') {
                            await nav('/admin/matchs')
                        } else {
                            erreurs.value = response
                        }
                    }
                }}>
                Créer le match
            </button>
            <div class="px-2 py-1">
                { erreurs.value }
            </div>
        </div>
    </section>
})

export const head: DocumentHead = {
    frontmatter: {
        back_url: '/admin/matchs'
    }
}