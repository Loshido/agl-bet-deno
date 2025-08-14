import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
    return <section class="h-screen w-screen flex flex-col gap-4 items-center justify-center">
        <h2 class="font-sobi text-3xl relative">
            <span class="text-5xl font-sobi text-pink/25
                absolute bottom-3/5 -z-10 left-1/3">
                404
            </span>
            Page introuvable!
        </h2>
        <Link class="text-pink hover:text-pink/75 
            font-medium transition-colors" 
            href="/">Revenir à la page de connexion</Link>
    </section>
})