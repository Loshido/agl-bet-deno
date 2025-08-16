// Ecoute en temps réels les évènements du server
export const listen = async <T extends (number | string)[]>(path: `/events/${string}`, callback: (payload: T) => Promise<void> | void) => {
    const response = await fetch(path, {
        credentials: 'same-origin'
    })
    if(!response.body) {
        console.error(`Impossible d'écouter ${path}`)
        return
    }
    const decoder = new TextDecoder()
    for await (const chunk of response.body) {
        const data = decoder.decode(chunk)
        await callback(JSON.parse(data) as T)
    }
}