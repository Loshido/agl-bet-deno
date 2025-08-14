import { component$, type PropsOf } from "@builder.io/qwik";
import Icon from "~/assets/icon.png?jsx"

type Props = {
    nom: string,
    image: string | null
} & PropsOf<'div'>

export default component$(({ image, nom, ...props }: Props) => {
    return <div {...props} 
        class={["flex flex-col gap-1 items-center justify-center", props.class]}>
        {
            image 
            ? <img src={image} alt={nom}
                class="h-12 w-12 rounded-md" />
            : <Icon class="h-12 w-12 rounded-md"/>
        }
        
        <p class="font-sobi text-center">
            { nom }
        </p>
    </div>
})