import { beforeEach, describe, expect, it } from 'vitest'
import { givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { givenLabelPrinter, printedLabels } from '@/test/labels.ts'
import { articlesListPage } from '@/test/pages/articles-list.page.ts'
import { screen, signedInAs, waitFor } from '@/test/screen.tsx'

// The deposit desk's list of every article: a volunteer narrows it down to
// a seller, a category, a status, ticks the articles whose label must be
// printed again (torn off, lost, or a price corrected) and sends them to the
// Dymo in one go. A row, or a scanned code, opens the article to correct it.
describe('Screen: the articles list', () => {
  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(1000)
  })

  // Martin (fiche 13) left a pair of skis, then Durand (fiche 12) skis and
  // boots.
  async function givenTwoSellers() {
    const martin = await givenDeposit(
      { depositIndex: 13, seller: { lastName: 'Martin', firstName: 'Alex' } },
      [{ price: 200, model: 'Experience' }],
    )
    const durand = await givenDeposit({ depositIndex: 12 }, [
      {},
      { category: 'Chaussures', brand: 'Nordica', size: '27.5', price: 60 },
    ])
    const [skis, boots] = durand.articles
    return { skis, boots, martinSkis: martin.articles[0] }
  }

  it('lists the articles of every seller, fiche by fiche', async () => {
    const { skis, boots, martinSkis } = await givenTwoSellers()
    const page = await articlesListPage()

    await page.listShows([skis.code, boots.code, martinSkis.code])
    expect(page.listedStatuses()).toEqual({
      [skis.code]: 'Réception OK',
      [boots.code]: 'Réception OK',
      [martinSkis.code]: 'Réception OK',
    })
  })

  it('narrows the list to one seller, then to all of them again', async () => {
    const { skis, boots, martinSkis } = await givenTwoSellers()
    const page = await articlesListPage()
    await page.listShows([skis.code, boots.code, martinSkis.code])

    await page.pickSeller('Martin')
    await page.listShows([martinSkis.code])

    await page.pickSeller('12')
    await page.listShows([skis.code, boots.code])

    await page.pickAllSellers()
    await page.listShows([skis.code, boots.code, martinSkis.code])
  })

  it('narrows the list to a category, and to a status', async () => {
    const { skis, boots, martinSkis } = await givenTwoSellers()
    const sold = await givenDeposit(
      { depositIndex: 14, seller: { lastName: 'Petit', firstName: 'Léa' } },
      [{ status: 'SOLD' }],
    )
    const page = await articlesListPage()
    await page.listShows([
      skis.code,
      boots.code,
      martinSkis.code,
      sold.articles[0].code,
    ])

    await page.filterBy('Statut', 'Vendu')
    await page.listShows([sold.articles[0].code])

    await page.filterBy('Statut', 'Toutes')
    await page.filterBy('Catégorie', 'Chaussures')
    await page.listShows([boots.code])
  })

  it('prints the label of each ticked article, in the order listed', async () => {
    givenLabelPrinter()
    const { skis, boots, martinSkis } = await givenTwoSellers()
    const page = await articlesListPage()
    await page.listShows([skis.code, boots.code, martinSkis.code])

    await page.tick(martinSkis.code)
    await page.tick(skis.code)
    expect(page.ticked()).toBe(2)
    const question = await page.printLabels()
    expect(question.title).toBe('Imprimer 2 étiquettes\u00a0?')
    await question.confirm()

    await page.lastToast('2 étiquettes imprimées')
    expect(printedLabels()).toEqual([
      {
        shortCode: '12 A',
        code: skis.code,
        category: 'Skis',
        description: 'Hero',
        brand: 'Rossignol',
        color: 'rouge',
        size: '170',
        price: '120 €',
        serialNumber: '',
      },
      {
        shortCode: '13 A',
        code: martinSkis.code,
        category: 'Skis',
        description: 'Experience',
        brand: 'Rossignol',
        color: 'rouge',
        size: '170',
        price: '200 €',
        serialNumber: '',
      },
    ])
    // Printed, the articles are no longer ticked.
    expect(page.ticked()).toBe(0)
  })

  it('prints nothing when the volunteer says no', async () => {
    givenLabelPrinter()
    const { skis } = await givenTwoSellers()
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toContain(skis.code))

    await page.tick(skis.code)
    await (await page.printLabels()).decline()

    expect(printedLabels()).toEqual([])
    expect(page.ticked()).toBe(1)
  })

  // Past the first page too: the header box ticks what the filters leave,
  // not only the 50 rows shown.
  it('ticks every article the filters leave, on every page', async () => {
    const { articles } = await givenDeposit({}, [
      ...Array.from({ length: 55 }, () => ({})),
      { category: 'Chaussures', brand: 'Nordica' },
    ])
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toHaveLength(50))

    await page.filterBy('Catégorie', 'Skis')
    await page.tickAll()

    expect(page.ticked()).toBe(55)
    expect(page.tickBox(articles[0].code)).toBeChecked()
  })

  // What a filter hides is not printed, even ticked before: the volunteer
  // prints what is on the screen.
  it('prints only the ticked articles the filters leave', async () => {
    givenLabelPrinter()
    const { skis, martinSkis } = await givenTwoSellers()
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toContain(skis.code))

    await page.tick(skis.code)
    await page.tick(martinSkis.code)
    await page.pickSeller('Martin')
    await page.listShows([martinSkis.code])
    expect(page.ticked()).toBe(1)

    await (await page.printLabels()).confirm()
    await page.lastToast('1 étiquette imprimée')
    expect(printedLabels().map((label) => label.code)).toEqual([
      martinSkis.code,
    ])
  })

  // A deleted article left the deposit: its label is not printed again, as
  // on the article screen.
  it('does not let a deleted article be ticked', async () => {
    const { articles } = await givenDeposit({}, [{}, { status: 'DELETED' }])
    const [skis, deleted] = articles
    const page = await articlesListPage()
    await page.listShows([skis.code, deleted.code])
    expect(page.listedStatuses()[deleted.code]).toBe('Supprimé')

    expect(page.tickBox(deleted.code)).toBeDisabled()
    await page.tickAll()
    expect(page.ticked()).toBe(1)
    expect(page.tickBox(deleted.code)).not.toBeChecked()
  })

  // The articles still ticked are those left to print: once a printer is
  // back, printing again does not print the others twice.
  it('tells the volunteer when no label printer is found', async () => {
    givenLabelPrinter({ connected: false })
    const { skis, boots } = await givenTwoSellers()
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toContain(skis.code))

    await page.tick(skis.code)
    await page.tick(boots.code)
    await (await page.printLabels()).confirm()

    const alert = await page.alert()
    expect(alert.message).toBe(
      "Aucune imprimante Dymo trouvée. Les articles encore cochés n'ont pas été imprimés.",
    )
    expect(printedLabels()).toEqual([])
    await alert.dismiss()
    expect(page.ticked()).toBe(2)
  })

  // No DYMO service on the computer: the label template cannot even be
  // loaded.
  it('tells the volunteer when the labels cannot be printed', async () => {
    const { skis } = await givenTwoSellers()
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toContain(skis.code))

    await page.tick(skis.code)
    await (await page.printLabels()).confirm()

    const alert = await page.alert()
    expect(alert.message).toBe(
      "L'impression des étiquettes a échoué. Les articles encore cochés n'ont pas été imprimés.",
    )
    await alert.dismiss()
    expect(page.ticked()).toBe(1)
  })

  it('opens an article from its row', async () => {
    const { skis } = await givenTwoSellers()
    const page = await articlesListPage()
    await waitFor(() => expect(page.listedCodes()).toContain(skis.code))

    await page.openFromRow(skis.code)

    expect(page.pathname()).toBe(`/deposits/articles/${skis.id}/edit`)
    expect(await screen.findByDisplayValue('12 A')).toBeVisible()
  })

  it('opens the article whose code is scanned', async () => {
    const { boots } = await givenTwoSellers()
    const page = await articlesListPage()

    await page.scan(boots.code)

    expect(await screen.findByDisplayValue('12 B')).toBeVisible()
    expect(page.pathname()).toBe(`/deposits/articles/${boots.id}/edit`)
  })

  it('tells the volunteer when a scanned code matches no article', async () => {
    await givenTwoSellers()
    const page = await articlesListPage()

    await page.scan('2026 999Z')

    const alert = await page.alert()
    expect(alert.message).toBe("La référence 2026 999Z n'existe pas")
    await alert.dismiss()
    expect(page.pathname()).toBe('/deposits/articles')
    expect(page.searchField()).toHaveValue('')
  })
})
