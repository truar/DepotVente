import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { appUpdateBanner } from '@/test/pages/app-update-banner.page.ts'
import { mainMenuPage } from '@/test/pages/main-menu.page.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { signedInAs } from '@/test/screen.tsx'
import { offerAppUpdate, useAppUpdateStore } from '@/stores/appUpdateStore.ts'

// After a rebuild of the server, the service worker of each computer
// downloads the new build and lets it wait (see registerSW in main.tsx): it
// is offered in a banner, and only a click hands the computer over to it.
// What the click does in a real browser — SKIP_WAITING, then every tab
// reloading — is the service worker's; here it is the `apply` given to the
// banner.
describe('Screen: the banner offering a new version of the app', () => {
  beforeEach(async () => {
    useAppUpdateStore.setState({ apply: null })
    signedInAs()
    await givenWorkstation(2000)
  })

  it('stays hidden while no new version waits', async () => {
    await mainMenuPage()

    expect(appUpdateBanner.isShown()).toBe(false)
  })

  // The new build turns up halfway through a sale: the banner appears over
  // the screen, and the sale under way is left exactly as it was.
  it('shows up in the middle of a sale without touching it', async () => {
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    const sale = await salesAddPage()
    await sale.scan(articles[0].code)
    const apply = vi.fn()

    act(() => offerAppUpdate(apply))

    await appUpdateBanner.shown()
    expect(appUpdateBanner.lines()).toEqual([
      "Nouvelle version de l'application disponible",
      "La page va se recharger : terminez d'abord la saisie en cours.",
    ])
    expect(apply).not.toHaveBeenCalled()
    expect(sale.scannedCodes()).toEqual([`${YEAR} 12A`])
  })

  it('hands the computer over to the new version on « Mettre à jour »', async () => {
    const apply = vi.fn()
    offerAppUpdate(apply)
    const menu = await mainMenuPage()
    await appUpdateBanner.shown()

    await appUpdateBanner.update(menu.user)

    expect(apply).toHaveBeenCalledOnce()
    // The page reloads next; until then a second click does nothing.
    expect(appUpdateBanner.button()).toHaveTextContent('Mise à jour…')
    expect(appUpdateBanner.button()).toBeDisabled()
  })
})
