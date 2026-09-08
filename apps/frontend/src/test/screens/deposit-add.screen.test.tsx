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

type User = Awaited<ReturnType<typeof openScreen>>['user']

const PREDEPOSIT_PLACEHOLDER = /Rechercher une fiche/

// The predeposit combobox, then its "Valider" button next to it.
async function pickPredeposit(user: User, name: string) {
  await user.click(screen.getByText(PREDEPOSIT_PLACEHOLDER))
  await user.click(await screen.findByRole('option', { name }))
}
async function validatePredeposit(user: User) {
  await user.click(screen.getByRole('button', { name: 'Valider' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Nom')).toHaveValue('Martin'),
  )
}
async function chooseStatusPrintAndSave(user: User, status: string) {
  await user.click(screen.getByText('Statut').closest('button')!)
  await user.click(await screen.findByRole('option', { name: status }))
  await printSummary(user)
  await user.click(
    screen.getByRole('button', { name: 'Valider et enregistrer le dépôt' }),
  )
}

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

    await pickPredeposit(user, 'Martin Lucie')
    await validatePredeposit(user)

    // The seller block shows the predeposit's seller
    expect(screen.getByLabelText('Prénom')).toHaveValue('Lucie')
    expect(screen.getByLabelText('Téléphone')).toHaveValue('0611111111')
    expect(screen.getByDisplayValue('Chambéry')).toBeInTheDocument()

    // Both articles are there, with their codes under the new deposit number
    expect(screen.getByDisplayValue('1001 A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1001 B')).toBeInTheDocument()
    expect(screen.getByText('Salomon')).toBeInTheDocument()
    expect(screen.getByText('Nordica')).toBeInTheDocument()

    await chooseStatusPrintAndSave(user, 'A payer')
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

  // Current behaviour, pinned: validating does not clear the combobox, so
  // the volunteer can see which predeposit the form came from while filling
  // it. The selection clears with the form once the deposit is saved, and
  // the predeposit, now used, is no longer offered.
  it('keeps the predeposit selected until the deposit is saved, then clears it and stops offering it', async () => {
    const { user } = await openScreen('/deposits/add')
    await screen.findByRole('heading', { name: 'Enregistrer des articles' })

    await pickPredeposit(user, 'Martin Lucie')
    expect(screen.getByText('Martin Lucie')).toBeInTheDocument()
    expect(screen.queryByText(PREDEPOSIT_PLACEHOLDER)).not.toBeInTheDocument()

    await validatePredeposit(user)
    expect(screen.getByText('Martin Lucie')).toBeInTheDocument()

    await chooseStatusPrintAndSave(user, 'A payer')
    await screen.findByText('Dépôt 1001 enregistré')

    // Combobox back to its placeholder, form empty, ready for the next seller
    expect(screen.getByText(PREDEPOSIT_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.queryByText('Martin Lucie')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toHaveValue('')

    // The used predeposit is gone from the list
    await user.click(screen.getByText(PREDEPOSIT_PLACEHOLDER))
    await screen.findByText('Vide')
    expect(
      screen.queryByRole('option', { name: 'Martin Lucie' }),
    ).not.toBeInTheDocument()
  })
})
