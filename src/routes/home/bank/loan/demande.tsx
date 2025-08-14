import { component$, useSignal, useComputed$, type Signal } from "@builder.io/qwik";

import type { SharedPayload } from "~/routes/home/layout";
import { useCredit } from ".";

type Props = {
    payload: Signal<SharedPayload>
}
export default component$(({ payload }: Props) => {
    const credit = useCredit()  
    const apport = useSignal(0);
    const interets = useComputed$(() => {
        if(apport.value < 100) return 0
        return 0.8 * Math.exp(0.0366 * Math.log(apport.value * 3)) - 1
    })

    return <>
        <h1 class="px-4 sm:px-8 text-2xl font-bold">
            Faire un prêt à la banque
        </h1>
        <p class="px-4 sm:px-8">
            Le crédit maximum s'élève à 3 fois la somme d'apport 
            et vous devrez rembourser un pourcentage calculé par rapport à la somme donné.
        </p>
        <p class="px-4 sm:px-8">
            ⚠️ Vous pouvez prendre 1 unique crédit à la fois et devra être validé par un staff.
            L'apport sera prélevé en l'attente de validation du prêt. 
            L'apport vous sera reversé si le prêt est refusé.
        </p>

        <input type="number" 
            class="mx-4 px-4 sm:px-8 py-4 bg-white/25 rounded-md
            font-sobi text-xl outline-none" max={payload.value.agl} min={100}
            onInput$={(_, t) => apport.value = parseInt(t.value)}
            placeholder={`Apport (${payload.value.agl} max)`} />

        <div class="py-2 border rounded-md mx-4 px-4 text-xl">
            <h3 class="text-2xl font-avenir font-medium">
                Simulation du crédit
            </h3>

            <p>
                Crédit accordé <span class="font-bold">
                    {
                        apport.value >= 100 && apport.value <= 200000 ? apport.value * 3 : 0
                    }
                    <span class="font-sobi text-xs text-pink"> agl</span>
                </span>
            </p>
            <p>
                Intérêts <span class="font-bold">
                    {Math.round(interets.value * 100)}% ({
                        Math.round(interets.value * apport.value * 3)
                    } <span class="font-sobi text-xs text-pink"> agl</span>)
                </span>
            </p>
            <p>
                Somme dû <span class="font-bold">
                    {Math.floor((1 + interets.value) * apport.value * 3)}
                    <span class="font-sobi text-xs text-pink"> agl</span>
                </span>
            </p>
        </div>
                
        <input type="submit" value="Prendre le prêt" 
            class="mx-4 px-4 sm:px-8 py-4 bg-pink rounded-md hover:bg-pink/75
            font-sobi text-xl cursor-pointer"
            onClick$={async () => {
                const response = await credit.submit({
                    apport: apport.value
                })
                if(response.value.status) {
                    payload.value.credit = 'en attente'
                }
            }}/>

        <p class="mx-4">
            {
                credit.submitted && credit.value && typeof credit.value.message === 'string'
                && credit.value.message
            }
        </p>
    </>
})