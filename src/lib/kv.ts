import env from "env";

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

// 'admin', token (string)
export interface Admin {
    name: string,
    claimed: boolean
}

// 'user', actif (boolean), pseudo (string)
export interface User {
    pass: string,
    createdat: Date,
    agl: number,
}

// 'match', completed (boolean), id (string)
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

// 'paris', pseudo (string), id (string), match (string)
export interface Paris {
    agl: number,
    team: string,
    at: Date
}

// 'retrait', pseudo (string), id (string)
export interface Retrait {
    agl: number,
    at: Date,
    complete: boolean
}

// 'transaction', pseudo (string), id (string)
export interface Transaction {
    agl: number,
    raison: string,
    at: Date
}