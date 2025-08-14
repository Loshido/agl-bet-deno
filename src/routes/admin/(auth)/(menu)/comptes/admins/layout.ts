import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = ctx => {
    const identity =  ctx.sharedMap.get('identity') as undefined | 'root' | string
    if(identity !== 'root') {
        throw ctx.error(403, 'Forbidden')
    }
}