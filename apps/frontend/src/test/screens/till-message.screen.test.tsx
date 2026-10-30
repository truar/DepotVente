import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { articleEditPage } from '@/test/pages/article-edit.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { screen, signedInAs } from '@/test/screen.tsx'

// A volunteer leaves a message on an article for the tills — "sold without
// the poles", "check the bindings with the buyer". When the cashier scans
// that article, the message pops up before the payment.

// The field the volunteer types the message in, on the article edit screen.
function tillMessageField() {
  return screen.getByLabelText<HTMLInputElement>('Message caisse')
}

describe('Screen: leaving a message for the till on an article', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('keeps the message when another field is corrected', async () => {
    const { articles } = await givenDeposit({}, [
      { price: 120, saleAlert: 'Vendu sans les bâtons' },
    ])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    await page.setPrice('95')
    await page.validate()
    await page.lastToast(`Article ${skis.code} mis à jour`)

    const [saved] = await local.articles()
    expect(saved.price).toBe(95)
    expect(saved.saleAlert).toBe('Vendu sans les bâtons')
  })

  it('saves the message, shows it again and queues it for the tills', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    expect(tillMessageField().value).toBe('')
    // Typed with a stray space on each side.
    await page.user.type(tillMessageField(), '  Vendu sans les bâtons  ')
    await page.validate()
    await page.lastToast(`Article ${skis.code} mis à jour`)

    await page.search(skis.code, '12 A')
    expect(tillMessageField().value).toBe('Vendu sans les bâtons')

    const [saved] = await local.articles()
    expect(saved.saleAlert).toBe('Vendu sans les bâtons')
    const outbox = await local.outbox()
    expect(outbox).toHaveLength(1)
    expect(outbox[0]).toMatchObject({
      collection: 'articles',
      operation: 'update',
      recordId: skis.id,
      data: { saleAlert: 'Vendu sans les bâtons' },
    })
  })

  it('erases the message when the field is emptied', async () => {
    const { articles } = await givenDeposit({}, [
      { price: 120, saleAlert: 'Vendu sans les bâtons' },
    ])
    const [skis] = articles
    const page = await articleEditPage()
    await page.search(skis.code, '12 A')

    expect(tillMessageField().value).toBe('Vendu sans les bâtons')
    await page.user.clear(tillMessageField())
    await page.validate()
    await page.lastToast(`Article ${skis.code} mis à jour`)

    const [saved] = await local.articles()
    expect(saved.saleAlert).toBeNull()
    const outbox = await local.outbox()
    expect(outbox[0]).toMatchObject({ data: { saleAlert: null } })
  })
})

describe('Screen: scanning an article that carries a message', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
  })

  it('adds an article without a message with no alert', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const page = await salesAddPage()

    await page.scan(articles[0].code)

    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([articles[0].code])
  })

  it('shows the message, adds the article and waits for the next code', async () => {
    const { articles } = await givenDeposit({}, [
      { price: 120, saleAlert: 'Vendu sans les bâtons' },
      { price: 80 },
    ])
    const [skis, boots] = articles
    const page = await salesAddPage()

    await page.scan(skis.code)

    const alert = await page.alert()
    expect(alert.title).toBe(`Message pour l'article ${skis.code}`)
    expect(alert.message).toBe('Vendu sans les bâtons')
    await alert.dismiss()

    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([skis.code])
    expect(page.total()).toBe(120)
    expect(screen.getByLabelText('Scanner un article')).toHaveFocus()

    await page.scan(boots.code)
    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([skis.code, boots.code])
  })

  // An article the till refuses shows its refusal only: it is not sold, so
  // its message is not for this cashier.
  it('shows only the refusal for an article that cannot be sold', async () => {
    const { articles } = await givenDeposit({}, [
      { status: 'RECEPTION_PENDING', saleAlert: 'Vendu sans les bâtons' },
    ])
    const page = await salesAddPage()

    await page.scan(articles[0].code)

    const alert = await page.alert()
    expect(alert.title).toBe('Article non réceptionné')
    await alert.dismiss()
    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([])
  })
})
