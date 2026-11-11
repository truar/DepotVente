// « Espèces des caisses », on the evening once every till is counted: the
// treasurer wants the notes and coins of all the counts together, as if every
// drawer were emptied on the same table — deposit, sale and return tills
// alike.
import { beforeEach, describe, expect, it } from 'vitest'
import { givenCashRegisterControl } from '@/test/harness.ts'
import { cashTotalsPage } from '@/test/pages/cash-totals.page.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

describe('Report: the cash of every till, added together', () => {
  beforeEach(() => {
    signedInAs('ADMIN')
  })

  it('opens from the reports menu', async () => {
    const { user, router } = await openScreen('/reports')

    await user.click(await screen.findByText('Espèces des caisses'))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/reports/cash'),
    )
  })

  it('adds up each note and coin of the deposit, sale and return counts', async () => {
    await givenCashRegisterControl({
      cashRegisterId: 1000,
      type: 'DEPOSIT',
      initialAmount: 80,
      cash50: 2,
      cash2: 3,
    })
    await givenCashRegisterControl({
      cashRegisterId: 5000,
      type: 'SALE',
      initialAmount: 80,
      cash50: 1,
      cash20: 4,
      cash05: 3,
    })
    await givenCashRegisterControl({
      cashRegisterId: 7000,
      type: 'RETURN',
      initialAmount: 0,
      cash200: 1,
      cash001: 7,
    })

    const report = await cashTotalsPage()
    await report.loaded()

    expect(report.lines()).toEqual({
      '200 €': '1 × 200 € = 200,00 €',
      '100 €': '0 × 100 € = 0,00 €',
      '50 €': '3 × 50 € = 150,00 €',
      '20 €': '4 × 20 € = 80,00 €',
      '10 €': '0 × 10 € = 0,00 €',
      '5 €': '0 × 5 € = 0,00 €',
      '2 €': '3 × 2 € = 6,00 €',
      '1 €': '0 × 1 € = 0,00 €',
      '0,50 €': '3 × 0,50 € = 1,50 €',
      '0,20 €': '0 × 0,20 € = 0,00 €',
      '0,10 €': '0 × 0,10 € = 0,00 €',
      '0,05 €': '0 × 0,05 € = 0,00 €',
      '0,02 €': '0 × 0,02 € = 0,00 €',
      '0,01 €': '7 × 0,01 € = 0,07 €',
      'Total billets': '430,00 €',
      'Total pièces': '7,57 €',
      'Total compté': '437,57 €',
      'Fonds de caisse': '160,00 €',
      'Espèces réelles': '277,57 €',
    })

    const pdf = await report.pdfText()
    expect(pdf).toContain('Espèces des caisses')
    expect(pdf).toContain('3 contrôles de caisse : 1 dépôt, 1 vente, 1 retour')
    expect(pdf).toMatch(/200 € 1 200,00 €/)
    expect(pdf).toMatch(/50 € 3 150,00 €/)
    expect(pdf).toMatch(/0,01 € 7 0,07 €/)
    expect(pdf).toMatch(/Total compté 437,57 €/)
    expect(pdf).toMatch(/Fonds de caisse -160,00 €/)
    expect(pdf).toMatch(/Espèces réelles 277,57 €/)
  })

  // Same rule as the balance: a deleted count is gone, the sale till 1 is
  // a test entry that never served, the deposit till 1 is a real one.
  it('leaves out deleted counts and the test sale till, keeps the deposit till 1', async () => {
    await givenCashRegisterControl({
      cashRegisterId: 1,
      type: 'DEPOSIT',
      initialAmount: 0,
      cash10: 1,
    })
    await givenCashRegisterControl({
      cashRegisterId: 1,
      type: 'SALE',
      initialAmount: 0,
      cash100: 5,
    })
    await givenCashRegisterControl({
      cashRegisterId: 6000,
      type: 'SALE',
      initialAmount: 0,
      cash100: 2,
      deletedAt: new Date(),
    })

    const report = await cashTotalsPage()
    await report.loaded()

    expect(report.line('100 €')).toBe('0 × 100 € = 0,00 €')
    expect(report.line('10 €')).toBe('1 × 10 € = 10,00 €')
    expect(report.line('Total compté')).toBe('10,00 €')
  })
})
