import { component$, type PropsOf, Slot } from "@builder.io/qwik";

interface Props extends PropsOf<'div'> {}

export default component$((props: Props) => {
    return <div {...props} class={["py-1.5 px-2 font-bold text-center hover:bg-white/50",
        "bg-white/25 cursor-pointer select-none rounded-sm", props.class]}>
        <Slot/>
    </div>
})