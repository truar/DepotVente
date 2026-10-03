import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { returnsChecksPage } from '@/test/pages/returns-checks.page.ts'
import { returnsIndividualsPage } from '@/test/pages/returns-individuals.page.ts'
import { lastPrintedText, printedDocuments } from '@/test/printed.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// Two private sellers sold something and wait for their cheque: Camille
// Durand (fiche 12) and Jean Bon (fiche 13).
describe('Screen: pick the fiche whose cheque is to be written', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      soldAmount: 200,
      sellerAmount: 178,
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
    await givenDeposit({
      depositIndex: 13,
      soldAmount: 25,
      sellerAmount: 22,
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
  })

  // Picking a fiche is enough: there is no "Valider" to press after it.
  it('shows the amounts of the fiche picked in the list', async () => {
    const page = await returnsIndividualsPage()
    expect(page.depositRow()).toBeNull()
    expect(page.hasButton('Valider')).toBe(false)

    await page.pickDeposit('Durand')

    expect(page.selectedDeposit()).toBe('12 - Camille Durand')
    expect(page.depositRow()).toEqual([
      '12',
      'Durand Camille',
      '200,00 €',
      '178,00 €',
      'cent soixante-dix-huit euros',
    ])
  })

  it('switches to another fiche picked in the list', async () => {
    const page = await returnsIndividualsPage()

    await page.pickDeposit('Durand')
    await page.pickDeposit('Bon')

    expect(page.selectedDeposit()).toBe('13 - Jean Bon')
    await waitFor(() => expect(page.depositRow()?.[0]).toBe('13'))
    expect(page.depositRow()?.[3]).toBe('22,00 €')
  })

  // Picking the open fiche a second time, by a slip of the hand, must not
  // close it.
  it('keeps the fiche open when it is picked again', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')

    await page.pickDeposit('Durand')

    expect(page.selectedDeposit()).toBe('12 - Camille Durand')
    expect(page.depositRow()?.[0]).toBe('12')
  })

  // Once its cheque is written, the fiche is done: the list empties, ready
  // for the next seller, and no longer offers it.
  it('empties the list once the cheque is written, and stops offering the fiche', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()

    await page.nextCheque()

    await waitFor(() => expect(page.depositRow()).toBeNull())
    expect(page.selectedDeposit()).toBe('Rechercher une fiche')
    expect(await page.offeredDeposits()).toEqual(['13 - Jean Bon'])

    // The cheque is listed for the evening review: Durand's fiche, cheque
    // n°1042 signed by Paul, for what was owed.
    const checks = await returnsChecksPage()
    await waitFor(() => expect(checks.seller(12)).toBe('Durand Camille'))
    // [Numéro du chèque, Signature]
    expect(checks.rowText(12).slice(3, 5)).toEqual(['1042', 'Paul'])
    expect(checks.amount(12)).toBe('178,00 €')
  })
})

