import { describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { returnsChecksPage } from '@/test/pages/returns-checks.page.ts'
import { signedInAs } from '@/test/screen.tsx'

// The cheque listing reads `collectedAt` back out of the local base, where the
// same field has two shapes: an ISO string when the record arrived through the
// sync (bulkPut of the server's raw JSON), a Date object when the return was
// keyed on this very PC (useReturnDepositMutation writes `new Date()`).
//
// The screen used to cast to string and call `.split('T')`, so the second shape
// threw a TypeError during render. With no error boundary anywhere in the app,
// one such row took the whole page down - and only on the PC that had taken
// that return, which is what made it look like a single broken machine.
describe('Screen: the cheque listing', () => {
  it('lists cheques whether collectedAt was synced or written on this PC', async () => {
    signedInAs()
    await givenWorkstation(1000)

    // Came back from the server: ISO string.
    await givenDeposit({
      depositIndex: 12,
      signatory: 'Camille Durand',
      checkId: '1042',
      collectWorkstationId: 1000,
      sellerAmount: 178,
      collectedAt: '2026-09-12T14:58:00.000Z',
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })

    // Keyed on this PC and not yet echoed back by a delta: real Date.
    await givenDeposit({
      depositIndex: 13,
      signatory: 'Jean Bon',
      checkId: '1043',
      collectWorkstationId: 1000,
      sellerAmount: 22,
      collectedAt: new Date('2026-09-12T15:04:00.000Z'),
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })

    const page = await returnsChecksPage()

    expect(page.seller(12)).toBe('Durand Camille')
    expect(page.collectedAt(12)).toBe('2026-09-12 14:58:00')

    // The row that used to crash the page.
    expect(page.seller(13)).toBe('Bon Jean')
    expect(page.collectedAt(13)).toBe('2026-09-12 15:04:00')

    // Both cheques counted, so neither row was silently dropped either.
    expect(page.summary().count).toBe('2')
  })

  it('leaves the date empty rather than showing a bogus one when never collected', async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 14,
      signatory: 'Signé sans date',
      checkId: '1044',
      sellerAmount: 10,
      collectedAt: undefined,
      seller: { lastName: 'Sans', firstName: 'Date' },
    })

    const page = await returnsChecksPage()
    expect(page.collectedAt(14)).toBe('')
  })
})
