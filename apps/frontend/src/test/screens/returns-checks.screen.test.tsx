import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { lastDownloadedText } from '@/test/downloaded.ts'
import { returnsChecksPage } from '@/test/pages/returns-checks.page.ts'
import { signedInAs } from '@/test/screen.tsx'

// The accountant opens the export with a double click in a French Excel.
describe('Screen: the accounting export of the cheques', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      signatory: 'Zoé Lefèvre',
      checkId: '1042',
      collectWorkstationId: 1000,
      sellerAmount: 1234.5,
      checkAmount: 1234.5,
      collectedAt: '2026-09-12T14:58:00.000Z',
      seller: { lastName: 'Lefèvre', firstName: 'Zoé' },
    })
  })

  it('reads as Excel expects it: accents, Windows lines, amounts as numbers', async () => {
    const page = await returnsChecksPage()

    await page.exportForAccounting()

    const file = await lastDownloadedText()
    expect(file.fileName).toBe('export-comptable.csv')
    // The mark that makes Excel read the file as UTF-8.
    expect([...file.bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    // No thousands space: « 1 234,50 » would be text to Excel.
    expect(file.text).toBe(
      'Cpte;Jal;Date;Libelle;Debit;Credit;N°CH\r\n' +
        '512100;CAS;12/09/2026;1042 Lefèvre Zoé;;1234,50;1042\r\n' +
        '580000;CAS;12/09/2026;1042 Lefèvre Zoé;1234,50;;1042\r\n',
    )
  })

  it('keeps a name holding a semicolon in its own column', async () => {
    await givenDeposit({
      depositIndex: 13,
      signatory: 'Jean Bon',
      checkId: '1043',
      collectWorkstationId: 1000,
      sellerAmount: 22,
      checkAmount: 22,
      collectedAt: '2026-09-12T15:04:00.000Z',
      seller: { lastName: 'Bon; Martin', firstName: 'Jean' },
    })
    const page = await returnsChecksPage()

    await page.exportForAccounting()

    const lines = (await lastDownloadedText()).text.split('\r\n')
    expect(lines).toContain(
      '512100;CAS;12/09/2026;"1043 Bon; Martin Jean";;22,00;1043',
    )
  })
})

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
    signedInAs('ADMIN')
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
    // Paris time (UTC+2 in September), French format.
    expect(page.collectedAt(12)).toBe('12/09/2026 16:58:00')

    // The row that used to crash the page.
    expect(page.seller(13)).toBe('Bon Jean')
    expect(page.collectedAt(13)).toBe('12/09/2026 17:04:00')

    // Both cheques counted, so neither row was silently dropped either.
    expect(page.summary().count).toBe('2')
  })

  it('leaves the date empty rather than showing a bogus one when never collected', async () => {
    signedInAs('ADMIN')
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

// A cheque comes out of the printer on the wrong form, or the number typed
// on « Retour > Particulier » was not the one of the cheque in the tray: the
// return is validated, the fiche has left the return screen, and the number
// kept for the accountant is wrong. It is corrected here, one cheque at a
// time.
describe('Screen: correcting the number of a cheque already written', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      signatory: 'Camille Durand',
      checkId: '1042',
      collectWorkstationId: 1000,
      sellerAmount: 178,
      collectedAt: '2026-09-12T14:58:00.000Z',
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
    await givenDeposit({
      depositIndex: 13,
      signatory: 'Jean Bon',
      checkId: '1043',
      collectWorkstationId: 1000,
      sellerAmount: 22,
      collectedAt: '2026-09-12T15:04:00.000Z',
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
  })

  const checkIdOf = async (depositIndex: number) =>
    (await local.deposits()).find((d) => d.depositIndex === depositIndex)
      ?.checkId

  it('corrects the number on the fiche, and sends it to the other PCs', async () => {
    const page = await returnsChecksPage()
    expect(page.checkId(12)).toBe('1042')

    const box = await page.edit(12)
    expect(box.title).toBe('Modifier le n° de chèque — fiche 12')
    expect(box.checkId()).toBe('1042')
    await box.type('1044')
    await box.save()

    expect(page.isEditOpen()).toBe(false)
    expect(page.checkId(12)).toBe('1044')
    expect(await checkIdOf(12)).toBe('1044')
    // Only the number moves: the signatory and the return stay as they were.
    expect(page.rowText(12)).toEqual([
      '12',
      'Durand Camille',
      '1000',
      '1044',
      'Camille Durand',
      '12/09/2026 16:58:00',
      '178,00 €',
      '',
    ])
    expect(
      (await local.outbox()).map((op) => [
        op.collection,
        op.operation,
        op.data,
      ]),
    ).toEqual([['deposits', 'update', { checkId: '1044' }]])
  })

  it('refuses a number that is not one, as the return screen does', async () => {
    const page = await returnsChecksPage()
    const box = await page.edit(12)

    await box.type('')
    await box.save()
    expect(box.messages()).toEqual(['Le n° de chèque est obligatoire'])

    await box.type('10a')
    await box.save()
    expect(box.messages()).toEqual(['Le n° de chèque est obligatoire'])

    await box.cancel()
    expect(page.checkId(12)).toBe('1042')
    expect(await checkIdOf(12)).toBe('1042')
    expect(await local.outbox()).toEqual([])
  })

  it('warns when another cheque already has the number, and saves it once confirmed', async () => {
    const page = await returnsChecksPage()
    const box = await page.edit(12)
    await box.type('1043')
    await box.save()

    expect(box.messages()).toEqual([
      'Le chèque 1043 est déjà celui de la fiche 13 (Bon Jean).',
    ])
    expect(await checkIdOf(12)).toBe('1042')

    await box.saveAnyway()

    expect(page.isEditOpen()).toBe(false)
    expect(page.checkId(12)).toBe('1043')
    expect(page.checkId(13)).toBe('1043')
    expect(await checkIdOf(12)).toBe('1043')
  })

  it('asks again when the number is changed after the warning', async () => {
    const page = await returnsChecksPage()
    const box = await page.edit(12)
    await box.type('1043')
    await box.save()
    expect(box.hasButton('Enregistrer quand même')).toBe(true)

    await box.type('1045')
    expect(box.messages()).toEqual([])
    expect(box.hasButton('Enregistrer quand même')).toBe(false)
    await box.save()

    expect(page.checkId(12)).toBe('1045')
  })

  it('leaves the number as it was when the box is cancelled', async () => {
    const page = await returnsChecksPage()
    const box = await page.edit(12)
    await box.type('1044')
    await box.cancel()

    expect(page.isEditOpen()).toBe(false)
    expect(page.checkId(12)).toBe('1042')
    expect(await checkIdOf(12)).toBe('1042')
    expect(await local.outbox()).toEqual([])
  })

  it('opens on the number of the fiche, not the one typed last time', async () => {
    const page = await returnsChecksPage()
    const first = await page.edit(12)
    await first.type('1099')
    await first.cancel()

    const again = await page.edit(12)
    expect(again.checkId()).toBe('1042')
  })
})
