import { type RequestHandler } from "@builder.io/qwik-city/middleware/request-handler";
import isAdmin from "~/lib/admin.ts";

export const onRequest: RequestHandler = ctx => {
    const cookie = ctx.cookie.get('admin')
    if(cookie?.value) {
        const admin = isAdmin(cookie.value)
        if(admin) {
            ctx.sharedMap.set('identity', admin)
            return ctx.next();
        }
    }
    throw ctx.error(401, "Unauthorized")
}