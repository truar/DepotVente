import { useCallback } from 'react'
import { useIntl } from 'react-intl'

// Un montant affiché dans un champ en lecture seule, à la française et au
// centime : « 1 234,50 ». Sans le symbole € : le champ porte déjà l'icône.
// Le texte obtenu est fait pour être lu, jamais pour être relu par le
// formulaire (parseFloat ne comprend pas la virgule).
export function useFormatAmount() {
  const intl = useIntl()
  return useCallback(
    (amount: number) =>
      intl.formatNumber(amount, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [intl],
  )
}
