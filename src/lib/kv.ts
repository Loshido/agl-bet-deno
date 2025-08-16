import env, { id as gen } from "env";

const KV = env('KV', 'none')

let kv: Deno.Kv | null
let latest_call = 0
export default async () => {
    latest_call = Date.now()
    const t = latest_call
    setTimeout(() => {
        if(latest_call === t && kv) {
            kv.close()
            kv = null;
            console.info('[kv] closed')
        }
    }, 10_000)
    
    if(kv) return kv
    
    console.info('[kv] opened')
    kv = await Deno.openKv(KV === 'none' ? undefined : KV)

    return kv
}

// 'admin', token (string) ->
export interface Admin {
    name: string,
    claimed: boolean
}

// 'user', actif (boolean), pseudo (string) ->
export interface User {
    pass: string,
    createdat: Date,
}

// 'agl', pseudo (string) -> number

// 'match', completed (boolean), id (string) ->
export interface Match {
    titre: string,
    informations: string,
    ouverture: Date,
    fermeture: Date,
    participants: number,
    agl: number,
    equipes: string[],
    gagnant?: string
}

// 'paris', pseudo (string), id (string) ->
export interface Paris {
    match: string,
    agl: number,    
    equipe: string,
    at: Date
}

// 'retrait', pseudo (string), id (string) ->
export interface Retrait {
    agl: number,
    at: Date,
    complete: boolean
}

// 'transaction', pseudo (string), id (string) ->
export interface Transaction {
    agl: number,
    raison: string,
    at: Date
}

type EventHandler = (pseudo: string, agl: number) => void
const handlers: Set<EventHandler> = new Set()

export class AGL {
    kv: Deno.Kv
    constructor(kv: Deno.Kv) {
        this.kv = kv
    }
    static addListener(handler: EventHandler) {
        const id = gen(4)
        handlers.add(handler)
        return id
    }
    static removeListener(handler: EventHandler) {
        handlers.delete(handler)
    }

    private async set(pseudo: string, agl: number) {
        await this.kv.set(['agl', pseudo], agl)
    }

    // negative values accepted
    async add(pseudo: string, agl: number, raison: string) {
        const from = await this.kv.get<number>(['agl', pseudo])
        if(!from.value) return false

        this.set(pseudo, from.value + agl)
        await this.kv.set(['transaction', pseudo, gen(10)], {
            agl,
            raison,
            at: new Date(),
        })
        
        // fire events
        handlers.forEach(h => h(pseudo, from.value + agl))
    }
}