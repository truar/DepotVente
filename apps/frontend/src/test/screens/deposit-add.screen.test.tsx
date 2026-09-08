import { beforeEach, describe, expect, it } from 'vitest'
import {
  YEAR,
  givenPredeposit,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { depositAddPage } from '@/test/pages/deposit-add.page.ts'
import { signedInAs } from '@/test/screen.tsx'

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
})
