// The « Message caisse » box of an article row on the deposit form, the same
// on /deposits/add and /deposits/$depositId/edit: the envelope of the row
// opens it, the volunteer types the message the till shows when the article
// is scanned. Nothing is saved before the fiche is.
import type { User } from '@/test/screen.tsx'
import { screen, within } from '@/test/screen.tsx'

const BOX_NAME = /^Message caisse/

export function tillMessageOf(u: User, row: () => HTMLElement) {
  const envelope = () =>
    within(row()).getByRole('button', { name: 'Message caisse' })
  const message = {
    hasEnvelope: () =>
      within(row()).queryByRole('button', { name: 'Message caisse' }) !== null,
    isEnabled: () => !envelope().hasAttribute('disabled'),
    // What the envelope shows on hover: the message, or « Aucun message ».
    hint: () => envelope().getAttribute('title'),
    async open() {
      await u.click(envelope())
      const box = await screen.findByRole('dialog', { name: BOX_NAME })
      const input = within(box).getByRole<HTMLInputElement>('textbox')
      return {
        title: within(box).getByRole('heading').textContent.trim(),
        value: () => input.value,
        async replaceWith(text: string) {
          await u.clear(input)
          if (text) await u.type(input, text)
        },
        pressEnter: () => u.type(input, '{Enter}'),
        validate: () =>
          u.click(within(box).getByRole('button', { name: 'Valider' })),
        cancel: () =>
          u.click(within(box).getByRole('button', { name: 'Annuler' })),
      }
    },
    async write(text: string) {
      const box = await message.open()
      await box.replaceWith(text)
      await box.validate()
    },
  }
  return message
}

export function isTillMessageOpen() {
  return screen.queryByRole('dialog', { name: BOX_NAME }) !== null
}
