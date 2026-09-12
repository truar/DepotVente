import { beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { proReceptionPage } from '@/test/pages/pro-reception.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import {
  openScreen,
  screen,
  signedInAs,
  waitFor,
  within,
} from '@/test/screen.tsx'

// Article codes are stored with upper-case letters. A scanner that reads a
// label in lower case — or a volunteer typing a code with caps lock off —
// must still land on the article: every field that takes an article code
// upper-cases what is entered.
describe('Screen: an article code entered in lower case', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
  })

  it('sells the article all the same', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const page = await salesAddPage()

    await page.scan(articles[0].code.toLowerCase())

    expect(page.scannedCodes()).toEqual([`${YEAR} 12A`])
    expect(page.total()).toBe(120)
  })

  it('checks the article in at the pro reception all the same', async () => {
    const { articles } = await givenDeposit(
      {
        depositIndex: 3,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Allo', firstName: 'Ski' },
      },
      [{ price: 200, status: 'RECEPTION_PENDING' }],
    )
    const page = await proReceptionPage()
    await page.pickPro('Allo')

    await page.scan(articles[0].code.toLowerCase())

    await waitFor(async () =>
      expect((await local.articles())[0].status).toBe('RECEPTION_OK'),
    )
  })

  it('returns the article to the professional all the same', async () => {
    const { articles } = await givenDeposit(
      {
        depositIndex: 4,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Perrillat', firstName: 'Jean' },
      },
      [{ price: 90, status: 'RECEPTION_OK' }],
    )
    const { user } = await openScreen('/returns/pros')
    await screen.findByRole('heading', {
      name: 'Retourner les articles des pros',
    })
    await user.click(screen.getByText(/Rechercher un professionnel/))
    const popover = await screen.findByRole('dialog')
    await user.type(within(popover).getByRole('combobox'), 'Perrillat')
    await user.click(await screen.findByRole('option', { name: /Perrillat/i }))
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    const input = await waitFor(() => {
      const field = document.querySelector<HTMLInputElement>('#articleCode')
      if (!field) throw new Error('No scan input on the screen')
      return field
    })
    await user.type(input, `${articles[0].code.toLowerCase()}{Enter}`)

    await waitFor(async () =>
      expect((await local.articles())[0].status).toBe('RETURNED'),
    )
  })

  it('opens the article for edition all the same', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const { user } = await openScreen('/deposits/articles')
    await screen.findByRole('heading', { name: 'Modifier un article' })

    const search = screen.getByPlaceholderText('Ex: 2026 1001A')
    await user.type(search, `${articles[0].code.toLowerCase()}{Enter}`)

    // The edit form labels the article by its short code, "12 A".
    const shortCode = `${articles[0].depositIndex} ${articles[0].identificationLetter}`
    expect(await screen.findByDisplayValue(shortCode)).toBeVisible()
    expect(screen.queryByText('Aucun article')).toBeNull()
  })
})
