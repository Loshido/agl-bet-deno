import { component$, useSignal } from "@builder.io/qwik";
import { type RequestHandler, useNavigate } from "@builder.io/qwik-city";
import Logo from "../assets/logo.png?jsx"

import { verify, hash } from "~/lib/hash.ts";
import { sign } from "~/lib/jwt.ts";
import kv, { type User } from "~/lib/kv.ts";
import { STARTING_AGL } from "env";

export const onPost: RequestHandler = async ctx => {
    const form = await ctx.parseBody()
    if(typeof form !== 'object' || 
        !form || 
        !('pseudo' in form && 'pass' in form) ||
        typeof form.pseudo != 'string' ||
        typeof form.pass != 'string') {
        ctx.send(400, 'Mauvaises entrées')
        return
    }
    
    if(form.pass.length < 4) {
        ctx.send(400, 'Mots de passe trop court!')
        return
    }
    if(form.pseudo.length < 4) {
        ctx.send(400, 'Pseudo trop court!')
        return
    }
    const pseudo = form.pseudo.toLowerCase()
    const db = await kv()

    const user = await db.get<User>(['user', true, pseudo])
    if(!user.value) {
        if(ctx.env.get('INSCRIPTION') === 'false') {
            ctx.send(400, "Les inscriptions ne sont plus ouvertes.")
            return
        }
        const computed_pass = await hash(form.pass);
        await db.set(['user', false, pseudo], {
            pass: computed_pass,
            createdat: new Date(),
            agl: STARTING_AGL
        })

        ctx.send(401, 'Compte en attente')
        return
    } else {
        if(await verify(form.pass, user.value.pass) === false) {
            ctx.send(400, "Erreur palpitante 👀")
            return 
        }
    }

    const jwt = await sign({ pseudo: pseudo })
    if(!jwt) {
        console.error("[jwt] Erreur lors de la signature d'un JWT.")
        ctx.send(400, "Erreur renversante 👀")
        return
    }

    ctx.cookie.set('token', jwt, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 12),
    });
    ctx.send(200, 'ok')
}

export default component$(() => {
    const message = useSignal('')
    const nav = useNavigate()

    return <section class="w-screen h-svh flex flex-col items-center justify-center gap-32">
        <Logo loading="lazy" decoding="async" fetchPriority="low"
            alt="logo" class="max-h-48 w-auto"/>

        <div class="flex flex-col gap-4 font-sobi *:outline-none">
            <input type="text" placeholder="Pseudo" name="pseudo"
                class="bg-white/25 placeholder:text-white/50 
                p-4 rounded-md text-xl" required />
            <input type="password" placeholder="Mots de passe"
                class="bg-white/25 placeholder:text-white/50 
                p-4 rounded-md text-xl" name="pass" min={4} required/>
            <input type="submit" value="Connexion / Inscription"
                class="bg-pink hover:bg-pink/75 text-white 
                p-4 rounded-md text-2xl cursor-pointer
                transition-colors" required
                onClick$={async () => {
                    const pseudo = document.querySelector('input[name="pseudo"]') as HTMLInputElement
                    const pass = document.querySelector('input[name="pass"]') as HTMLInputElement
                    if(pseudo.value.length <= 3 || pass.value.length <= 3) {
                        message.value = 'Veuillez remplir les entrées'
                        return
                    }
                    
                    const response = await fetch('/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            pseudo: pseudo.value,
                            pass: pass.value
                        })
                    })
                    switch(response.status) {
                        case 200:
                            await nav('/home/match?delete-cache')
                            return
                        case 401:
                            await nav('/inactif')
                            return
                        }
                    const msg = await response.text()
                    message.value = msg
                }} />

            <pre class="font-avenir font-light text-center">
                { message.value }
            </pre>
        </div>
    </section>
});

