import { beforeEach, describe, expect, it } from 'vitest'
import {
  YEAR,
  givenPredeposit,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { depositAddPage } from '@/test/pages/deposit-add.page.ts'
import { lastPrintedText } from '@/test/printed.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// Played on the real screen: the volunteer on cash register 1000 picks a
// predeposit in the combobox, validates it, sees the form filled, chooses
// the contribution status, prints the summary and saves.
describe('Screen: register a deposit from a predeposit', () => {
  let predepositId: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    predepositId = (
      await givenPredeposit({}, [
        {},
        {
          category: 'Chaussures',
          brand: 'Nordica',
          model: 'Speedmachine',
          size: '27.5',
          price: 80,
        },
      ])
    ).id
  })

  it('fills the form from the predeposit and saves the deposit', async () => {
    const page = await depositAddPage()

    await page.pickPredeposit('Martin Lucie')
    await page.validatePredeposit()

    expect(page.seller()).toEqual({
      lastName: 'Martin',
      firstName: 'Lucie',
      phoneNumber: '0611111111',
    })
    expect(page.hasDisplayValue('Chambéry')).toBe(true)
    expect(page.articleCodes()).toEqual(['1001 A', '1001 B'])
    expect(page.hasText('Salomon')).toBe(true)
    expect(page.hasText('Nordica')).toBe(true)

    await page.chooseStatus('A payer')
    await page.printSummary()

    // The sheet is the seller's receipt, printed in two copies.
    const sheet = await lastPrintedText()
    expect(sheet).toContain('Fiche N° 1001')
    expect(sheet).toContain('MARTIN Lucie')
    expect(sheet).toContain('Chambéry')
    expect(sheet).toContain('Nb articles : 2')
    expect(sheet).toContain('Cotisations : 2,00 € (A Payer)')
    expect(sheet).toContain('1001 A Skis Salomon Alpin bleu 165 S/Max 150,00 €')
    expect(sheet).toContain(
      '1001 B Chaussures Nordica Alpin bleu 27.5 Speedmachine 80,00 €',
    )
    expect(sheet.match(/Fiche N° 1001/g)).toHaveLength(2)
    // The seller takes this one home, so it carries the club announcements.
    // The professionals' pending list does not.
    expect(sheet).toContain('Information:')
    expect(sheet).toContain('Assembléé générale')

    await page.save()
    await page.savedToast(1001)

    const [contact] = await local.contacts()
    const [deposit] = await local.deposits()
    const [predeposit] = await local.predeposits()
    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(contact).toMatchObject({
      lastName: 'Martin',
      firstName: 'Lucie',
      city: 'Chambéry',
    })
    expect(deposit).toMatchObject({
      sellerId: contact.id,
      depositIndex: 1001,
      incrementStart: 1000,
      contributionStatus: 'A_PAYER',
      contributionAmount: 2,
    })
    expect(articles.map((a) => [a.code, a.brand, a.price, a.status])).toEqual([
      [`${YEAR} 1001A`, 'Salomon', 150, 'RECEPTION_OK'],
      [`${YEAR} 1001B`, 'Nordica', 80, 'RECEPTION_OK'],
    ])
    expect(predeposit).toMatchObject({
      id: predepositId,
      depositId: deposit.id,
    })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([
      ['contacts', 'create'],
      ['deposits', 'create'],
      ['articles', 'create'],
      ['articles', 'create'],
      ['predeposits', 'update'],
    ])
  })

  // Current behaviour, pinned: validating does not clear the combobox, so
  // the volunteer can see which predeposit the form came from while filling
  // it. The selection clears with the form once the deposit is saved, and
  // the predeposit, now used, is no longer offered.
  it('keeps the predeposit selected until the deposit is saved, then clears it and stops offering it', async () => {
    const page = await depositAddPage()

    await page.pickPredeposit('Martin Lucie')
    expect(page.selectedPredeposit()).toBe('Martin Lucie')

    await page.validatePredeposit()
    expect(page.selectedPredeposit()).toBe('Martin Lucie')

    await page.chooseStatus('A payer')
    await page.printSummary()
    await page.save()
    await page.savedToast(1001)

    expect(page.selectedPredeposit()).toBeNull()
    expect(page.seller().lastName).toBe('')
    expect(await page.offeredPredeposits()).toEqual([])
  })

  // Loading a fiche overwrites everything already on the form, so the
  // screen asks before swapping one loaded fiche for another.
  it('asks before replacing the fiche already loaded in the form', async () => {
    await givenPredeposit({
      predepositIndex: 8,
      sellerLastName: 'Durand',
      sellerFirstName: 'Sophie',
    })
    const page = await depositAddPage()

    await page.pickPredeposit('Martin Lucie')
    await page.validatePredeposit()
    expect(page.seller().lastName).toBe('Martin')

    await page.pickPredeposit('Durand Sophie')
    await page.clickValidatePredeposit()
    let dialog = await page.dialog()
    expect(dialog.title).toBe(
      'Etes vous sur de vouloir changer de fiche de pré-dépot ?',
    )
    await dialog.decline()
    expect(page.seller().lastName).toBe('Martin')

    await page.clickValidatePredeposit()
    dialog = await page.dialog()
    await dialog.confirm()
    await waitFor(() => expect(page.seller().lastName).toBe('Durand'))
    expect(page.seller().firstName).toBe('Sophie')
  })
})

