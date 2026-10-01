import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { returnsProsPage } from '@/test/pages/returns-pros.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// At the end of the sale, PERRILLAT (fiche 4) comes back for the two pairs
// of skis nobody bought. ALLOSKI (fiche 3) is the other professional.
describe('Screen: return the unsold articles to a professional', () => {
  let perrillatCodes: Array<string>

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
    await givenDeposit(
      {
        depositIndex: 3,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Allo', firstName: 'Ski' },
      },
      [{ price: 200 }],
    )
    const perrillat = await givenDeposit(
      {
        depositIndex: 4,
        type: 'PRO',
        contributionStatus: 'PRO',
        seller: { lastName: 'Perrillat', firstName: 'Jean' },
      },
      [{ price: 90 }, { price: 70 }],
    )
    perrillatCodes = perrillat.articles.map((a) => a.code)
  })

  it('opens the professional picked in the list, then scans their articles out', async () => {
    const page = await returnsProsPage()
    expect(page.isScanOpen()).toBe(false)

    await page.pickPro('Perrillat')

    expect(page.selectedPro()).toBe('4 - Jean Perrillat')
    expect(page.returnedCount()).toBe(0)
    expect(page.toReturnCount()).toBe(2)

    await page.scan(perrillatCodes[0])

    await waitFor(() => expect(page.returnedCount()).toBe(1))
    expect(page.toReturnCount()).toBe(1)
    const returned = (await local.articles()).filter(
      (a) => a.status === 'RETURNED',
    )
    expect(returned.map((a) => a.code)).toEqual([perrillatCodes[0]])
  })

  it('switches to another professional picked in the list', async () => {
    const page = await returnsProsPage()

    await page.pickPro('Perrillat')
    expect(page.toReturnCount()).toBe(2)

    await page.pickPro('Allo')
    expect(page.selectedPro()).toBe('3 - Ski Allo')
    await waitFor(() => expect(page.toReturnCount()).toBe(1))
  })
})
