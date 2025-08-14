import { component$,type PropsOf, type QRL, Slot } from "@builder.io/qwik";

interface Props extends PropsOf<'dialog'> {
    open: boolean,
    exit: QRL
}

export default component$(({ open, exit, ...props }: Props) => {
    return <dialog {...props}
        onClick$={async (e, t) => {
            if(e.target === t) await exit()
        }}
        class={[
            "top-0 left-0 absolute h-svh w-svw bg-white/10 backdrop-blur-md gap-2 items-center justify-center",
            open ? 'flex' : 'hidden', props.class
        ]}>
        <Slot/>
    </dialog>
})