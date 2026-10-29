// Marque saisie dans le Google Form → marque de types/brands.ts.
import { brands } from '../../../../frontend/src/types/brands'

// Fautes de frappe courantes que la comparaison sans casse ni accent ne
// rattrape pas. Clé : forme normalisée par brandKey().
const BRAND_ALIASES: Record<string, string> = {
  quechua: 'Quechua',
  queshua: 'Quechua',
  queschua: 'Quechua',
  quescha: 'Quechua',
  volki: 'Volkl',
  nordic: 'Nordica',
  fisher: 'Fischer',
  technica: 'Tecnica',
  dare2be: 'Dare2b',
  decathon: 'Decathlon',
  colombia: 'Columbia',
  // Marque textile de Super U, aussi écrite « U Oxygn » ou « Oxyg'n ».
  uoxygn: 'U-Oxyg',
  oxyg: 'U-Oxyg',
  oxygn: 'U-Oxyg',
  gapkids: 'Gap',
  // Vendue sous le nom « Vertigo Alpes » ou « Alpes Vertigo ».
  vertigoalpes: 'Vertigo',
  alpesvertigo: 'Vertigo',
  // Shaver est un modèle de snowboard enfant d'O'Sin (Original Sin), que les
  // vendeurs prennent pour la marque.
  shaver: 'Osin',
  shavers: 'Osin',
  originalsin: 'Osin',
  // Doublons et fautes de frappe retirés de la liste en octobre 2026, au
  // profit de la marque officielle.
  technopro: 'Tecno Pro',
  technipro: 'Tecno Pro',
  tecno: 'Tecno Pro',
  // Marque d'anoraks enfant, que les vendeurs abrègent.
  himalaya: 'Himalaya Mountain',
  weze: 'Wedze',
  reuch: 'Reusch',
  wedize: 'Wedze',
  volk: 'Volkl',
  haed: 'Head',
  nideecker: 'Nidecker',
  quicksilver: 'Quiksilver',
  annapurna: 'Anapurna',
  dorotenns: 'Dorotennis',
  spider: 'Spyder',
  spyderactive: 'Spyder',
  ellse: 'Ellesse',
  smartwood: 'Smartwool',
  tomic: 'Atomic',
  bori: 'Boeri',
  iekuitheme: 'Equi-Thème',
  ternva: 'Ternua',
  easyentryroxa: 'Roxa',
  mountainhardware: 'Mountain Hardwear',
  montainsafetyresearch: 'MSR',
  mountainsafetyresearch: 'MSR',
  nothernlites: 'Northern Lites',
  oneil: "O'Neill",
  hangwag: 'Hanwag',
  islejacobsen: 'Ilse Jacobsen',
}

// Forme de comparaison : minuscules, sans accent, sans rien d'autre que
// lettres et chiffres (« Wed'ze », « WEDZE » et « wedze » donnent « wedze »).
export function brandKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export const brandsByKey = new Map(brands.map((brand) => [brandKey(brand), brand]))

function known(k: string): string | undefined {
  return brandsByKey.get(k) ?? BRAND_ALIASES[k]
}

// Quand le champ entier n'est pas une marque mais qu'une partie l'est
// (« ALPINA AJ 3 »), on garde la marque et on rend le reste (« AJ 3 ») pour
// le descriptif. La plus longue suite de mots qui est une marque l'emporte
// (« Black Diamond » avant « Black »), puis la plus à gauche. Une partie de
// moins de deux caractères n'est jamais prise pour une marque : la liste en
// contient d'une seule lettre (« V »), qu'un mot isolé déclencherait à tort.
export function findBrand(value: string): { brand: string | undefined; rest: string } {
  // Sans lettre ni chiffre (vide, « ? », « .?. ») : le vendeur ne connaît pas
  // la marque.
  if (brandKey(value) === '') return { brand: '?', rest: '' }
  const whole = known(brandKey(value))
  if (whole !== undefined) return { brand: whole, rest: '' }
  const words = value.split(/\s+/).filter(Boolean)
  for (let length = words.length - 1; length >= 1; length--) {
    for (let start = 0; start + length <= words.length; start++) {
      const k = brandKey(words.slice(start, start + length).join(' '))
      const brand = k.length < 2 ? undefined : known(k)
      if (brand !== undefined) {
        return { brand, rest: [...words.slice(0, start), ...words.slice(start + length)].join(' ') }
      }
    }
  }
  return { brand: undefined, rest: '' }
}
