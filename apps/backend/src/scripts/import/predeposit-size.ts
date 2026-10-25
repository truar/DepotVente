// Taille saisie dans le Google Form → taille du pré-dépôt.
//
// Le champ Taille du poste est étroit : on ne garde que ce qui qualifie une
// taille. La liste des mots gardés est exhaustive (plus courte qu'une liste de
// mots interdits) : tout autre mot — « Pointure », « Taille », un nom de
// modèle — est retiré et rendu dans `removed`, pour que la simulation le
// montre. Chiffres et séparateurs (/ - , . parenthèses) sont toujours gardés.
//
//   « Taille unique »   → « TU »
//   « Pointure 31/32 »  → « 31/32 »
//   « 80 cms »          → « 80cm »
//   « 4A », « 8ans »    → « 4 ans », « 8 ans »
//   « 18M »             → « 18 mois »

// Clé : mot sans casse ni accent → forme gardée.
const SIZE_WORDS: Record<string, string> = {
  xxs: 'XXS',
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
  xxl: 'XXL',
  xxxl: 'XXXL',
  tu: 'TU',
  cm: 'cm',
  cms: 'cm',
  mm: 'mm',
  an: 'an',
  ans: 'ans',
  mois: 'mois',
  eu: 'EU',
  us: 'US',
  uk: 'UK',
  bebe: 'Bébé',
  naissance: 'Naissance',
}

function wordKey(word: string): string {
  return word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function normalizeSize(value: string): { size: string; removed: string[] } {
  const removed: string[] = []
  const kept = value
    .replace(/\btaille\s+unique\b/gi, 'TU')
    // Âges collés au nombre : « 4A », « 3-4A » en années, « 18M » en mois.
    // « M » seul ou séparé du nombre reste la taille M.
    .replace(/(\d)a\b/gi, '$1 ans')
    .replace(/(\d)m\b/gi, '$1 mois')
    .replace(/\p{L}+/gu, (word) => {
      const known = SIZE_WORDS[wordKey(word)]
      if (known === undefined) removed.push(word)
      return known ?? ''
    })
  const size = kept
    .replace(/(\d)\s*(cm|mm)\b/g, '$1$2')
    .replace(/(\d)\s*(ans?|mois)\b/g, '$1 $2')
    // Ce qu'un mot retiré laisse derrière lui : « ( 18,5) », « () », « : 38 ».
    .replace(/\(\s*\)/g, '')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .replace(/^[\s:;,/'’-]+|[\s:;,/'’-]+$/g, '')
  return { size, removed }
}
