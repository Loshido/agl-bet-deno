import type { EnvGetter } from "@builder.io/qwik-city/middleware/request-handler";
import { type JWTPayload, jwtVerify, SignJWT, decodeJwt } from "jose";
import env, { missingEnv } from "env";

export interface Payload {
    pseudo: string
}

const ALG = 'HS256';
const ISSUER = env('JWT_ISSUER', 'agl-bet-qwik')
const AUDIENCE = env('JWT_AUDIENCE', 'alg-bet-users');

export const verify = async (jwt: string): Promise<null | Payload> => {
    const secret = env('JWT_SECRET')
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

export const sign = async (payload: Payload & JWTPayload): Promise<string | null> => {
    const secret = env('JWT_SECRET')
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

export const headerToCookie = (_cookies: string): { [cookie: string]: string } => {
    const cookies: { [cookie: string]: string } = {}

    _cookies.split('; ').forEach(c => {
        const [name, value] = c.split('=')
        cookies[name] = value
    })
    return cookies
}