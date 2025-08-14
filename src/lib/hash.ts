import { verify as _verify, hash as _hash } from "argon2"
import env from "env"

const secret = env('HASH_SECRET')
const key = new TextEncoder().encode(secret)

export const hash = (pass: string): Promise<string> => _hash(pass, { secret: key })
export const verify = (pass: string, hash: string): Promise<boolean> => _verify(hash, pass, key)