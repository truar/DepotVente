import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { articleEditPage } from '@/test/pages/article-edit.page.ts'
import { signedInAs, waitFor } from '@/test/screen.tsx'

// A label went out with the wrong price, or the seller remembers the serial
// number engraved under the binding: a volunteer of the deposit desk opens
// the article by its code and corrects it. The correction is saved on this
// computer first, then queued for the server so the tills see it.
describe('Screen: correcting an article', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('saves the corrections, tells the volunteer and goes back to the deposit menu', async () => {
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
    await waitFor(() => expect(page.pathname()).toBe('/deposits'))

    // Searched again, the article shows the correction: the serial number
    // trimmed, the price as typed.
    const again = await articleEditPage()
    await again.search(skis.code, '12 A')
    expect(again.price()).toBe('95')
    expect(again.description()).toBe('Hero Elite, fixations Look')
    expect(again.serialNumber()).toBe('SN-42')

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

  // Another code searched while an article is open: the volunteer is asked
  // first; saying no keeps the article, and what was typed on it.
  it('asks before opening another article searched while one is open', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }, { price: 80 }])
    const [skis, boots] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')
    await page.setPrice('110')

    await page.searchAnother(boots.code)
    let question = await page.question()
    expect(question.title).toBe('Etes vous sur de vouloir changer d’article ?')
    await question.decline()
    expect(page.price()).toBe('110')

    await page.searchAnother(boots.code)
    question = await page.question()
    await question.confirm()
    await waitFor(() => expect(page.price()).toBe('80'))
  })

  // Searching the open article again, or after a code that matched
  // nothing, opens it without a question.
  it('does not ask when no other article is open', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.searchAnother('2026 999Z')
    await page.search(skis.code, '12 A')
    expect(page.isQuestionOpen()).toBe(false)

    await page.searchAnother(skis.code)

    expect(page.isQuestionOpen()).toBe(false)
    expect(page.price()).toBe('120')
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
})
