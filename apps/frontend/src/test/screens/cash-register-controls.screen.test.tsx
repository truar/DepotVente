import { beforeEach, describe, expect, it } from 'vitest'
import {
  givenCashRegisterControl,
  givenDeposit,
  givenSale,
  givenWorkstation,
  local,
} from '@/test/harness.ts'
import { cashRegisterControlsPage } from '@/test/pages/cash-register-controls.page.ts'
import { cashRegisterControlPage } from '@/test/pages/cash-register-control.page.ts'
import { salesControlPage } from '@/test/pages/sales-control.page.ts'
import { lastPrintedText } from '@/test/printed.ts'
import {
  openScreen,
  screen,
  signedInAs,
  waitFor,
  within,
} from '@/test/screen.tsx'

// The administrator checks every till's count from their own computer,
// till 2000: one list per desk, the nine tills 1000 to 9000, and each count
// opened, read and corrected as the till's cashier would.

const missing = (cashRegisterId: number) => [
  `${cashRegisterId}`,
  'Manquant',
  '—',
  '—',
  '—',
]

describe('Screen: the list of cash counts', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(2000)
  })

  it('lists the nine tills, done where this desk has a count, missing elsewhere', async () => {
    await givenCashRegisterControl({
      cashRegisterId: 1000,
      type: 'DEPOSIT',
      realCashAmount: 12,
      difference: -0.5,
      updatedAt: new Date(2026, 9, 10, 18, 42),
    })
    // Pulled from the server: the date is stored as the server's ISO string.
    await givenCashRegisterControl({
      cashRegisterId: 3000,
      type: 'DEPOSIT',
      realCashAmount: 6,
      difference: 0,
      updatedAt: new Date(2026, 9, 10, 19, 5).toISOString(),
    })
    // Till 2000 counted its sale drawer, not its deposit one.
    await givenCashRegisterControl({
      cashRegisterId: 2000,
      type: 'SALE',
      realCashAmount: 300,
    })

    const page = await cashRegisterControlsPage('deposits')

    expect(page.rows()).toEqual([
      ['1000', 'Fait', '12,00 €', '-0,50 €', '10/10 18:42'],
      missing(2000),
      ['3000', 'Fait', '6,00 €', '0,00 €', '10/10 19:05'],
      missing(4000),
      missing(5000),
      missing(6000),
      missing(7000),
      missing(8000),
      missing(9000),
    ])
  })

  it('shows each desk its own counts', async () => {
    await givenCashRegisterControl({ cashRegisterId: 1000, type: 'DEPOSIT' })
    await givenCashRegisterControl({ cashRegisterId: 2000, type: 'SALE' })
    await givenCashRegisterControl({ cashRegisterId: 3000, type: 'RETURN' })

    const sales = await cashRegisterControlsPage('sales')
    expect(sales.row(1000)[1]).toBe('Manquant')
    expect(sales.row(2000)[1]).toBe('Fait')
    expect(sales.row(3000)[1]).toBe('Manquant')

    const returns = await cashRegisterControlsPage('returns')
    expect(returns.row(1000)[1]).toBe('Manquant')
    expect(returns.row(2000)[1]).toBe('Manquant')
    expect(returns.row(3000)[1]).toBe('Fait')
  })

  it('opens a till from the list, and comes back to it', async () => {
    const page = await cashRegisterControlsPage('deposits')

    await page.open(3000)
    expect(
      await screen.findByRole('heading', {
        name: 'Contrôle caisse dépôts — Caisse 3000',
      }),
    ).toBeVisible()

    await page.user.click(
      screen.getByRole('link', { name: 'Retour à la liste' }),
    )
    const dialog = await screen.findByRole('alertdialog')
    await page.user.click(within(dialog).getByRole('button', { name: 'Oui' }))
    await waitFor(() =>
      expect(page.pathname()).toBe('/deposits/cash-register-controls'),
    )
  })
})

describe('Screen: a till number typed by hand', () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(2000)
  })

  it.each(['deposits', 'sales', 'returns'])(
    'sends /%s/cash-register-controls/abc back to the list',
    async (desk) => {
      const { router } = await openScreen(`/${desk}/cash-register-controls/abc`)

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(
          `/${desk}/cash-register-controls`,
        ),
      )
    },
  )
})

