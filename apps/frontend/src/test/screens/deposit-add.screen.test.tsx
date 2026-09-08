import { beforeEach, describe, expect, it } from 'vitest'
import {
  YEAR,
  givenPredeposit,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import {
  openScreen,
  printSummary,
  screen,
  signedInAs,
  waitFor,
} from '@/test/screen.tsx'

// The same story as scenarios/deposit-from-predeposit.test.ts, but played
// on the real screen: the volunteer on cash register 1000 picks the
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
    const { user } = await openScreen('/deposits/add')
    await screen.findByRole('heading', { name: 'Enregistrer des articles' })

    // Pick the predeposit and validate it
    await user.click(screen.getByText(/Rechercher une fiche/))
    await user.click(
      await screen.findByRole('option', { name: 'Martin Lucie' }),
    )
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    // The seller block shows the predeposit's seller
    await waitFor(() =>
      expect(screen.getByLabelText('Nom')).toHaveValue('Martin'),
    )
    expect(screen.getByLabelText('Prénom')).toHaveValue('Lucie')
    expect(screen.getByLabelText('Téléphone')).toHaveValue('0611111111')
    expect(screen.getByDisplayValue('Chambéry')).toBeInTheDocument()

    // Both articles are there, with their codes under the new deposit number
    expect(screen.getByDisplayValue('1001 A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1001 B')).toBeInTheDocument()
    expect(screen.getByText('Salomon')).toBeInTheDocument()
    expect(screen.getByText('Nordica')).toBeInTheDocument()

    // Contribution status, then print the summary, then save
    await user.click(screen.getByText('Statut').closest('button')!)
    await user.click(await screen.findByRole('option', { name: 'A payer' }))
    await printSummary(user)
    await user.click(
      screen.getByRole('button', { name: 'Valider et enregistrer le dépôt' }),
    )

    await screen.findByText('Dépôt 1001 enregistré')

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
})
