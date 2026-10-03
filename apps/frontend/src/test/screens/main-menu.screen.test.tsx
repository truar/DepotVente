import { beforeEach, describe, expect, it } from 'vitest'
import { givenWorkstation } from '@/test/harness.ts'
import { desks, mainMenuPage } from '@/test/pages/main-menu.page.ts'
import { signedInAs } from '@/test/screen.tsx'

describe('Screen: the main menu', () => {
  beforeEach(() => {
    signedInAs()
  })

  // A computer nobody has given a till number yet: the menu
  // says so, and none of the desks can be opened from it.
  it('warns that the computer has no till number, and keeps the desks closed', async () => {
    const menu = await mainMenuPage()

    expect(menu.configurationWarning()).toEqual({
      title: 'Configuration requise',
      message:
        "Cet ordinateur n'a pas de numéro de caisse configuré. Veuillez " +
        'demander à un administrateur de configurer ce poste avant de ' +
        "pouvoir utiliser l'application.",
    })
    for (const desk of desks) expect(menu.card(desk)).toBeDisabled()
  })

  // Clicking a closed desk leads nowhere.
  it('stays on the menu when a closed desk is clicked', async () => {
    const menu = await mainMenuPage()

    await menu.user.click(menu.card('Ventes'))

    expect(menu.pathname()).toBe('/')
  })

  // Once the till number is set, the warning is gone and each
  // card opens its desk.
  it.each([
    { desk: 'Dépôts' as const, path: '/deposits' },
    { desk: 'Ventes' as const, path: '/sales' },
    { desk: 'Retours' as const, path: '/returns' },
  ])('opens $path from the « $desk » card', async ({ desk, path }) => {
    await givenWorkstation(1000)
    const menu = await mainMenuPage()
    expect(menu.configurationWarning()).toBeNull()
    expect(menu.card(desk)).toBeEnabled()

    await menu.open(desk)

    expect(menu.pathname()).toBe(path)
  })
})
