import { describe, expect, it } from 'vitest'
import {
  type ArticleInput,
  duplicateReason,
  findDuplicates,
  type Response,
  sameSeller,
} from '../src/scripts/import/predeposit-duplicates'

function article(fields: Partial<ArticleInput> = {}): ArticleInput {
  return {
    category: 'Skis',
    discipline: 'Alpin',
    brand: 'Rossignol',
    model: '',
    size: '150',
    color: 'Bleu',
    price: 50,
    ...fields,
  }
}

// Réponses numérotées dans l'ordre d'envoi, une minute d'écart.
let number = 0
function response(fields: Partial<Response> = {}): Response {
  number++
  return {
    number,
    createdAt: new Date(2026, 9, 19, 9, number),
    firstName: 'Paul',
    lastName: 'DURAND',
    phoneNumber: '0600000001',
    email: 'paul.durand@example.fr',
    city: 'RUMILLY',
    articles: [article()],
    ...fields,
  }
}

const numbers = (groups: Response[][]) => groups.map((group) => group.map((r) => r.number))

describe('findDuplicates', () => {
  it('regroupe les réponses qui partagent un téléphone, un email ou un nom + prénom', () => {
    const phone = [response(), response({ lastName: 'MARTIN', email: 'autre@example.fr' })]
    const email = [
      response({ lastName: 'BERNARD', phoneNumber: '0600000002', email: 'famille@example.fr' }),
      response({ lastName: 'PETIT', phoneNumber: '0600000003', email: 'famille@example.fr' }),
    ]
    const name = [
      response({ lastName: 'LEROY', firstName: 'Hélène', phoneNumber: '0600000004', email: 'a@example.fr' }),
      response({ lastName: 'Leroy', firstName: 'HELENE', phoneNumber: '0600000005', email: 'b@example.fr' }),
    ]
    const alone = response({ lastName: 'MOREAU', phoneNumber: '0600000006', email: 'seul@example.fr' })

    expect(numbers(findDuplicates([...phone, ...email, ...name, alone]))).toEqual([
      phone.map((r) => r.number),
      email.map((r) => r.number),
      name.map((r) => r.number),
    ])
  })
})

// Mêmes nom, prénom et téléphone : la même personne, fusionnée d'office.
describe('sameSeller', () => {
  const skis = article()
  const boots = article({ category: 'Chaussures', brand: 'Salomon', size: '42', price: 30 })
  const poles = article({ category: 'Bâtons', brand: 'Leki', size: '120cm', price: 10 })

  it('met à la suite les articles de deux dépôts différents, dans l’ordre d’envoi', () => {
    const first = response({ articles: [skis] })
    const second = response({ articles: [boots, poles], email: 'nouvel.email@example.fr' })

    const { merges, partial } = sameSeller([second, first], new Set())

    expect(merges).toEqual([{ responses: [first, second], articles: [skis, boots, poles], repeated: false }])
    expect(partial).toEqual([])
  })

  it('garde une seule fois les articles d’un formulaire envoyé deux fois', () => {
    const first = response({ articles: [skis, boots] })
    const second = response({ articles: [boots, skis], email: 'nouvel.email@example.fr' })

    const { merges } = sameSeller([first, second], new Set())

    expect(merges).toEqual([{ responses: [first, second], articles: [boots, skis], repeated: true }])
  })

  it('reconnaît un formulaire renvoyé même si le descriptif ou la couleur ont été ressaisis', () => {
    const first = response({ articles: [{ ...skis, model: 'Cloud 6', color: 'Blanc mauve' }, { ...boots, color: 'Blanc gris' }] })
    const second = response({ articles: [{ ...skis, model: 'CLOUD 6', color: 'Blanc mauve' }, { ...boots, model: 'Salomon', color: 'Blanc' }] })

    const { merges } = sameSeller([first, second], new Set())

    expect(merges).toEqual([{ responses: [first, second], articles: second.articles, repeated: true }])
  })

  it('ne tient compte ni des majuscules ni des accents dans les noms', () => {
    const first = response({ lastName: 'LÉVÊQUE', firstName: 'Hélène', articles: [skis] })
    const second = response({ lastName: 'Leveque', firstName: 'HELENE', articles: [boots] })

    expect(sameSeller([first, second], new Set()).merges.map((m) => m.responses)).toEqual([[first, second]])
  })

  it('ne fusionne pas quand une partie seulement des articles se répète', () => {
    const first = response({ articles: [skis, boots] })
    const second = response({ articles: [skis, poles] })

    expect(sameSeller([first, second], new Set())).toEqual({ merges: [], partial: [[first, second]] })
  })

  it.each([
    ['le même téléphone sous un autre nom', { lastName: 'MARTIN' }],
    ['le même téléphone sous un autre prénom', { firstName: 'Julie' }],
    ['le même nom avec un autre téléphone', { phoneNumber: '0600000099' }],
  ])('ne fusionne pas %s', (_, other) => {
    const first = response({ articles: [skis] })
    const second = response({ ...other, articles: [boots] })

    expect(sameSeller([first, second], new Set())).toEqual({ merges: [], partial: [] })
  })

  it('ne fusionne pas sans téléphone', () => {
    const first = response({ phoneNumber: '', articles: [skis] })
    const second = response({ phoneNumber: '', articles: [boots] })

    expect(sameSeller([first, second], new Set())).toEqual({ merges: [], partial: [] })
  })

  it('laisse la main aux arbitrages passés en option', () => {
    const first = response({ articles: [skis] })
    const second = response({ articles: [boots] })

    expect(sameSeller([first, second], new Set([second.number]))).toEqual({ merges: [], partial: [] })
  })
})

// Pourquoi un groupe de doublons attend un arbitrage : les deux premiers
// demandent d'appeler le vendeur.
describe('duplicateReason', () => {
  it('signale un même téléphone sous des noms différents', () => {
    expect(duplicateReason([response(), response({ lastName: 'MARTIN' })])).toBe('same-phone')
  })

  it('signale une même personne dont une partie seulement des articles se répète', () => {
    expect(duplicateReason([response(), response()])).toBe('same-seller')
  })

  it('signale un même email ou un même nom avec un autre téléphone', () => {
    expect(duplicateReason([response(), response({ phoneNumber: '0600000099' })])).toBe('other')
  })
})
