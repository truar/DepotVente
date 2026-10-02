import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/test/screen.tsx'
import {
  givenDeposit,
  givenLocalWritesFail,
  givenPredeposit,
  givenWorkstation,
} from '@/test/harness.ts'
import { articleEditPage } from '@/test/pages/article-edit.page.ts'
import { depositAddPage } from '@/test/pages/deposit-add.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { screen, signedInAs, within } from '@/test/screen.tsx'

// The blocking alert the volunteer must acknowledge, as for a refused scan:
// read it, then close it with « OK ».
async function acknowledgeAlert(user: User) {
  const box = await screen.findByRole('alertdialog')
  const alert = {
    title: within(box).getByRole('heading').textContent.trim(),
    message: within(box).getByRole('paragraph').textContent.trim(),
  }
  await user.click(within(box).getByRole('button', { name: 'OK' }))
  return alert
}

const failedSave = {
  title: 'Enregistrement impossible',
  message:
    "L'enregistrement a échoué sur ce poste : rien n'a été enregistré. " +
    'Réessayez ; si cela recommence, prévenez un responsable.',
}

// The disk of this computer refuses to write (full, or the browser evicted
// the site's data). Nothing can be saved here: the volunteer is stopped by
// an alert, and finds what they typed still on screen to try again.
describe('Screen: saving while this computer cannot write', () => {
  let repair: () => void

  beforeEach(() => {
    signedInAs()
  })

  afterEach(() => {
    repair()
  })

  it('stops the volunteer when an article correction cannot be saved', async () => {
    await givenWorkstation(1000)
    const { articles } = await givenDeposit()
    const page = await articleEditPage()
    await page.search(articles[0].code, '12 A')
    repair = givenLocalWritesFail()

    await page.setPrice('95')
    await page.validate()

    expect(await acknowledgeAlert(page.user)).toEqual(failedSave)
    expect(screen.queryByText(/mis à jour/)).toBeNull()
    expect(page.price()).toBe('95')
  })

  it('stops the volunteer when a sale cannot be saved', async () => {
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 50 }])
    const page = await salesAddPage()
    await page.scan(articles[0].code)
    await page.fillBuyer({
      lastName: 'Petit',
      firstName: 'Anna',
      phoneNumber: '0633333333',
    })
    await page.pay({ cash: 50 })
    repair = givenLocalWritesFail()

    await page.save()

    expect(await acknowledgeAlert(page.user)).toEqual(failedSave)
    expect(screen.queryByText(/Vente 2001 enregistrée/)).toBeNull()
    expect(page.scannedCodes()).toHaveLength(1)
  })

  it('stops the volunteer when a deposit cannot be saved', async () => {
    await givenWorkstation(1000)
    await givenPredeposit()
    const page = await depositAddPage()
    await page.loadPredeposit('Martin Lucie')
    await page.chooseStatus('Payé')
    await page.printSummary()
    repair = givenLocalWritesFail()

    await page.save()

    expect(await acknowledgeAlert(page.user)).toEqual(failedSave)
    expect(screen.queryByText(/Dépôt 1001 enregistré/)).toBeNull()
    expect(page.seller().lastName).toBe('Martin')
  })
})