// The evening of the sale: the return listing has computed every fiche, and
// the desk only has to pay the private sellers who sold something and have
// not been paid yet.
describe('Screen: the fiches offered for a cheque', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  // Only private sellers who sold something, whose fiche was computed and
  // whose cheque is not written yet, are offered, as « N - Prénom Nom ».
  it('offers only the computed private fiches that sold something and are not paid yet', async () => {
    await givenDeposit({
      depositIndex: 12,
      soldAmount: 200,
      sellerAmount: 178,
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
    await givenDeposit({
      depositIndex: 13,
      soldAmount: 25,
      sellerAmount: 22,
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
    // A shop: paid at the pros' desk, not here
    await givenDeposit({
      depositIndex: 14,
      type: 'PRO',
      soldAmount: 300,
      sellerAmount: 270,
      seller: { lastName: 'Glisse', firstName: 'Sport' },
    })
    // Nothing sold: computed at 0 €, no cheque to write
    await givenDeposit({
      depositIndex: 15,
      soldAmount: 0,
      sellerAmount: 0,
      seller: { lastName: 'Rien', firstName: 'Paul' },
    })
    // Not computed yet by the return listing
    await givenDeposit({
      depositIndex: 16,
      seller: { lastName: 'Attente', firstName: 'Léa' },
    })
    // Already paid: its cheque was signed by Paul
    await givenDeposit({
      depositIndex: 17,
      soldAmount: 50,
      sellerAmount: 45,
      signatory: 'Paul',
      checkId: '1001',
      seller: { lastName: 'Payé', firstName: 'Marc' },
    })

    const page = await returnsIndividualsPage()

    expect(await page.offeredDeposits()).toEqual([
      '12 - Camille Durand',
      '13 - Jean Bon',
    ])
  })
})

// The volunteer writes Camille Durand's cheque (fiche 12, 178 € owed): the
// form makes sure the cheque was printed, signed and numbered before the
// fiche is closed.
describe('Screen: write the cheque of a fiche', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit({
      depositIndex: 12,
      soldAmount: 200,
      sellerAmount: 178,
      seller: { lastName: 'Durand', firstName: 'Camille' },
    })
    await givenDeposit({
      depositIndex: 13,
      soldAmount: 87,
      sellerAmount: 76.95,
      seller: { lastName: 'Bon', firstName: 'Jean' },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // A fiche cannot be closed on a cheque that never came out of the
  // printer: the desk says so, and the button stays greyed until it does.
  it('asks for the cheque to be printed before the fiche can be validated', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')

    expect(page.printReminderShown()).toBe(true)
    expect(page.nextChequeButton()).toBeDisabled()
    expect(page.printButtonLabel()).toBe('Imprimer le chèque')

    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()

    expect(page.printReminderShown()).toBe(false)
    expect(page.nextChequeButton()).toBeEnabled()
    expect(page.printButtonLabel()).toBe('Réimprimer le chèque')
  })

  // A cheque goes out signed and numbered: the print is refused, and
  // nothing comes out of the printer, until both are filled in.
  it('prints nothing until the signatory and the cheque number are given', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')

    await page.askToPrint()

    await waitFor(() =>
      expect(page.errors()).toEqual([
        'Le signataire est obligatoire',
        'Le n° de chèque est obligatoire',
      ]),
    )
    expect(printedDocuments()).toBe(0)
    expect(page.nextChequeButton()).toBeDisabled()
  })

  // Blank spaces are not a name.
  it('refuses a signatory made of spaces only', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.typeSignatory('   ')
    await page.typeCheckId('1042')

    await page.askToPrint()

    await waitFor(() =>
      expect(page.errors()).toEqual(['Le signataire est obligatoire']),
    )
    expect(printedDocuments()).toBe(0)
  })

  // A cheque number is a whole number above zero: 0, letters or a decimal
  // number are refused like an empty field.
  it.each(['', '0', 'abc', '10.5', '10,5'])(
    'refuses « %s » as a cheque number',
    async (checkId) => {
      const page = await returnsIndividualsPage()
      await page.pickDeposit('Durand')
      await page.typeSignatory('Paul')
      await page.typeCheckId(checkId)

      await page.askToPrint()

      await waitFor(() =>
        expect(page.errors()).toEqual(['Le n° de chèque est obligatoire']),
      )
      expect(printedDocuments()).toBe(0)
      expect(page.nextChequeButton()).toBeDisabled()
    },
  )

  // What comes out of the printer is filled in on the bank's cheque form:
  // the amount in words and in figures, the payee, the place and the date.
  it('prints the amount in words and in figures, the seller, Rumilly and the date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const today = new Date('2026-10-02T18:30:00')
    vi.setSystemTime(today)
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })

    await page.printCheque()

    const cheque = await lastPrintedText()
    expect(cheque).toContain('cent soixante-dix-huit euros')
    expect(cheque).toContain('Camille Durand')
    expect(cheque).toContain('Rumilly')
    // The date is French, dd/mm/yyyy, whatever the computer's own locale,
    // and the figure box holds the amount with two decimals, no € sign.
    expect(cheque).toBe(
      'cent soixante-dix-huit euros Camille Durand 178,00 Rumilly 02/10/2026',
    )
  })

  // Cents too: 76,95 € written out in full on the cheque.
  it('prints an amount with cents', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Bon')
    await page.fillCheque({ signatory: 'Paul', checkId: '1043' })

    await page.printCheque()

    const cheque = await lastPrintedText()
    expect(cheque).toContain(
      'soixante-seize euros et quatre-vingt-quinze centimes',
    )
    expect(cheque).toContain('Jean Bon')
    // The figures use a decimal comma: "76,95", not "76.95".
    expect(cheque).toContain(' 76,95 ')
    expect(cheque).not.toContain('76.95')
  })

  // The cheque printed was Camille Durand's: once the volunteer switches to
  // Jean Bon's fiche, that fiche's own cheque must be printed before
  // validating.
  it('asks for a new print after switching to another fiche', async () => {
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()
    expect(page.nextChequeButton()).toBeEnabled()

    await page.pickDeposit('Bon')

    await waitFor(() => expect(page.depositRow()?.[0]).toBe('13'))
    expect(page.printReminderShown()).toBe(true)
    expect(page.printButtonLabel()).toBe('Imprimer le chèque')
    expect(page.nextChequeButton()).toBeDisabled()

    // Current behaviour, pinned until it is decided: coming back to
    // Durand's fiche, whose cheque was the last printed, lets it be
    // validated again without a new print.
    await page.pickDeposit('Durand')
    await waitFor(() => expect(page.depositRow()?.[0]).toBe('12'))
    expect(page.printReminderShown()).toBe(false)
    expect(page.nextChequeButton()).toBeEnabled()
  })

  // The evening review lists who signed which cheque, from which desk and
  // when; the next cheque of the book is proposed for the next seller.
  it('records the signatory, the cheque number, the desk and the time of the return', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    // 16:58 in Rumilly
    vi.setSystemTime(new Date('2026-10-02T14:58:00Z'))
    const page = await returnsIndividualsPage()
    expect(page.workstationText()).toBe('1000')
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()

    await page.nextCheque()

    await waitFor(() => expect(page.depositRow()).toBeNull())
    expect(page.checkIdText()).toBe('1043')

    const checks = await returnsChecksPage()
    await waitFor(() => expect(checks.seller(12)).toBe('Durand Camille'))
    // [Identifiant, Déposant, Poste retour, Numéro du chèque, Signature,
    //  Heure retour, Montant du chèque]
    // « Heure retour » is the time on the wall in Rumilly (16:58), not UTC.
    expect(checks.rowText(12)).toEqual([
      '12',
      'Durand Camille',
      '1000',
      '1042',
      'Paul',
      '02/10/2026 16:58:00',
      '178,00 €',
    ])
  })

  // The other computers (and the server) learn that the fiche is paid:
  // the cheque desk of another PC must stop offering it.
  it('sends the paid fiche to the other computers', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-02T14:58:00Z'))
    const page = await returnsIndividualsPage()
    await page.pickDeposit('Durand')
    await page.fillCheque({ signatory: 'Paul', checkId: '1042' })
    await page.printCheque()

    await page.nextCheque()

    await waitFor(() => expect(page.depositRow()).toBeNull())
    const durand = (await local.deposits()).find(
      (deposit) => deposit.depositIndex === 12,
    )
    const outbox = await local.outbox()
    expect(
      outbox.map((op) => [op.collection, op.operation, op.recordId]),
    ).toEqual([['deposits', 'update', durand?.id]])
    expect(outbox[0].data).toEqual({
      signatory: 'Paul',
      checkId: '1042',
      collectedAt: new Date('2026-10-02T14:58:00Z'),
      collectWorkstationId: 1000,
    })
  })
})
