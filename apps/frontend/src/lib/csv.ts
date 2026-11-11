// Les fichiers CSV de l'application s'ouvrent d'un double-clic dans un Excel
// français : séparateur point-virgule, marque UTF-8 (BOM) en tête pour que
// les accents se lisent, fins de ligne Windows.

// Un champ qui contient le séparateur, un guillemet ou une fin de ligne est
// mis entre guillemets (guillemets doublés), pour ne pas décaler les colonnes.
const csvField = (value: string) =>
  /[";\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value

const amountFormat = new Intl.NumberFormat('fr-FR', {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** « 1234,50 » : un nombre pour Excel, là où « 1 234,5 » serait du texte. */
export const csvAmount = (amount: number) => amountFormat.format(amount)

/** Fait télécharger ces lignes au navigateur, sous ce nom de fichier. */
export function downloadCsv(fileName: string, rows: Array<Array<string>>) {
  const text = rows.map((row) => `${row.map(csvField).join(';')}\r\n`).join('')
  const blob = new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
