import { beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { screen, signedInAs } from '@/test/screen.tsx'

// A refused scan at the till raises a blocking alert. The
// cashier keeps scanning without looking at the screen: those reads must not
// ring anything up behind the alert. Enter (the end of a scan, or the
// cashier's own key) closes it; Escape does not, so that the alert is read.
describe('Screen: the blocking alert raised by a refused scan', () => {
  let code: string

  beforeEach(async () => {
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    code = articles[0].code
  })

  it('swallows a scan made while the alert is open, the Enter of it closing the alert', async () => {
    const page = await salesAddPage()
    await page.scan('9999 999Z')
    const alert = await page.alert()
    expect(alert.message).toBe('Article 9999 999Z inconnu')

    // The scan field, outside the alert, still has the focus: the scanner
    // types the code of a real article into it, then Enter.
    expect(screen.getByLabelText('Scanner un article')).toHaveFocus()
    await page.user.keyboard(`${code}{Enter}`)

    expect(page.isAlertOpen()).toBe(false)
    expect(page.scannedCodes()).toEqual([])
    expect(page.total()).toBe(0)
    expect(
      screen.getByLabelText<HTMLInputElement>('Scanner un article').value,
    ).toBe('')
  })

  it('lets the cashier scan again once the alert is closed', async () => {
    const page = await salesAddPage()
    await page.scan('9999 999Z')
    await page.alert()
    await page.user.keyboard('{Enter}')

    await page.scan(code)

    expect(page.scannedCodes()).toEqual([`${YEAR} 12A`])
  })

  it('stays open when Escape is pressed', async () => {
    const page = await salesAddPage()
    await page.scan('9999 999Z')
    await page.alert()

    await page.user.keyboard('{Escape}')

    expect(page.isAlertOpen()).toBe(true)
    // Enter still closes it (and leaves no alert open for the next story).
    await page.user.keyboard('{Enter}')
    expect(page.isAlertOpen()).toBe(false)
  })

  it('closes on « OK »', async () => {
    const page = await salesAddPage()
    await page.scan('9999 999Z')
    const alert = await page.alert()

    await alert.dismiss()

    expect(page.isAlertOpen()).toBe(false)
  })
})
