// Page object for the return register's cash count (/returns/cash-register-
// control, "Contrôler les espèces (retours)", admin only). The same screen
// counts the deposit register (/deposits/cash-register-control), opened
// with depositCashCountPage to check that the two counts of one till stay
// apart. Denominations are addressed by their value: 50, 2, 0.1...
import { expect } from 'vitest'
import type { Denomination } from '@/test/pages/cash-count.ts'
import { cashCount } from '@/test/pages/cash-count.ts'
import { openScreen, screen, waitFor } from '@/test/screen.tsx'

export type { Denomination }

export function returnsCashCountPage() {
  return cashCountPage(
    '/returns/cash-register-control',
    'Contrôler les espèces (retours)',
  )
}

export function depositCashCountPage() {
  return cashCountPage(
    '/deposits/cash-register-control',
    'Contrôler les espèces',
  )
}

async function cashCountPage(route: string, title: string) {
  const { user: u, router } = await openScreen(route)
  await screen.findByRole('heading', { name: title })

  const drawer = cashCount(u)

  const page = {
    user: u,
    pathname: () => router.state.location.pathname,

    // ---- the drawer ----------------------------------------------------
    ...drawer,

    // ---- comment, print, save -------------------------------------------
    // The banner about contributions settled on no known till.
    unattributedWarning: () =>
      screen
        .queryByText(/sans caisse d'encaissement/)
        ?.textContent.replace(/\s+/g, ' ')
        .trim() ?? null,
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
    // A saved count is loaded into the form asynchronously.
    async loaded() {
      await waitFor(() => expect(page.commentText()).not.toBe(''))
    },
    // Float, count, comment, print and save, as the volunteer closes the
    // till. The float is typed every time: the screen never fills it in.
    async close(
      counts: Array<[Denomination, number]>,
      comment: string,
      cashRegisterId: number,
      float = 80,
    ) {
      await page.setFloat(float)
      for (const [value, n] of counts) await page.count(value, n)
      await page.comment(comment)
      await page.print()
      await page.save()
      await page.savedToast(cashRegisterId)
    },
  }
  return page
}
