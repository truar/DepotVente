import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { articleEditPage } from '@/test/pages/article-edit.page.ts'
import { depositsListingPage } from '@/test/pages/deposits-listing.page.ts'
import {
  DYMO_SERVICE,
  givenLabelPrinter,
  noDymoPrinter,
  printedLabels,
} from '@/test/labels.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// A label went out with the wrong price, or the seller remembers the serial
// number engraved under the binding: a volunteer of the deposit desk opens
// the article from the articles list, by its code, and corrects it. The
// correction is saved on this computer first, then queued for the server so
// the tills see it.
describe('Screen: correcting an article', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('saves the corrections, tells the volunteer and goes back to the list', async () => {
    const { articles } = await givenDeposit({}, [
      { price: 120, model: 'Hero', serialNumber: null },
    ])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setPrice('95')
    await page.setDescription('Hero Elite, fixations Look')
    // Copied from the ski with a stray space on each side.
    await page.setSerialNumber('  SN-42  ')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    await page.isOnList()
    expect(page.pathname()).toBe('/deposits/articles')
    expect(page.searchField()).toHaveFocus()

    // Searched again, the article shows the correction: the serial number
    // trimmed, the price as typed.
    await page.search(skis.code, '12 A')
    expect(page.price()).toBe('95')
    expect(page.description()).toBe('Hero Elite, fixations Look')
    expect(page.serialNumber()).toBe('SN-42')

    // Queued for the server: one update of the article, carrying every
    // field of the form (not only those that changed).
    const outbox = await local.outbox()
    expect(outbox).toHaveLength(1)
    expect(outbox[0]).toMatchObject({
      collection: 'articles',
      operation: 'update',
      recordId: skis.id,
      status: 'pending',
      data: {
        price: 95,
        discipline: 'Alpin',
        brand: 'Rossignol',
        category: 'Skis',
        size: '170',
        color: 'rouge',
        model: 'Hero Elite, fixations Look',
        serialNumber: 'SN-42',
        status: 'RECEPTION_OK',
        updatedAt: expect.any(Date),
      },
    })
  })

  // Cancelling drops what was typed and goes back to the list, as a save
  // does.
  it('cancels the corrections and goes back to the list', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setPrice('95')
    await page.cancel()

    await page.isOnList()
    expect(page.pathname()).toBe('/deposits/articles')
    expect(page.searchField()).toHaveFocus()
    expect(await local.outbox()).toHaveLength(0)

    await page.search(skis.code, '12 A')
    expect(page.price()).toBe('120')
  })

  // The cents come after a comma, the French way, or after a point: both
  // read the same price.
  it.each(['95.50', '95,50'])(
    'saves a price typed %s to the cent',
    async (typed) => {
      const { articles } = await givenDeposit({}, [{ price: 120 }])
      const [skis] = articles
      const page = await articleEditPage()
      await page.search(skis.code, '12 A')

      await page.setPrice(typed)
      await page.validate()
      await page.lastToast(`Article ${skis.code} mis à jour`)

      const saved = (await local.articles()).find((a) => a.id === skis.id)
      expect(saved?.price).toBe(95.5)
    },
  )

  // Back to the list while an article is open: the volunteer is asked
  // first; saying no keeps the article, and what was typed on it.
  it('asks before leaving the article for the list', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')
    await page.setPrice('110')

    let question = await page.backToList()
    expect(question.title).toBe(
      'Etes vous sur de vouloir quitter cette page\u00a0?',
    )
    await question.decline()
    expect(page.price()).toBe('110')

    question = await page.backToList()
    await question.confirm()
    await page.isOnList()
    expect(await local.outbox()).toHaveLength(0)
  })

  // The label of the article opened, as the form shows it: reprinted after
  // a price correction.
  it('prints the label of the article as corrected', async () => {
    givenLabelPrinter()
    const { articles } = await givenDeposit({}, [
      { price: 120, serialNumber: 'SN-42' },
    ])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setPrice('95')
    await page.printLabel()

    await waitFor(() =>
      expect(printedLabels()).toEqual([
        {
          shortCode: '12 A',
          code: skis.code,
          category: 'Skis',
          description: 'Hero',
          brand: 'Rossignol',
          color: 'rouge',
          size: '170',
          price: '95 €',
          serialNumber: 'SN-42',
        },
      ]),
    )
  })

  // Until now, nothing happened at all when no printer answered.
  it('tells the volunteer when no label printer is found', async () => {
    givenLabelPrinter({ connected: false })
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const page = await articleEditPage()
    await page.search(articles[0].code, '12 A')

    await page.printLabel()

    const alert = await page.alert()
    expect(alert.message).toBe(noDymoPrinter)
    expect(alert.link).toBe(DYMO_SERVICE)
    await alert.dismiss()
    expect(printedLabels()).toEqual([])
  })

  // A serial number typed on the wrong article is wiped out: searched again,
  // the article shows none, and the server is sent no serial number at all
  // rather than an empty one.
  it('stores no serial number when the field is emptied', async () => {
    const { articles } = await givenDeposit({}, [{ serialNumber: 'SN-OLD' }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setSerialNumber('')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    const again = await articleEditPage()
    await again.search(skis.code, '12 A')
    expect(again.serialNumber()).toBe('')
    const [update] = await local.outbox()
    expect(update.data).toMatchObject({ serialNumber: null })
  })

  // The color is not required here: a volunteer who cannot tell it, or
  // finds it wrong, leaves it empty and the correction is still saved.
  it('saves the article with no color when the field is emptied', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setColor('')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    const again = await articleEditPage()
    await again.search(skis.code, '12 A')
    expect(again.color()).toBe('')
    const [update] = await local.outbox()
    expect(update.data).toMatchObject({ color: '' })
  })

  // An article nowhere to be found is marked absent, no reason needed: it
  // leaves the deposit like a deleted one, out of the fiche's count and
  // amount on the deposits list.
  it('marks an article absent, which leaves the deposit counts', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }, { price: 80 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setStatus('Absent')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    const again = await articleEditPage()
    await again.search(skis.code, '12 A')
    expect(again.status()).toBe('Absent')
    const [update] = await local.outbox()
    expect(update.data).toMatchObject({ status: 'ABSENT' })

    // The amount is summed on its own, after the count, and reads
    // « 0,00 € » until then.
    const listing = await depositsListingPage()
    await listing.waitForDeposits(1)
    await waitFor(() =>
      expect(listing.deposit(12)).toMatchObject({
        articleCount: 1,
        amount: '80,00 €',
      }),
    )
  })

  // An article handed back to its seller (a pro's article at the end of the
  // bourse) can still be corrected: it stays returned.
  it('keeps a returned article returned when it is corrected', async () => {
    const { articles } = await givenDeposit({}, [
      { price: 120, status: 'RETURNED' },
    ])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setPrice('95')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    const [update] = await local.outbox()
    expect(update.data).toMatchObject({ price: 95, status: 'RETURNED' })
  })

  it('shows a returned article as returned', async () => {
    const { articles } = await givenDeposit({}, [{ status: 'RETURNED' }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    expect(page.status()).toBe('Restitué')
  })

  // The same as the return desk of the pros does: only the status changes.
  it('marks an article returned', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setStatus('Restitué')
    await page.validate()

    await page.lastToast(`Article ${skis.code} mis à jour`)
    const again = await articleEditPage()
    await again.search(skis.code, '12 A')
    expect(again.status()).toBe('Restitué')
    const [update] = await local.outbox()
    expect(update.data).toMatchObject({ status: 'RETURNED' })
  })
})
