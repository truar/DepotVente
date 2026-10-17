// « Suivi en direct de la bourse », on the administrator's computer during
// the day: no return worked out, no cheque written, no till counted yet. The
// figures are those the balance would print at that moment, and they follow
// the sales as they reach the local base.
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db.ts'
import { givenSale } from '@/test/harness.ts'
import { liveBalancePage } from '@/test/pages/live-balance.page.ts'
import {
  givenTheBourse,
  referenceBourse,
} from '@/test/scenarios/bourse-state.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

// The reference bourse in the middle of the day.
async function givenTheReferenceBourseDuringTheDay() {
  const bourse = referenceBourse()
  bourse.counts = []
  bourse.returnsWorkedOut = []
  bourse.cheques = []
  await givenTheBourse(bourse)
}

describe('Report: following the bourse live', () => {
  beforeEach(() => {
    signedInAs('ADMIN')
  })

  it('opens from the reports menu', async () => {
    const { user, router } = await openScreen('/reports')

    await user.click(await screen.findByText('Suivi en direct'))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/reports/live'),
    )
  })

  it('shows what the balance would print now, the rights included', async () => {
    await givenTheReferenceBourseDuringTheDay()

    const live = await liveBalancePage()

    // Four fiches put 860 € and 9 articles on sale.
    expect(live.tile('Dépôts')).toEqual([
      '4',
      'panier 215,00 €',
      '2,25 articles',
    ])
    expect(live.tile('Articles vendus')).toEqual(['5 / 9', '55,56 %'])
    expect(live.tile('Montant des ventes')).toEqual([
      '520,00 €',
      '60,47 % de la valeur du dépôt',
    ])
    expect(live.tile('Acheteurs')).toEqual([
      '3',
      'panier 173,33 €',
      '1,67 articles',
    ])
    expect(live.tile('Recette bourse théorique')).toEqual([
      '66,00 €',
      'détail ci-dessous',
    ])
    // No return worked out, yet the rights are there: 10 % of 140 and 180,
    // 15 % of 200; Martin's contribution is taken from what he sold.
    expect(live.lines('Recette bourse théorique')).toEqual({
      'Droits CMR': '62,00 €',
      'Cotisations payées': '4,00 €',
      'Cotisations non payées': '0,00 €',
      'Achats CMR': '0,00 €',
      'Recette bourse théorique': '66,00 €',
    })
    // No till counted: the cash is what the sales say, 140 at till 5000 and
    // 30 at till 6000.
    expect(live.lines('Encaissements')).toEqual({
      Cartes: '150,00 €',
      Chèques: '200,00 €',
      'Espèces attendues': '170,00 €',
      'Paiements différés': '0,00 €',
      Total: '520,00 €',
    })
  })

  it('follows a sale as soon as it reaches the base', async () => {
    await givenTheReferenceBourseDuringTheDay()
    const live = await liveBalancePage()

    // Denis buys Bon's 20 € article at till 6000, by card.
    const bon = await db.deposits.where({ depositIndex: 2001 }).first()
    const article = (
      await db.articles.where({ depositId: bon!.id }).toArray()
    ).find((a) => a.price === 20)!
    const { sale } = await givenSale({
      saleIndex: 6002,
      incrementStart: 6000,
      cashAmount: 0,
      cardAmount: 20,
      buyer: { lastName: 'Moreau', firstName: 'Denis' },
    })
    await db.articles.update(article.id, { saleId: sale.id, status: 'SOLD' })

    await waitFor(() =>
      expect(live.tile('Articles vendus')).toEqual(['6 / 9', '66,67 %']),
    )
    expect(live.tile('Montant des ventes')[0]).toBe('540,00 €')
    expect(live.tile('Recette bourse théorique')[0]).toBe('68,00 €')
    expect(live.lines('Recette bourse théorique')['Droits CMR']).toBe('64,00 €')
    expect(live.lines('Encaissements')).toMatchObject({
      Cartes: '170,00 €',
      Total: '540,00 €',
    })
  })

  it('shows zeros, not NaN, before anything is deposited', async () => {
    const live = await liveBalancePage()

    expect(live.tile('Dépôts')).toEqual(['0', 'panier 0,00 €', '0,00 articles'])
    expect(live.tile('Acheteurs')).toEqual([
      '0',
      'panier 0,00 €',
      '0,00 articles',
    ])
  })

  it('says when the last sale arrived, and from which till', async () => {
    const live = await liveBalancePage()
    expect(live.lastSale()).toBe('Aucune vente reçue')

    await givenSale({
      saleIndex: 5001,
      incrementStart: 5000,
      createdAt: new Date(2026, 9, 17, 14, 2),
    })
    // Pulled from the server: the date is stored as the server wrote it.
    await givenSale({
      saleIndex: 6001,
      incrementStart: 6000,
      createdAt: new Date(2026, 9, 17, 14, 31).toISOString(),
    })
    // Till 1 is a test entry, left out as in the balance.
    await givenSale({
      saleIndex: 2,
      incrementStart: 1,
      createdAt: new Date(2026, 9, 17, 15, 0),
    })

    await waitFor(() =>
      expect(live.lastSale()).toBe(
        'Dernière vente reçue à 14:31 · caisse 6000',
      ),
    )
  })
})
