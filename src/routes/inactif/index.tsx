import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
    return <section class="h-screen w-screen flex flex-col gap-4 items-center justify-center">
        <h2 class="font-sobi text-2xl relative max-w-4/5 text-center">
            Ton profil est en cours de validation ⌛️
        </h2>
        <p>
            Essaye de te faire répérer par les organisateurs
        </p>
        <Link class="text-pink hover:text-pink/75 
            font-medium transition-colors" 
            href="/">Revenir à la page de connexion</Link>
    </section>
})