// The most common path of the day: a seller walks in with no predeposit,
// the volunteer types the seller and the articles.
describe('Screen: register a walk-in deposit typed by hand', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('numbers the articles, computes the contribution, saves, and moves on to the next deposit number', async () => {
    const page = await depositAddPage()

    await page.fillSeller({
      lastName: 'Bernard',
      firstName: 'Paul',
      phoneNumber: '0622222222',
      city: 'Annecy',
    })
    await page.addArticle()
    await page.fillArticle(0, {
      category: 'Skis',
      brand: 'Rossignol',
      discipline: 'Alpin',
      color: 'Rouge',
      size: '170',
      model: 'Hero',
      price: '120',
    })
    await page.addArticle()
    await page.fillArticle(1, {
      category: 'Chaussures',
      brand: 'Nordica',
      discipline: 'Alpin',
      color: 'Noir',
      size: '27.5',
      price: '80',
    })

    expect(page.articleCodes()).toEqual(['1001 A', '1001 B'])
    expect(page.articleCount()).toBe(2)
    expect(page.contributionAmount()).toBe(2)

    await page.chooseStatus('Payé')
    await page.printSummary()
    await page.save()
    await page.savedToast(1001)

    const [contact] = await local.contacts()
    const [deposit] = await local.deposits()
    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(contact).toMatchObject({
      lastName: 'Bernard',
      firstName: 'Paul',
      phoneNumber: '0622222222',
      city: 'Annecy',
    })
    expect(deposit).toMatchObject({
      sellerId: contact.id,
      depositIndex: 1001,
      contributionStatus: 'PAYE',
      contributionAmount: 2,
    })
    expect(
      articles.map((a) => [
        a.code,
        a.category,
        a.brand,
        a.model,
        a.price,
        a.status,
      ]),
    ).toEqual([
      [`${YEAR} 1001A`, 'Skis', 'Rossignol', 'Hero', 120, 'RECEPTION_OK'],
      [`${YEAR} 1001B`, 'Chaussures', 'Nordica', '', 80, 'RECEPTION_OK'],
    ])
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([
      ['contacts', 'create'],
      ['deposits', 'create'],
      ['articles', 'create'],
      ['articles', 'create'],
    ])

    // The form is empty again and the next deposit takes the next number
    expect(page.seller().lastName).toBe('')
    await page.addArticle()
    expect(page.articleCodes()).toEqual(['1002 A'])
  })
})

// The printed sheet is the seller's receipt: no deposit without it.
describe('Screen: the deposit sheet must be printed before saving', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('refuses to save until the summary has been printed', async () => {
    const page = await depositAddPage()
    await page.fillSeller({
      lastName: 'Bernard',
      firstName: 'Paul',
      phoneNumber: '0622222222',
    })
    await page.addArticle()
    await page.fillArticle(0, {
      category: 'Skis',
      brand: 'Rossignol',
      discipline: 'Alpin',
      color: 'Rouge',
      price: '120',
    })
    await page.chooseStatus('Payé')

    await page.save()

    expect(page.errors()).toEqual([
      "Merci d'imprimer la fiche dépôt avant de valider",
    ])
    expect(await local.deposits()).toEqual([])
    expect(await local.outbox()).toEqual([])

    await page.printSummary()
    await page.save()
    await page.savedToast(1001)

    expect(await local.deposits()).toHaveLength(1)
  })
})

// The contribution is 2 € per started block of ten articles, and follows
// the count as rows are removed or brought back. Deleted rows do not
// count.
describe('Screen: the contribution follows the number of articles', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenPredeposit(
      {},
      Array.from({ length: 11 }, () => ({})),
    )
  })

  it('charges 4 € for eleven articles, 2 € once one is removed, 4 € again when it is restored', async () => {
    const page = await depositAddPage()
    await page.pickPredeposit('Martin Lucie')
    await page.validatePredeposit()

    expect(page.articleCount()).toBe(11)
    expect(page.contributionAmount()).toBe(4)

    // Articles from a predeposit are soft-deleted: the row stays, greyed
    // out, and keeps its letter.
    await page.removeArticle(10)
    expect(page.articleCount()).toBe(10)
    expect(page.contributionAmount()).toBe(2)
    expect(page.articleCodes()).toHaveLength(11)

    await page.restoreArticle(10)
    expect(page.articleCount()).toBe(11)
    expect(page.contributionAmount()).toBe(4)
  })
})

const validArticle = {
  category: 'Skis',
  brand: 'Rossignol',
  discipline: 'Alpin',
  color: 'Rouge',
  price: '120',
}

