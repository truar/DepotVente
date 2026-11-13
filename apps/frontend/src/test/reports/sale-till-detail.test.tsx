// « Détail caisse de vente »: a till's count now prints on a single sheet;
// the administrators keep, as a report, the sale-by-sale detail it used to
// print — card, cash, cheques, deferred, refunds — for any sale till.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  givenCashRegisterControl,
  givenRefund,
  givenSale,
} from '@/test/harness.ts'
import { saleTillDetailPage } from '@/test/pages/sale-till-detail.page.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

async function givenTwoSaleTills() {
  const cash = await givenSale({
    saleIndex: 2001,
    incrementStart: 2000,
    cashAmount: 200,
    buyer: { lastName: 'Petit', firstName: 'Anna' },
  })
  await givenSale({
    saleIndex: 2002,
    incrementStart: 2000,
    cashAmount: 0,
    cardAmount: 150,
    buyer: { lastName: 'Roche', firstName: 'Marc' },
  })
  await givenSale({
    saleIndex: 2003,
    incrementStart: 2000,
    cashAmount: 0,
    checkAmount: 60,
    deferredAmount: 40,
    buyer: { lastName: 'Blanc', firstName: 'Eva' },
  })
  await givenRefund(cash.sale, { cashAmount: 30, comment: 'Taille' })
  await givenCashRegisterControl({
    cashRegisterId: 2000,
    type: 'SALE',
    initialAmount: 80,
    theoreticalCashAmount: 170,
    realCashAmount: 170,
    totalAmount: 170,
    cash50: 5,
    comment: 'RAS',
  })
  await givenSale({
    saleIndex: 3001,
    incrementStart: 3000,
    cashAmount: 0,
    cardAmount: 90,
    buyer: { lastName: 'Durand', firstName: 'Léo' },
  })
}

describe('Report: the detail of a sale till', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenTwoSaleTills()
  })

  it('opens from the reports menu', async () => {
    const { user, router } = await openScreen('/reports')

    await user.click(await screen.findByText('Détail caisse de vente'))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/reports/sale-tills'),
    )
  })

  it('prints every sale of the chosen till under its payment method, with its saved count', async () => {
    const report = await saleTillDetailPage()
    await waitFor(() => expect(report.tills()).toEqual(['2000', '3000']))

    await report.chooseTill(2000)

    expect(report.lines()).toMatchObject({
      Cartes: '150,00 €',
      'Espèces comptées': '170,00 €',
      Chèques: '60,00 €',
      Différé: '40,00 €',
      'Remboursements CB': '0,00 €',
      Total: '420,00 €',
      Différence: '0,00 €',
    })
    const pdf = await report.pdfText(2000)
    for (const title of [
      'Paiement CB',
      'Paiement Espèces — détail',
      'Paiement Chèques',
      'Paiement différés',
      'Remboursements',
    ]) {
      expect(pdf).toContain(title)
    }
    expect(pdf).toContain('Roche Marc')
    expect(pdf).toContain('Blanc Eva')
    expect(pdf).toContain('Petit Anna')
    expect(pdf).toContain('Taille')
    expect(pdf).toContain('Montant théorique 170,00 €')
    expect(pdf).toContain('Commentaire: RAS')
    expect(pdf).not.toContain('Durand Léo')
  })

  it('shows a till not counted yet with an empty count', async () => {
    const report = await saleTillDetailPage()

    await report.chooseTill(3000)

    expect(report.lines()).toMatchObject({
      Cartes: '90,00 €',
      'Espèces comptées': '0,00 €',
      Total: '90,00 €',
    })
    const pdf = await report.pdfText(3000)
    expect(pdf).toContain('Durand Léo')
    expect(pdf).not.toContain('Roche Marc')
  })
})
