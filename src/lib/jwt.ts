import type { EnvGetter } from "@builder.io/qwik-city/middleware/request-handler";
import { type JWTPayload, jwtVerify, SignJWT, decodeJwt } from "jose";
import env, { missingEnv } from "env";

export interface Payload {
    pseudo: string
}

const ALG = 'HS256';
const ISSUER = env('JWT_ISSUER', 'agl-bet-qwik')
const AUDIENCE = env('JWT_AUDIENCE', 'alg-bet-users');

export const verify = async (jwt: string, ctx: EnvGetter): Promise<null | Payload> => {
    const secret = ctx.get('JWT_SECRET')
    if(!secret) throw missingEnv('JWT_SECRET')

    const key = new TextEncoder().encode(secret)

    try {
        const { payload } = await jwtVerify<Payload>(jwt, key, {
            issuer: ISSUER,
            audience: AUDIENCE
        })
    
        return payload
    } catch {
        return null
    }
}

export const sign = async (payload: Payload & JWTPayload, ctx: EnvGetter): Promise<string | null> => {
    const secret = ctx.get('JWT_SECRET')
    if(!secret) throw missingEnv('JWT_SECRET')

    const key = new TextEncoder().encode(secret)

    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime('12h')
        .sign(key)

    return jwt
}

export const decode = (jwt: string) => {
    try {
        return decodeJwt<Payload>(jwt)
    } catch {
        return null
    }
}