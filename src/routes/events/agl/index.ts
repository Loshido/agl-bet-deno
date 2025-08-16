import { RequestHandler } from "@builder.io/qwik-city";
import { AGL } from "~/lib/kv.ts";
import { verify } from "~/lib/jwt.ts";
import isAdmin from "~/lib/admin.ts"

const streams: Set<WritableStreamDefaultWriter> = new Set()
AGL.addListener((pseudo, agl) => {
    const encoder = new TextEncoder()
    streams.forEach(s => {
        s.ready.then(() => {
            const data = JSON.stringify([pseudo, agl])
            s.write(encoder.encode(data))
        })
    })
})

export const onGet: RequestHandler = async req => {
    // checking if the user is authentificated
    const _admin = req.cookie.get('admin')
    const _user = req.cookie.get('token')
    
    const user = _user?.value && await verify(_user.value)
    const admin = _admin?.value && isAdmin(_admin.value)
    if(!user && !admin) {
        req.send(401, 'Unauthorized')
        return;
    }

    const writer = req.getWritableStream().getWriter()

    req.signal.addEventListener('abort', () => {
        streams.delete(writer)
        writer.close()
    })

    streams.add(writer)
}