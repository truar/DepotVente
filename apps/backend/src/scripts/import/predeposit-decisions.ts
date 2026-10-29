// Arbitrages des doublons du Google Form « Pré-enregistrement bourse au ski »,
// codés ici plutôt que passés en ligne de commande.
//
// Une réponse est repérée par son horodatage : la colonne Timestamp de
// l'export, telle quelle (M/D/YYYY H:MM:SS, format américain de Google
// Sheets ; la simulation l'affiche pour chaque doublon). Il ne bouge pas
// quand une ligne est ajoutée ou supprimée dans le Sheet, et ne désigne
// personne pour qui n'a pas le Sheet. Le dépôt est public : jamais de nom, de
// téléphone ni d'email ici.
//
// Ces listes valent pour un formulaire : un horodatage absent de l'export
// arrête l'import, donc celles de l'an passé se vident avant d'importer le
// suivant.
import type { Response } from './predeposit-duplicates'

export interface Decisions {
  // Réponses ignorées : un formulaire renvoyé avec la liste à jour, par exemple.
  skip: string[]
  // Réponses gardées comme fiches distinctes malgré le doublon signalé.
  keep: string[]
  // Réponses fusionnées en une fiche : articles à la suite, dans l'ordre des
  // réponses ; coordonnées de la plus récente.
  merge: string[][]
}

export const DECISIONS: Decisions = {
  skip: [
    // Renvoyée le 10/27/2026 15:24:01 avec la liste à jour, qui est gardée.
    '10/20/2026 9:20:08',
  ],
  keep: [],
  merge: [],
}

// « 10/15/2025 17:49:47 » : format américain M/D/YYYY de Google Sheets.
export function parseTimestamp(value: string): Date | undefined {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return undefined
  const [, month, day, year, hours, minutes, seconds] = match.map(Number)
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

// L'horodatage tel que l'export l'écrit, à recopier dans DECISIONS.
export function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ` +
    `${date.getHours()}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export interface Resolved {
  skips: Set<number>
  keeps: Set<number>
  merges: number[][]
  errors: string[]
}

// Traduit les horodatages en numéros de réponse. Un horodatage illisible,
// absent de l'export, ou cité deux fois est une erreur : une décision qui ne
// s'applique pas ne doit pas passer inaperçue.
export function resolveDecisions(responses: Response[], decisions: Decisions): Resolved {
  const errors: string[] = []
  const byTime = new Map<number, Response[]>()
  for (const response of responses) {
    const time = response.createdAt.getTime()
    byTime.set(time, [...(byTime.get(time) ?? []), response])
  }
  const cited = new Set<string>()
  const find = (timestamp: string): number | undefined => {
    if (cited.has(timestamp)) errors.push(`horodatage ${timestamp} cité dans plusieurs décisions`)
    cited.add(timestamp)
    const date = parseTimestamp(timestamp)
    if (!date) {
      errors.push(`horodatage illisible « ${timestamp} » (attendu M/D/YYYY H:MM:SS)`)
      return undefined
    }
    const matches = byTime.get(date.getTime()) ?? []
    if (matches.length === 0) errors.push(`aucune réponse à l'horodatage ${timestamp}`)
    if (matches.length > 1) errors.push(`${matches.length} réponses à l'horodatage ${timestamp}`)
    return matches.length === 1 ? matches[0].number : undefined
  }
  const numbers = (timestamps: string[]) =>
    timestamps.map(find).filter((n): n is number => n !== undefined)

  const skips = new Set(numbers(decisions.skip))
  const keeps = new Set(numbers(decisions.keep))
  const merges: number[][] = []
  for (const group of decisions.merge) {
    if (group.length < 2) errors.push(`une fusion demande au moins deux horodatages : ${group.join(', ')}`)
    merges.push(numbers(group))
  }
  return { skips, keeps, merges: merges.filter((group) => group.length >= 2), errors }
}
