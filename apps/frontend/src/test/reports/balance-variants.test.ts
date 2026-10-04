// The variants of the test book (« Bilan — scénarios »): the reference
// bourse as the day leaves it, one thing changed, and what that does to the
// balance. Only the lines that move are spelled out; every other line keeps
// its reference value.
import { describe, expect, it } from 'vitest'
import type { BourseSpec } from '@/test/scenarios/bourse-state.ts'
import {
  balanceLines,
  givenTheBourse,
  referenceBourse,
} from '@/test/scenarios/bourse-state.ts'
import { referenceBalance } from '@/test/scenarios/reference-balance.ts'

// The reference bourse, changed by `change`, built into the base.
async function givenTheReferenceBourseWhere(
  change: (bourse: BourseSpec) => void = () => {},
) {
  const bourse = referenceBourse()
  change(bourse)
  await givenTheBourse(bourse)
}

describe('Report: the balance, variant by variant', () => {
  // The same bourse as the one typed through the screens, built straight
  // into the base: same balance, line for line.
  it('reference: the bourse built in the base closes as the one typed in', async () => {
    await givenTheReferenceBourseWhere()

    expect(await balanceLines()).toEqual(referenceBalance)
  })

  it('V1b: a contribution settled in the evening moves to the paid ones, and its cash to the return till', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      bourse.fiches.bon.contribution = 'A_PAYER'
      bourse.fiches.bon.contributionAmount = 2
      bourse.settled = ['bon']
      bourse.counts.find((count) => count.till === 7000)!.real = 2
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      'Cotisations payées': '6,00 €',
      'Dont cotisations soldées au retour': '2,00 €',
      'Recette bourse théorique': '68,00 €',
      'Cotisations encaissées': '4,00 €',
      'Recette bourse': '68,00 €',
    })
  })

  it('V3: a short till and an over till are explained by the difference of the tills', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      Object.assign(bourse.counts.find((count) => count.till === 5000)!, {
        real: 135,
        difference: -5,
      })
      Object.assign(bourse.counts.find((count) => count.till === 1000)!, {
        real: 3,
        difference: 1,
      })
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      'Total espèces': '165,00 €',
      'Total paiements': '515,00 €',
      'Cotisations encaissées': '3,00 €',
      'Recette bourse': '62,00 €',
      'Différence recette théorique et réelle': '-4,00 €',
      'Différence de caisses': '-4,00 €',
    })
  })

  it('V6: a seller who does not come for the cheque is still owed it', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      bourse.cheques = ['durand']
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      'Règlements particuliers': '126,00 €',
      'Montant total décaissé': '296,00 €',
      'Chèques particuliers non faits': '160,00 €',
    })
  })

  it('V7: a deleted article leaves the deposit', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      bourse.fiches.durand.articles[2] = { price: 10, status: 'DELETED' }
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      "Nombre d'articles en dépôt": '8',
      'Montant du dépôt': '850,00 €',
      '% des articles en dépôt': '62,50 %',
      '% de la valeur du dépôt': '61,18 %',
    })
  })

  // Articles that never reached the shop were never on sale: neither they
  // nor a fiche left without any article count.
  it('V12: a pro fiche never received leaves the balance as it was', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      bourse.fiches.glisse = {
        seller: 'Glisse Pro',
        type: 'PRO',
        depositIndex: 4,
        till: 1,
        contribution: 'PRO',
        contributionAmount: 0,
        articles: [
          { price: 200, status: 'RECEPTION_PENDING' },
          { price: 200, status: 'RECEPTION_PENDING' },
        ],
      }
    })

    expect(await balanceLines()).toEqual(referenceBalance)
  })

  it('V13: a pro article never received leaves the deposit', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      bourse.fiches.sport.articles[1] = {
        price: 300,
        status: 'RECEPTION_PENDING',
      }
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      "Nombre d'articles en dépôt": '8',
      'Montant du dépôt': '560,00 €',
      '% des articles en dépôt': '62,50 %',
      '% de la valeur du dépôt': '92,86 %',
    })
  })

  it('V2a: a buyer who brings the article back is no longer a buyer', async () => {
    await givenTheReferenceBourseWhere((bourse) => {
      // Bruno brings the snowboard back to till 6000 before the returns are
      // worked out, and gets his 150 € back on the card.
      bourse.refunds = [
        { saleIndex: 5002, till: 6000, card: 150, articles: [['martin', 'A']] },
      ]
    })

    expect(await balanceLines()).toEqual({
      ...referenceBalance,
      // Bruno, refunded in full, is no longer a buyer.
      "Nombre d'acheteurs": '2',
      'Panier moyen (€)': '185,00 €',
      'Panier moyen (articles)': '2',
      "Nombre d'articles vendus": '4',
      '% des articles en dépôt': '44,44 %',
      'Montant total des ventes': '370,00 €',
      '% de la valeur du dépôt': '43,02 %',
      // Martin: 30 € sold, 3 € of rights, 27 − 2 = 25 € for him.
      'Droits CMR': '47,00 €',
      'Recette bourse théorique': '51,00 €',
      'Total cartes': '0,00 €',
      'Total paiements': '370,00 €',
      'Règlements particuliers': '151,00 €',
      'Montant total décaissé': '321,00 €',
      'Recette bourse': '51,00 €',
    })
  })
})
