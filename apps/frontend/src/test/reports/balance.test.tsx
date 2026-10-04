// The « Bilan de la bourse », checked on whole bourses typed through the
// screens. The expected figures are those of the test book (« Bilan —
// scénarios »), worked out by hand from the rules validated line by line.
import { beforeAll, describe, expect, it } from 'vitest'
import { balancePage } from '@/test/pages/balance.page.ts'
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

      expect(balance.lines()).toEqual({
        // Durand, Martin, Bon, Sport Pro.
        'Nombre de fiches': '4',
        'Dont pré-dépôts': '1',
        "Nombre d'articles en dépôt": '9',
        // 150 + 180 + 30 + 500.
        'Montant du dépôt': '860,00 €',
        'Périmètre des caisses de vente': '0 vente(s) exclue(s)',
        "Nombre d'acheteurs": '3',
        // 520 ÷ 3, 5 ÷ 3.
        'Panier moyen (€)': '173,33 €',
        'Panier moyen (articles)': '1,667',
        "Nombre d'articles vendus": '5',
        '% des articles en dépôt': '55,56 %',
        // 140 + 150 + 230.
        'Montant total des ventes': '520,00 €',
        '% de la valeur du dépôt': '60,47 %',
        // Durand paid at the deposit, Martin's deducted from his cheque.
        'Cotisations payées': '4,00 €',
        'Dont cotisations soldées au retour': '0,00 €',
        'Cotisations non payées': '0,00 €',
        // 10 % of 140 and 180, 15 % of 200.
        'Droits CMR': '62,00 €',
        'Achats CMR': '0,00 €',
        'Recette bourse théorique': '66,00 €',
        'Total paiements': '520,00 €',
        'Total cartes': '150,00 €',
        // As counted: 140 at till 5000, 30 at till 6000.
        'Total espèces': '170,00 €',
        'Total chèques': '200,00 €',
        'Total différé': '0,00 €',
        'Montant total décaissé': '456,00 €',
        'Règlements pros': '170,00 €',
        // Durand 126, Martin 162 − 2.
        'Règlements particuliers': '286,00 €',
        'Cotisations encaissées': '2,00 €',
        'Chèques particuliers non faits': '0,00 €',
        // 520 + 2 − 456.
        'Recette bourse': '66,00 €',
        'Différence recette théorique et réelle': '0,00 €',
        'Différence de caisses': '0,00 €',
        'Solde différence': '0,00 €',
      })

      // The PDF beside the audit carries the same amounts and rates.
      const pdf = await balance.pdfText()
      for (const value of Object.values(balance.lines())) {
        if (/[€%]$/.test(value)) expect(pdf).toContain(value)
      }
    },
    DAY,
  )
})
