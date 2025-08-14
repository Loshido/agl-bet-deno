import type { PropsOf } from "@builder.io/qwik";
import Equipe from "~/components/equipes/equipe.tsx";

type Props = {
    equipe: string,
    image: string | null,
    cote: number
} & PropsOf<'div'>
export default ({ equipe, image, cote, ...props }: Props) => <div 
    { ...props }
    class={["h-full w-full rounded-md min-h-48 max-h-64",
    "flex flex-col gap-2 items-center justify-center text-2xl font-sobi",
    "select-none hover:bg-white/15 transition-colors",
    props.class]}>
    <Equipe nom={ equipe } image={image}/>
    <div class="flex flex-row items-center gap-3 font-avenir font-light text-sm">
        {
            cote > 0 && <p class="text-pink">
            { cote }
            </p>
        }
    </div>
</div>