// The « Bilan de la bourse », checked on the reference bourse typed through
// the screens as on the day: the whole chain, from the deposit desk to the
// report. The expected figures are those of the test book (« Bilan —
// scénarios »), worked out by hand. The variants (balance-variants.test.ts)
// start from the same bourse built straight into the base.
import { beforeAll, describe, expect, it } from 'vitest'
import { balancePage } from '@/test/pages/balance.page.ts'
import { referenceBalance } from '@/test/scenarios/reference-balance.ts'
import { givenTheReferenceBourse } from '@/test/scenarios/reference-bourse.ts'
import { signedInAs } from '@/test/screen.tsx'

// A whole bourse takes a while to type in.
const DAY = 120_000

describe('Report: the balance of the reference bourse', () => {
  beforeAll(() => {
    signedInAs('ADMIN')
  })

  // Every till counted right, every cheque written, nothing left to collect:
  // the bourse earns what it should (66 €), and nothing is left to explain.
  it(
    'closes at zero, with every line worked out by hand',
    async () => {
      await givenTheReferenceBourse()

      const balance = await balancePage()
      await balance.loaded()

      expect(balance.lines()).toEqual(referenceBalance)

      // The PDF beside the audit carries the same amounts and rates.
      const pdf = await balance.pdfText()
      for (const value of Object.values(balance.lines())) {
        if (/[€%]$/.test(value)) expect(pdf).toContain(value)
      }
      // What explains the gap between the two takings is listed under it,
      // the deferred payments no longer among the collected ones.
      expect(pdf).toMatch(
        /Différence de caisses.*Paiements différés.*Cotisations non payées.*Solde différence/s,
      )
      expect(pdf).not.toContain('Total différé')
    },
    DAY,
  )
})
