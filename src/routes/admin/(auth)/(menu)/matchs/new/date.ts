const prefill = (t: Date) => {
    const date = t.toLocaleDateString(undefined, {
        dateStyle: 'short'
    })
    const time = t.toLocaleString(undefined, {
        timeStyle: 'short'
    })

    return date.slice(0, 5) + ' ' + time
}

export const prefilled = () => {
    const ouverture = new Date(Date.now() + 1000 * 60 * 5) 
    const fermeture = new Date(Date.now() + 1000 * 60 * 35) 
    return {
        ouverture: prefill(ouverture),
        fermeture: prefill(fermeture)
    }
}

export default (datetime: string): string | Date => {
    const [date, time] = datetime.split(' ')
    if(date.length !== 5 || time.length !== 5) {
        return "⚠️ Mauvais formatage"
    }
    
    const [jour, mois] = date.split('/') 
    if(jour.length !== 2 || mois.length !== 2) {
        return "⚠️ Mauvais formatage de la date"
    }
    const [heure, minutes] = time.split(':') 
    if(heure.length !== 2 || minutes.length !== 2) {
        return "⚠️ Mauvais formatage de l'heure"
    }

    const int = {
        jour: parseInt(jour),
        mois: parseInt(mois),
        heure: parseInt(heure),
        minutes: parseInt(minutes)
    }  
    if(int.jour <= 0 || int.jour > 31) return "⚠️ Mauvais formatage du jour"
    if(int.mois <= 0 || int.mois > 12) return "⚠️ Mauvais formatage du mois" 
    if(int.heure < 0 || int.heure > 23) return "⚠️ Mauvais formatage de l'heure" 
    if(int.minutes < 0 || int.minutes >= 60) return "⚠️ Mauvais formatage des minutes" 

    const now = new Date()
    return new Date(
        now.getFullYear(),
        int.mois - 1,
        int.jour,
        int.heure,
        int.minutes,
        0,
        0
    )
}