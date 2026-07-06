// Shared number formatting for the PDF reports.
//
// French Intl output uses a narrow no-break space (U+202F) as the thousands
// separator and a no-break space (U+00A0) before the € symbol. Neither glyph
// exists in react-pdf's built-in Helvetica, so they render as tofu. We format
// with grouping enabled, then swap those special spaces for a regular space
// (U+0020), which Helvetica renders — keeping the "186 590,98 €" look.

const SPECIAL_SPACES = /[\u202F\u00A0\u2009]/g
const normalizeSpaces = (s: string) => s.replace(SPECIAL_SPACES, ' ')

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const pctFmt = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const decFmt = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Currency, grouped, always 2 decimals: "186 590,98 €". */
export const pdfEur = (n: number) => normalizeSpaces(eurFmt.format(n))
/** Percentage, 2 decimals: "41,29 %". */
export const pdfPct = (n: number) => normalizeSpaces(pctFmt.format(n))
/** Plain decimal, 2 decimals: "2,95". */
export const pdfDec = (n: number) => normalizeSpaces(decFmt.format(n))
