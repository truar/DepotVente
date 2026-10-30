import { beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation, local } from '@/test/harness.ts'
import { articleEditPage } from '@/test/pages/article-edit.page.ts'
import { depositAddPage } from '@/test/pages/deposit-add.page.ts'
import { depositEditPage } from '@/test/pages/deposit-edit.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { screen, signedInAs } from '@/test/screen.tsx'

// A volunteer leaves a message on an article for the tills — "sold without
// the poles", "remember to hand over the skins". It is typed at the deposit,
// by the seller's side, or later on the article. When the cashier scans that
// article, the message pops up before the payment.

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

// At the deposit desk the seller asks for a message: the envelope of the
// article's row opens a box to type it. It is saved with the fiche.
describe('Screen: a message for the till typed with the deposit', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('saves the message typed on a row with the article it belongs to', async () => {
    const page = await depositAddPage()
    await page.fillSeller({
      lastName: 'Bernard',
      firstName: 'Paul',
      phoneNumber: '0622222222',
    })
    await page.addArticle()
    await page.fillArticle(0, {
      category: 'Skis',
      brand: 'Rossignol',
      discipline: 'Alpin',
      color: 'Rouge',
      size: '170',
      price: '120',
    })
    await page.addArticle()
    await page.fillArticle(1, {
      category: 'Chaussures',
      brand: 'Nordica',
      discipline: 'Alpin',
      color: 'Noir',
      size: '27.5',
      price: '80',
    })

    expect(page.tillMessage(0).hint()).toBe('Aucun message')
    const box = await page.tillMessage(0).open()
    expect(box.title).toBe('Message caisse — 1001 A')
    expect(box.value()).toBe('')
    // Typed with a stray space on each side.
    await box.replaceWith('  Penser à récupérer les peaux  ')
    await box.validate()
    expect(page.isTillMessageOpen()).toBe(false)
    expect(page.tillMessage(0).hint()).toBe('Penser à récupérer les peaux')
    expect(page.tillMessage(1).hint()).toBe('Aucun message')

    await page.chooseStatus('Payé')
    await page.printSummary()
    await page.save()
    await page.savedToast(1001)

    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(articles.map((a) => [a.code, a.saleAlert])).toEqual([
      [`${YEAR} 1001A`, 'Penser à récupérer les peaux'],
      [`${YEAR} 1001B`, null],
    ])
    const creates = (await local.outbox()).filter(
      (op) => op.collection === 'articles',
    )
    expect(creates.map((op) => [op.operation, op.data.saleAlert])).toEqual([
      ['create', 'Penser à récupérer les peaux'],
      ['create', null],
    ])
  })
})

describe('Screen: the message for the till on a fiche being corrected', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  it('keeps the messages of the articles when the fiche is saved', async () => {
    const { deposit } = await givenDeposit({}, [
      { saleAlert: 'Penser à récupérer les peaux' },
      {},
    ])
    const page = await depositEditPage(deposit.id)

    await page.save()
    await page.savedToast(12)

    const articles = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(articles[0].saleAlert).toBe('Penser à récupérer les peaux')
    expect(articles[1].saleAlert ?? null).toBeNull()
  })

  it('shows the message, saves it changed, written or emptied', async () => {
    const { deposit, articles } = await givenDeposit({}, [
      { saleAlert: 'Penser à récupérer les peaux' },
      {},
      { saleAlert: 'Bâtons à part' },
    ])
    const page = await depositEditPage(deposit.id)

    expect(page.tillMessage(0).hint()).toBe('Penser à récupérer les peaux')
    const box = await page.tillMessage(0).open()
    expect(box.title).toBe('Message caisse — 12 A')
    expect(box.value()).toBe('Penser à récupérer les peaux')
    await box.replaceWith('Peaux dans le sac bleu')
    await box.validate()
    await page.tillMessage(1).write('Vendu sans les bâtons')
    await page.tillMessage(2).write('')
    expect(page.tillMessage(2).hint()).toBe('Aucun message')

    await page.save()
    await page.savedToast(12)

    const saved = (await local.articles()).sort((a, b) =>
      a.identificationLetter.localeCompare(b.identificationLetter),
    )
    expect(saved.map((a) => a.saleAlert)).toEqual([
      'Peaux dans le sac bleu',
      'Vendu sans les bâtons',
      null,
    ])
    const updates = (await local.outbox()).filter(
      (op) => op.collection === 'articles',
    )
    expect(updates.map((op) => [op.recordId, op.data.saleAlert])).toEqual([
      [articles[0].id, 'Peaux dans le sac bleu'],
      [articles[1].id, 'Vendu sans les bâtons'],
      [articles[2].id, null],
    ])
  })

  // Enter in the box validates the message, not the whole fiche.
  it('validates the message with Enter without saving the fiche', async () => {
    const { deposit } = await givenDeposit({}, [{}])
    const page = await depositEditPage(deposit.id)

    const box = await page.tillMessage(0).open()
    await box.replaceWith('Penser à récupérer les peaux')
    await box.pressEnter()

    expect(page.isTillMessageOpen()).toBe(false)
    expect(page.tillMessage(0).hint()).toBe('Penser à récupérer les peaux')
    expect(page.pathname()).toBe(`/deposits/${deposit.id}/edit`)
    expect(await local.outbox()).toHaveLength(0)
  })

  it('drops what was typed in the box when it is cancelled', async () => {
    const { deposit } = await givenDeposit({}, [
      { saleAlert: 'Penser à récupérer les peaux' },
    ])
    const page = await depositEditPage(deposit.id)

    const box = await page.tillMessage(0).open()
    await box.replaceWith('Autre chose')
    await box.cancel()

    expect(page.isTillMessageOpen()).toBe(false)
    expect(page.tillMessage(0).hint()).toBe('Penser à récupérer les peaux')
    expect((await page.tillMessage(0).open()).value()).toBe(
      'Penser à récupérer les peaux',
    )
  })

  // A struck article will not be sold; a sold or returned one has left the
  // shop: none of them takes a message.
  it('offers no message on a struck, sold or returned article', async () => {
    const { deposit } = await givenDeposit({}, [
      { status: 'DELETED' },
      { status: 'SOLD', saleId: 'some-earlier-sale' },
      { status: 'RETURNED' },
    ])
    const page = await depositEditPage(deposit.id)

    expect(page.tillMessage(0).isEnabled()).toBe(false)
    expect(page.tillMessage(1).hasEnvelope()).toBe(false)
    expect(page.tillMessage(2).hasEnvelope()).toBe(false)
  })
})
