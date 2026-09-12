import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { YEAR, givenDeposit, givenWorkstation } from '@/test/harness.ts'
import { salesAddPage } from '@/test/pages/sales-add.page.ts'
import { openScreen, screen, signedInAs } from '@/test/screen.tsx'

// Some barcode scanners terminate a read with CR+LF. The LF is no character
// the keyboard has: it arrives as Ctrl+J, and that is the browser's shortcut
// for "open Downloads" — so on Edge every scan also opened a Downloads tab.
// The application cancels that keystroke; the scan itself must go through
// untouched.
describe('Screen: a scanner that terminates its reads with CR+LF', () => {
  // What the browser would act on: the keydown as it comes out of the page.
  const seen: Array<{ key: string; ctrl: boolean; prevented: boolean }> = []
  const record = (event: KeyboardEvent) =>
    seen.push({
      key: event.key,
      ctrl: event.ctrlKey,
      prevented: event.defaultPrevented,
    })

  let code: string

  beforeEach(async () => {
    seen.length = 0
    window.addEventListener('keydown', record)
    signedInAs()
    await givenWorkstation(2000)
    const { articles } = await givenDeposit({}, [{ price: 120 }])
    code = articles[0].code
  })

  afterEach(() => window.removeEventListener('keydown', record))

  it('swallows the Ctrl+J the line feed produces, and still registers the article', async () => {
    const page = await salesAddPage()

    await page.scanWithLineFeedSuffix(code)

    expect(page.scannedCodes()).toEqual([`${YEAR} 12A`])
    expect(page.total()).toBe(120)

    const ctrlJ = seen.filter((event) => event.ctrl && event.key === 'j')
    expect(ctrlJ).toHaveLength(1)
    expect(ctrlJ[0].prevented).toBe(true)
  })

  // The guard lives on the root route, so it must hold wherever a volunteer
  // scans — not only at the till. Every screen below has a scan field.
  const scanningScreens = [
    { path: '/sales/add', heading: 'Faire une vente' },
    { path: '/deposits/pros', heading: 'Réceptionner les articles des pros' },
    { path: '/returns/pros', heading: 'Retourner les articles des pros' },
    { path: '/deposits/articles', heading: 'Modifier un article' },
  ]

  it.each(scanningScreens)(
    'cancels it on $heading too',
    async ({ path, heading }) => {
      const { user } = await openScreen(path)
      await screen.findByRole('heading', { name: heading })

      await user.keyboard('{Control>}j{/Control}')

      const ctrlJ = seen.filter((event) => event.ctrl && event.key === 'j')
      expect(ctrlJ).toHaveLength(1)
      expect(ctrlJ[0].prevented).toBe(true)
    },
  )
})
