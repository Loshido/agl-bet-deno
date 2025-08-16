import env from "env";
import kv, { type Admin } from "~/lib/kv.ts";

// Cookie qui donne accès à la partie administration de la plateforme
export const admin = env('ROOT_TOKEN')

// Clé = Jeton, Valeur = Nom de l'organisateur
export const tokens = new Map<string, { name: string, claimed: boolean }>()
export const root_token = admin
console.log(`[admin] root:token \`${root_token}\``);

const db = await kv()
const admins = db.list<Admin>({
    prefix: ['admin']
})

for await (const admin of admins) {
    tokens.set(admin.key.at(1) as string, admin.value)
}

export const sauvegarderAdministrateurs = async () => {
    const db = await kv()
    if(tokens.size === 0) {
        await db.delete(['admin'])
        return
    }

    tokens.forEach(async (value, token) => {
        await db.set(['admin', token], value)
    })
}

export default (token: string): 'root' | string | null => {
    if(token === admin) {
        return 'root'
    }
    if(tokens.has(token)) {
        return tokens.get(token)!.name
    }
    return null
}