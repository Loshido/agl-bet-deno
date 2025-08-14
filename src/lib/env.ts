export default <T = string>(env: string, or?: T): string | T => {
    const e = Deno.env.get(env)
    if(e) return e
    if(!or) throw new Error(`${env} is missing; not default`)

    console.warn(`${env} is missing; passing default (${or})`)
    return or
}

export const missingEnv = (env: string) => new Error(`${env} is missing; not default`)

export const STARTING_AGL = 10000
export function id(length: number = 8): string {
    const decimal: number = Math.random() ** Math.random();
    const base64: string = decimal.toString(36).slice(2); // 0.*****
    if(length > 8) 
        return id(length - 8) + base64.padStart(length - 8, '0').slice(0, length - 8)

    return base64.padStart(length, '0').slice(0, length);
}