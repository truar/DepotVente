// The cheques the buyers paid with, every till together: one line per sale,
// then how many and how much, for the bank deposit. Exported from the list
// of the sale tills' counts.
import { beforeEach, describe, expect, it } from 'vitest'
import { givenSale, givenWorkstation } from '@/test/harness.ts'
import { lastDownloadedText } from '@/test/downloaded.ts'
import { cashRegisterControlsPage } from '@/test/pages/cash-register-controls.page.ts'
import { signedInAs } from '@/test/screen.tsx'

describe('Screen: the buyers’ cheques, from the sale tills’ counts', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    // Part by cheque, part deferred: only the cheque is listed.
    await givenSale({
      saleIndex: 2001,
      cashAmount: 0,
      checkAmount: 60,
      deferredAmount: 40,
      buyer: { lastName: 'Blanc', firstName: 'Eva' },
    })
    await givenSale({
      saleIndex: 1001,
      incrementStart: 1000,
      cashAmount: 0,
      checkAmount: 1250.5,
      buyer: { lastName: 'Lefèvre', firstName: 'Zoé' },
    })
    // Paid by card: not a cheque.
    await givenSale({
      saleIndex: 2002,
      cashAmount: 0,
      cardAmount: 150,
      buyer: { lastName: 'Roche', firstName: 'Marc' },
    })
    // A deleted sale, and one keyed on the test till 1: left out, as in the
    // sales recap's « Chèques » column.
    await givenSale({
      saleIndex: 2003,
      cashAmount: 0,
      checkAmount: 30,
      deletedAt: new Date(),
    })
    await givenSale({
      saleIndex: 2,
      incrementStart: 1,
      cashAmount: 0,
      checkAmount: 20,
    })
  })

  it('lists every sale paid by cheque, with the count and the total, as Excel reads it', async () => {
    const page = await cashRegisterControlsPage('sales')

    await page.exportBuyerChecks()

    const file = await lastDownloadedText()
    expect(file.fileName).toBe('cheques-clients.csv')
    expect([...file.bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(file.text).toBe(
      'N° vente;Nom;Montant\r\n' +
        '1001;Lefèvre Zoé;1250,50\r\n' +
        '2001;Blanc Eva;60,00\r\n' +
        'Total;2 chèques;1310,50\r\n',
    )
  })

  it('is offered on the sales list only', async () => {
    expect(
      (await cashRegisterControlsPage('deposits')).buyerChecksButton(),
    ).toBeNull()
    expect(
      (await cashRegisterControlsPage('returns')).buyerChecksButton(),
    ).toBeNull()
  })
})
