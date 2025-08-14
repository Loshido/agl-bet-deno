import { type RequestHandler } from "@builder.io/qwik-city/middleware/request-handler";
import { root_token, tokens } from "../auth.ts";

export const onRequest: RequestHandler = ctx => {
    const cookie = ctx.cookie.get('admin')
    const root = cookie && cookie.value === root_token
    const authorized = cookie && tokens.has(cookie.value)
    if(!cookie || !(root || authorized)) {
        throw ctx.error(401, "Unauthorized")
    }

    if(root) ctx.sharedMap.set('identity', 'root')
    if(authorized) {
        const name = tokens.get(cookie.value)!.name
        ctx.sharedMap.set('identity', name)
    }
}