describe('Screen: required fields block the save', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('points out missing fields until they are filled, and writes nothing meanwhile', async () => {
    const page = await depositAddPage()
    // No last name, and an article without a price
    await page.fillSeller({
      lastName: '',
      firstName: 'Paul',
      phoneNumber: '0622222222',
    })
    await page.addArticle()
    await page.fillArticle(0, { ...validArticle, price: '0' })
    await page.chooseStatus('Payé')

    await page.save()
    expect(page.errors()).toEqual([
      'Merci de compléter les champs obligatoires',
    ])
    expect(await local.deposits()).toEqual([])

    await page.fillSeller({
      lastName: 'Bernard',
      firstName: '',
      phoneNumber: '',
    })
    await page.save()
    expect(page.errors()).toEqual([
      'Merci de compléter les champs obligatoires',
    ])

    await page.fillArticle(0, { price: '120' })
    await page.printSummary()
    await page.save()
    await page.savedToast(1001)
    expect(await local.deposits()).toHaveLength(1)
  })
})

describe('Screen: article rows', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  // Half-filled rows would otherwise pile up.
  it('does not add a second row while the first one is incomplete', async () => {
    const page = await depositAddPage()
    await page.addArticle()
    await page.addArticle()
    expect(page.articleCodes()).toEqual(['1001 A'])

    await page.fillArticle(0, validArticle)
    await page.addArticle()
    expect(page.articleCodes()).toEqual(['1001 A', '1001 B'])
  })

  // A letter, once assigned, is never reused: it may already be on a label.
  // Only the last row can disappear; earlier rows are struck through and
  // keep their letter.
  it('removes only the last row outright, strikes through earlier ones', async () => {
    const page = await depositAddPage()
    await page.addArticle()
    await page.fillArticle(0, validArticle)
    await page.addArticle()
    expect(page.articleCodes()).toEqual(['1001 A', '1001 B'])

    await page.removeArticle(0)
    expect(page.articleCodes()).toEqual(['1001 A', '1001 B'])
    expect(page.isArticleDeleted(0)).toBe(true)
    expect(page.articleCount()).toBe(1)

    await page.removeArticle(1)
    expect(page.articleCodes()).toEqual(['1001 A'])
    expect(page.articleCount()).toBe(0)
    expect(page.contributionAmount()).toBe(0)
  })

  // Rows that came from a predeposit are never removed outright: the seller
  // declared them, so the deposit keeps a trace of what was refused.
  it('saves a struck-through predeposit article as DELETED', async () => {
    await givenPredeposit({}, [
      {},
      { category: 'Chaussures', brand: 'Nordica' },
    ])
    const page = await depositAddPage()
    await page.pickPredeposit('Martin Lucie')
    await page.validatePredeposit()

    await page.removeArticle(1)
    expect(page.isArticleDeleted(1)).toBe(true)
    expect(page.articleCount()).toBe(1)
    expect(page.contributionAmount()).toBe(2)

    await page.chooseStatus('Payé')
    await page.printSummary()
    await page.save()
    await page.savedToast(1001)

    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(articles.map((a) => [a.code, a.status])).toEqual([
      [`${YEAR} 1001A`, 'RECEPTION_OK'],
      [`${YEAR} 1001B`, 'DELETED'],
    ])
    expect((await local.deposits())[0]).toMatchObject({ contributionAmount: 2 })
  })
})

describe('Screen: leaving a half-typed deposit', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenPredeposit()
  })

  it('"Annuler" asks first, then wipes the form and the predeposit selection', async () => {
    const page = await depositAddPage()
    await page.pickPredeposit('Martin Lucie')
    await page.validatePredeposit()

    await page.cancel()
    let dialog = await page.dialog()
    expect(dialog.title).toBe('Etes vous sur de vouloir annuler ?')
    await dialog.decline()
    expect(page.seller().lastName).toBe('Martin')
    expect(page.selectedPredeposit()).toBe('Martin Lucie')

    await page.cancel()
    dialog = await page.dialog()
    await dialog.confirm()
    expect(page.seller().lastName).toBe('')
    expect(page.articleCodes()).toEqual([])
    expect(page.selectedPredeposit()).toBeNull()
    expect(await local.deposits()).toEqual([])
    expect(await local.outbox()).toEqual([])
  })

  it('"Retour au menu" asks first, then leaves without saving', async () => {
    const page = await depositAddPage()
    await page.fillSeller({
      lastName: 'Bernard',
      firstName: 'Paul',
      phoneNumber: '0622222222',
    })

    await page.backToMenu()
    let dialog = await page.dialog()
    expect(dialog.title).toBe('Etes vous sur de vouloir quitter cette page ?')
    await dialog.decline()
    expect(page.pathname()).toBe('/deposits/add')
    expect(page.seller().lastName).toBe('Bernard')

    await page.backToMenu()
    dialog = await page.dialog()
    await dialog.confirm()
    await waitFor(() => expect(page.pathname()).toBe('/deposits'))
    expect(await local.deposits()).toEqual([])
    expect(await local.outbox()).toEqual([])
  })
})
