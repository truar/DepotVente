// Page object for the cash count screen, shared by the deposit register
// (/deposits/cash-register-control, "Contrôler les espèces") and the
// return register. Denominations are addressed by their value: 50, 2,
// 0.1...
import { expect } from 'vitest'
import type { Denomination } from '@/test/pages/cash-count.ts'
import { cashCount } from '@/test/pages/cash-count.ts'
import { openScreen, screen, waitFor, within } from '@/test/screen.tsx'

export type { Denomination }

export async function cashRegisterControlPage(
  route = '/deposits/cash-register-control',
  title = 'Contrôler les espèces',
) {
  const { user: u, router } = await openScreen(route)
  await screen.findByRole('heading', { name: title })

  const drawer = cashCount(u)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the drawer ----------------------------------------------------
    count: drawer.count,
    countOf: drawer.countOf,
    setFloat: drawer.setFloat,
    float: drawer.float,
    real: drawer.real,
    realText: drawer.realText,
    theoretical: drawer.theoretical,
    difference: drawer.difference,

    // ---- comment, print, save -------------------------------------------
    comment: drawer.comment,
    commentText: drawer.commentText,
    errors(): Array<string> {
      return screen
        .queryAllByText(/obligatoire|^Merci/)
        .map((line) => line.textContent.trim())
    },
    async print() {
      const before = document.querySelectorAll('iframe').length
      await u.click(screen.getByRole('button', { name: 'Imprimer' }))
      await waitFor(
        () =>
          expect(document.querySelectorAll('iframe').length).toBe(before + 1),
        { timeout: 15_000 },
      )
    },
    async save() {
      await u.click(screen.getByRole('button', { name: 'Valider' }))
    },
    savedToast(cashRegisterId: number) {
      return screen.findByText(`Caisse ${cashRegisterId} enregistrée`)
    },
    // A saved control is loaded into the form asynchronously.
    async loaded() {
      await waitFor(() => expect(page.commentText()).not.toBe(''))
    },
    async dialog() {
      const box = await screen.findByRole('alertdialog')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        confirm: () =>
          u.click(within(box).getByRole('button', { name: 'Oui' })),
        decline: () =>
          u.click(within(box).getByRole('button', { name: 'Non' })),
      }
    },
  }
  return page
}
