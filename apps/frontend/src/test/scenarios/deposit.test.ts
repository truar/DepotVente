import { beforeEach, describe, expect, it } from 'vitest'
import {
  YEAR,
  aDepositForm,
  app,
  givenWorkstation,
  local,
} from '@/test/harness.ts'

// The simplest deposit: a seller nobody has seen before brings one pair of
// skis, registered on cash register 3 as deposit n°12.
describe('Deposit of one ski by a new seller', () => {
  const form = aDepositForm()

  beforeEach(async () => {
    await givenWorkstation(3)
    await app.createDeposit(form)
  })

  it('records the seller as a new contact', async () => {
    const contacts = await local.contacts()

    expect(contacts).toHaveLength(1)
    expect(contacts[0]).toMatchObject({
      lastName: 'Durand',
      firstName: 'Camille',
      phoneNumber: '0600000000',
      city: 'Grenoble',
      deletedAt: null,
    })
  })

  it('records the deposit against that contact and this cash register', async () => {
    const [contact] = await local.contacts()
    const deposits = await local.deposits()

    expect(deposits).toHaveLength(1)
    expect(deposits[0]).toMatchObject({
      type: 'PARTICULIER',
      sellerId: contact.id,
      depositIndex: 12,
      incrementStart: 3,
      dropWorkstationId: 3,
      contributionStatus: 'PAYE',
      contributionAmount: 2,
      deletedAt: null,
    })
  })

  it('records the ski as received, labelled with the deposit code', async () => {
    const [deposit] = await local.deposits()
    const articles = await local.articles()

    expect(articles).toHaveLength(1)
    expect(articles[0]).toMatchObject({
      depositId: deposit.id,
      code: `${YEAR} 12A`,
      identificationLetter: 'A',
      articleIndex: 0,
      depositIndex: 12,
      status: 'RECEPTION_OK',
      category: 'Skis',
      discipline: 'Alpin',
      brand: 'Rossignol',
      model: 'Hero',
      size: '170',
      color: 'rouge',
      price: 120,
      saleId: null,
      deletedAt: null,
    })
  })

  it('queues the writes for the server in dependency order: contact, deposit, article', async () => {
    const [contact] = await local.contacts()
    const [deposit] = await local.deposits()
    const [article] = await local.articles()

    const outbox = await local.outbox()

    expect(
      outbox.map((op) => [op.collection, op.operation, op.recordId]),
    ).toEqual([
      ['contacts', 'create', contact.id],
      ['deposits', 'create', deposit.id],
      ['articles', 'create', article.id],
    ])
    // The server gets exactly the rows this computer stored.
    expect(outbox.map((op) => op.data)).toEqual([contact, deposit, article])
    expect(outbox.every((op) => op.status === 'pending')).toBe(true)
  })
})
