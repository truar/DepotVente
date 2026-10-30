import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { depositsListingPage } from '@/test/pages/deposits-listing.page.ts'
import { signedInAs } from '@/test/screen.tsx'

// Played on the real screen: "Gérer les fiches des dépôts", where a
// volunteer looks back at the deposits registered so far.
describe('Screen: the deposits list', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  // DURAND (fiche 12) left three articles: one still on the shelf, one
  // nowhere to be found, one struck off at the desk. Reprinted from the
  // list, the deposit sheet counts only the first and says which one is
  // absent.
  it('reprints the deposit sheet with the absent article marked, out of the count', async () => {
    await givenDeposit({ depositIndex: 12 }, [
      { price: 120 },
      { price: 30, status: 'ABSENT' },
      { price: 20, status: 'DELETED' },
    ])
    const page = await depositsListingPage()
    await page.waitForDeposits(1)

    const sheet = await page.printDepositSheet(12)

    expect(sheet).toContain('Nb articles : 1')
    expect(sheet).toMatch(/30,00 € Absent/)
    expect(sheet.match(/Absent/g)).toHaveLength(1)
  })
})
