// Page object for the "Faire une vente" screen (/sales/add).
import { expect } from 'vitest'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export async function salesAddPage() {
  const { user: u, router } = await openScreen('/sales/add')
  await screen.findByRole('heading', { name: 'Faire une vente' })

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the sale ----------------------------------------------------
    // "Vente: 1001" next to the scan field.
    saleIndex(): number {
      return Number(screen.getByText(/^Vente: /).textContent.replace(/\D/g, ''))
    },

    // ---- scanning --------------------------------------------------------
    // A barcode scanner types the code and presses Enter.
    async scan(code: string) {
      const input = screen.getByLabelText('Scanner un article')
      await u.clear(input)
      await u.type(input, `${code}{Enter}`)
    },
    // A scanner configured with a CR+LF suffix: the LF reaches the browser as
    // Ctrl+J, right after the code and before the Enter.
    async scanWithLineFeedSuffix(code: string) {
      const input = screen.getByLabelText('Scanner un article')
      await u.clear(input)
      await u.type(input, code)
      await u.keyboard('{Control>}j{/Control}')
      await u.keyboard('{Enter}')
    },
    scannedCodes(): Array<string> {
      return screen
        .queryAllByRole('row')
        .map((row) => within(row).queryAllByRole('cell')[0]?.textContent ?? '')
        .filter((code) => code !== '')
    },
    async removeScanned(index: number) {
      const buttons = screen.getAllByRole('button', {
        name: "Retirer l'article",
      })
      const button = buttons.at(index)
      if (!button) throw new Error(`No scanned article ${index}`)
      await u.click(button)
    },
    // "Montant total : 200€", or 0 when nothing is scanned.
    total(): number {
      const line = screen.queryByText(/Montant total/)
      return line ? Number(line.textContent.replace(/[^\d.]/g, '')) : 0
    },

    // ---- the blocking alert a refused scan raises ------------------------
    async alert() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        message: within(box).getByRole('paragraph').textContent.trim(),
        dismiss: () => u.click(within(box).getByRole('button', { name: 'OK' })),
      }
    },
    isAlertOpen() {
      return screen.queryByRole('alertdialog') !== null
    },

    // ---- buyer -------------------------------------------------------
    async fillBuyer(buyer: {
      lastName?: string
      firstName?: string
      phoneNumber?: string
      city?: string
    }) {
      const type = async (label: string, value?: string) => {
        if (value) await u.type(screen.getByLabelText(label), value)
      }
      await type('Nom', buyer.lastName)
      await type('Prénom', buyer.firstName)
      await type('Téléphone', buyer.phoneNumber)
      if (buyer.city) {
        await u.type(screen.getByLabelText('Ville'), buyer.city)
      }
    },
    buyer() {
      const value = (label: string) =>
        screen.getByLabelText<HTMLInputElement>(label).value
      return {
        lastName: value('Nom'),
        firstName: value('Prénom'),
        phoneNumber: value('Téléphone'),
      }
    },
    buyerCity() {
      return screen.getByLabelText<HTMLInputElement>('Ville').value
    },
    hasButton: (name: string) =>
      screen.queryByRole('button', { name }) !== null,
    // The contact the combobox shows, or null when it shows its placeholder.
    // The contact search, the only combobox that is a button (the city is a
    // datalist input).
    buyerCombobox() {
      const button = screen
        .getAllByRole('combobox')
        .find((el) => el.tagName === 'BUTTON')
      if (!button) throw new Error('No contact combobox on the screen')
      return button
    },
    // The contact the combobox shows, or null when it shows its placeholder.
    selectedBuyer(): string | null {
      const text = page.buyerCombobox().textContent.trim()
      return text === 'Rechercher un nom' ? null : text
    },
    // The contact combobox above the buyer block: picking a contact fills
    // the buyer at once.
    async pickBuyer(name: string) {
      await u.click(page.buyerCombobox())
      const popover = await screen.findByRole('dialog')
      await u.type(within(popover).getByRole('combobox'), name)
      await u.click(await screen.findByRole('option', { name }))
      await waitFor(() => expect(page.buyer().lastName).not.toBe(''))
    },

    // ---- payment -------------------------------------------------------
    async pay(amounts: {
      cash?: number
      card?: number
      check?: number
      deferred?: number
    }) {
      const set = async (label: string, amount?: number) => {
        if (amount === undefined) return
        const input = screen.getByLabelText(label)
        await u.clear(input)
        await u.type(input, String(amount))
      }
      await set('Montant espèces', amounts.cash)
      await set('Montant CB', amounts.card)
      await set('Montant chèque', amounts.check)
      await set('Montant différé', amounts.deferred)
    },
    // "Total règlement : 200€"
    totalPayment(): number {
      return Number(
        screen.getByText(/Total règlement/).textContent.replace(/[^\d.]/g, ''),
      )
    },
    // The error lines above the form (not the ones under a field): the
    // list of field messages, and the payment paragraph.
    errors(): Array<string> {
      const texts = (elements: Array<HTMLElement>) =>
        elements.map((el) => el.textContent.trim())
      return [
        ...texts(screen.queryAllByRole('listitem')).filter((text) =>
          /^Merci|requis$/.test(text),
        ),
        ...texts(screen.queryAllByText(/^Merci de vérifier/)),
      ]
    },

    // ---- invoice -----------------------------------------------------
    // "Facture" prints only a valid, fully paid sale; the story checks
    // printedDocuments() to know whether it did.
    async clickInvoice() {
      await u.click(screen.getByRole('button', { name: 'Facture' }))
    },
    async printInvoice() {
      const before = document.querySelectorAll('iframe').length
      await page.clickInvoice()
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },

    // ---- save ------------------------------------------------------------
    async save() {
      await u.click(
        screen.getByRole('button', { name: 'Valider et enregistrer la vente' }),
      )
    },
    savedToast(saleIndex: number) {
      return screen.findByText(`Vente ${saleIndex} enregistrée`)
    },
  }
  return page
}
