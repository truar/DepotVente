import { describe, expect, it } from 'vitest'
import {
  DECISIONS,
  formatTimestamp,
  parseTimestamp,
  resolveDecisions,
} from '../src/scripts/import/predeposit-decisions'
import type { Response } from '../src/scripts/import/predeposit-duplicates'

function response(number: number, timestamp: string): Response {
  return {
    number,
    createdAt: parseTimestamp(timestamp)!,
    firstName: 'Paul',
    lastName: 'MARTIN',
    phoneNumber: '0601020304',
    email: '',
    city: 'RUMILLY',
    articles: [],
  }
}

const responses = [
  response(1, '10/20/2026 9:20:08'),
  response(2, '10/27/2026 15:24:01'),
  response(3, '10/28/2026 18:02:55'),
]

describe('resolveDecisions (arbitrages des doublons du Google Form)', () => {
  it('repère les réponses par leur horodatage', () => {
    const resolved = resolveDecisions(responses, {
      skip: ['10/20/2026 9:20:08'],
      keep: ['10/27/2026 15:24:01'],
      merge: [],
    })
    expect(resolved).toEqual({ skips: new Set([1]), keeps: new Set([2]), merges: [], errors: [] })
  })

  it('fusionne un groupe d’horodatages', () => {
    const resolved = resolveDecisions(responses, {
      skip: [],
      keep: [],
      merge: [['10/27/2026 15:24:01', '10/28/2026 18:02:55']],
    })
    expect(resolved.merges).toEqual([[2, 3]])
    expect(resolved.errors).toEqual([])
  })

  // Une décision de l'an passé, ou mal recopiée, ne doit pas passer inaperçue.
  it('signale un horodatage absent, illisible ou cité deux fois', () => {
    const { errors } = resolveDecisions(responses, {
      skip: ['10/21/2026 9:20:08', '20/10/2026 09:20'],
      keep: ['10/27/2026 15:24:01'],
      merge: [['10/27/2026 15:24:01', '10/28/2026 18:02:55'], ['10/28/2026 18:02:55']],
    })
    expect(errors).toEqual([
      "aucune réponse à l'horodatage 10/21/2026 9:20:08",
      'horodatage illisible « 20/10/2026 09:20 » (attendu M/D/YYYY H:MM:SS)',
      'horodatage 10/27/2026 15:24:01 cité dans plusieurs décisions',
      'une fusion demande au moins deux horodatages : 10/28/2026 18:02:55',
      'horodatage 10/28/2026 18:02:55 cité dans plusieurs décisions',
    ])
  })

  it('réécrit un horodatage comme l’export', () => {
    expect(formatTimestamp(parseTimestamp('10/20/2026 9:20:08')!)).toBe('10/20/2026 9:20:08')
    expect(formatTimestamp(parseTimestamp('1/5/2026 17:03:00')!)).toBe('1/5/2026 17:03:00')
  })

  // Le dépôt est public : les décisions ne citent que des horodatages.
  it('ne contient que des horodatages', () => {
    const all = [...DECISIONS.skip, ...DECISIONS.keep, ...DECISIONS.merge.flat()]
    for (const timestamp of all) expect(parseTimestamp(timestamp)).toBeDefined()
  })
})