describe("Screen: correcting another till's deposit count", () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(2000)
    // Till 3000 took 4 € of contributions; this computer, till 2000, took 6 €.
    await givenDeposit({
      incrementStart: 3000,
      contributionStatus: 'PAYE',
      contributionAmount: 4,
    })
    await givenDeposit({
      incrementStart: 2000,
      contributionStatus: 'PAYE',
      contributionAmount: 6,
    })
    await givenCashRegisterControl({
      cashRegisterId: 3000,
      type: 'DEPOSIT',
      initialAmount: 50,
      cash50: 1,
      realCashAmount: 0,
      theoreticalCashAmount: 4,
      difference: -4,
      totalAmount: 0,
      comment: 'Premier comptage',
    })
  })

  it("loads till 3000's count, saves the correction on it, and goes back to the list", async () => {
    const page = await cashRegisterControlPage(
      '/deposits/cash-register-controls/3000',
      'Contrôle caisse dépôts — Caisse 3000',
    )
    await page.loaded()
    expect(page.float()).toBe(50)
    expect(page.countOf(50)).toBe(1)
    expect(page.commentText()).toBe('Premier comptage')
    // What till 3000 took, not this computer's till
    await waitFor(() => expect(page.theoretical()).toBe(4))

    // Two 2 € coins were left in the drawer's back
    await page.count(2, 2)
    expect(page.difference()).toBe(0)
    await page.comment('Deux pièces de 2 € retrouvées')
    await page.print()
    expect(await lastPrintedText()).toContain('Caisse N° 3000')
    await page.save()
    await page.savedToast(3000)
    await waitFor(() =>
      expect(page.pathname()).toBe('/deposits/cash-register-controls'),
    )

    const controls = await local.cashRegisterControls()
    expect(controls).toHaveLength(1)
    expect(controls[0]).toMatchObject({
      cashRegisterId: 3000,
      type: 'DEPOSIT',
      cash50: 1,
      cash2: 2,
      realCashAmount: 4,
      theoreticalCashAmount: 4,
      difference: 0,
      comment: 'Deux pièces de 2 € retrouvées',
    })
    expect(
      (await local.outbox()).map((op) => [op.collection, op.operation]),
    ).toEqual([['cashRegisterControls', 'update']])
  })
})

describe("Screen: counting a till's sale drawer the cashier did not count", () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(2000)
    await givenSale({
      saleIndex: 3001,
      incrementStart: 3000,
      cashAmount: 120,
      buyer: { lastName: 'Petit', firstName: 'Anna', city: 'Annecy' },
    })
    // This computer's own sale: none of it is in till 3000's drawer.
    await givenSale({ saleIndex: 2001, incrementStart: 2000, cashAmount: 500 })
  })

  it("shows till 3000's sales, and records the count as till 3000's", async () => {
    const page = await salesControlPage(
      '/sales/cash-register-controls/3000',
      'Contrôle caisse ventes — Caisse 3000',
    )

    await page.open('cashSales')
    await waitFor(() =>
      expect(page.rows()).toEqual([
        ['3001', 'Petit Anna', '0633333333', 'Annecy', '120,00 €', '120,00 €'],
      ]),
    )

    await page.open('drawer')
    await waitFor(() => expect(page.theoretical()).toBe(120))
    await page.setFloat(0)
    await page.count(100, 1)
    await page.count(20, 1)
    await page.comment('Compté par l’administrateur')
    await page.print()
    expect(await lastPrintedText()).toContain('Contrôle caisse ventes N° 3000')
    await page.save()
    await page.savedToast(3000)
    await waitFor(() =>
      expect(page.pathname()).toBe('/sales/cash-register-controls'),
    )

    const [control] = await local.cashRegisterControls()
    expect(control).toMatchObject({
      cashRegisterId: 3000,
      type: 'SALE',
      realCashAmount: 120,
      theoreticalCashAmount: 120,
      difference: 0,
    })
  })
})

describe("Screen: another till's return drawer", () => {
  beforeEach(async () => {
    signedInAs('ADMIN')
    await givenWorkstation(2000)
    await givenDeposit({
      contributionStatus: 'SOLDE',
      contributionAmount: 4,
      contributionCollectWorkstationId: 3000,
    })
    await givenDeposit({
      contributionStatus: 'SOLDE',
      contributionAmount: 6,
      contributionCollectWorkstationId: 2000,
    })
  })

  it('expects the contributions settled on that till', async () => {
    const page = await cashRegisterControlPage(
      '/returns/cash-register-controls/3000',
      'Contrôle caisse retours — Caisse 3000',
    )

    await waitFor(() => expect(page.theoretical()).toBe(4))
  })
})

describe('Screen: the lists are for administrators', () => {
  beforeEach(async () => {
    await givenWorkstation(2000)
  })

  it.each(['/deposits', '/sales', '/returns'])(
    'offers the list of counts on %s to an administrator only',
    async (desk) => {
      signedInAs('ADMIN')
      await openScreen(desk)
      expect(
        await screen.findByRole('button', { name: /^Contrôles caisses/ }),
      ).toBeVisible()

      signedInAs('BENEVOLE')
      await openScreen(desk)
      await screen.findByText(/^Que souhaitez-vous faire/)
      expect(
        screen.queryByRole('button', { name: /^Contrôles caisses/ }),
      ).toBeNull()
    },
  )

  it.each([
    '/deposits/cash-register-controls',
    '/deposits/cash-register-controls/3000',
    '/sales/cash-register-controls',
    '/sales/cash-register-controls/3000',
    '/returns/cash-register-controls',
    '/returns/cash-register-controls/3000',
  ])('sends a volunteer typing %s back to the menu', async (path) => {
    signedInAs('BENEVOLE')

    const { router } = await openScreen(path)

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
