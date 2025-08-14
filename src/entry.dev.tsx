import { render, type RenderOptions } from "@builder.io/qwik";
import Root from "./root.tsx";

export default function (opts: RenderOptions) {
    return render(document, <Root />, opts);
}
