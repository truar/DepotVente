import { beforeEach, describe, expect, it } from 'vitest'
import { givenWorkstation } from '@/test/harness.ts'
import { reopenBrowser, signedOut } from '@/test/pages/login.page.ts'
import { openScreen, screen, signedInAs, waitFor } from '@/test/screen.tsx'

// Every screen of the three desks, as typed in the address bar.
const deskScreens = [
  '/deposits',
  '/deposits/add',
  '/deposits/articles',
  '/deposits/cash-register-control',
  '/deposits/cash-register-controls',
  '/deposits/cash-register-controls/1000',
  '/deposits/listing',
  '/deposits/predeposits',
  '/deposits/pros',
  '/deposits/3f1c0d0e-0000-4000-8000-000000000000/edit',
  '/sales',
  '/sales/add',
  '/sales/listing',
  '/sales/sales-control',
  '/sales/cash-register-controls',
  '/sales/cash-register-controls/1000',
  '/sales/3f1c0d0e-0000-4000-8000-000000000000/edit',
  '/returns',
  '/returns/checks',
  '/returns/individuals',
  '/returns/listing',
  '/returns/pros',
  '/returns/cash-register-control',
  '/returns/cash-register-controls',
  '/returns/cash-register-controls/1000',
]

describe('Screen: the desks on a computer without a till number', () => {
  // An administrator, so that the admin-only screens of the list
  // (/returns/cash-register-control, the lists of counts) are turned away for
  // the till number and nothing else.
  beforeEach(() => {
    signedInAs('ADMIN')
  })

  // Typing a desk's address does not get round the menu: with
  // no till number, the volunteer is sent back to the menu.
  it.each(deskScreens)('sends %s back to the main menu', async (path) => {
    const { router } = await openScreen(path)

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(
      await screen.findByRole('heading', { name: 'Configuration requise' }),
    ).toBeVisible()
  })

  // The same address, once the computer has its till number, opens.
  it('opens the desk once the computer has a till number', async () => {
    await givenWorkstation(2000)

    const { router } = await openScreen('/sales/add')

    expect(router.state.location.pathname).toBe('/sales/add')
    expect(
      await screen.findByRole('heading', { name: 'Faire une vente' }),
    ).toBeVisible()
  })
})

describe('Screen: who may open what', () => {
  beforeEach(() => {
    signedOut()
  })

  // A volunteer typing an administrator's address is sent back to the menu.
  it('sends a volunteer back to the menu from the reports', async () => {
    signedInAs('BENEVOLE')

    const { router } = await openScreen('/reports')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  // Code review: the role is enforced by the app alone, from what it stored
  // in the browser. Someone who edits « auth-storage » by hand to say ADMIN,
  // with any token, opens the administrators' screens: nothing asks the
  // server.
  it('opens an administrator screen to whoever writes ADMIN in the stored session', async () => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          token: 'not-a-token',
          isAuthenticated: true,
          user: { id: 'nobody', role: 'ADMIN' },
        },
        version: 0,
      }),
    )
    await reopenBrowser()

    const { router } = await openScreen('/reports')

    // Current behaviour, pinned until it is decided: the role is only
    // checked by the user interface, against the browser's own copy.
    expect(router.state.location.pathname).toBe('/reports')
    expect(
      await screen.findByRole('heading', { name: 'Générer les bilans' }),
    ).toBeVisible()
  })
})
