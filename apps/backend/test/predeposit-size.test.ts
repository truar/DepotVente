import { describe, expect, it } from 'vitest'
import { normalizeSize } from '../src/scripts/import/predeposit-size'

describe('normalizeSize (import des pré-dépôts du Google Form)', () => {
  it.each([
    '42/43',
    '21,5/34',
    '22-22,5',
    '25.5',
    '110cm',
    '12 mois',
    '6 ans',
    'L',
    'XS',
    'Bébé',
    'Naissance',
    '',
  ])('garde « %s » tel quel', (value) => {
    expect(normalizeSize(value)).toEqual({ size: value, removed: [] })
  })

  it.each([
    ['Taille unique', 'TU'],
    ['TAILLE UNIQUE', 'TU'],
    ['80 cms', '80cm'],
    ['110 cm', '110cm'],
    ['110-145 cm', '110-145cm'],
    ['305 MM', '305mm'],
    ['4A', '4 ans'],
    ['3-4A', '3-4 ans'],
    ['8ans', '8 ans'],
    ['5-6ans', '5-6 ans'],
    ['1 an', '1 an'],
    ['6A (116cm)', '6 ans (116cm)'],
    ['18M', '18 mois'],
    ['9 MOIS', '9 mois'],
    ['xl', 'XL'],
    ['bebe', 'Bébé'],
    ['EU 42', 'EU 42'],
  ])('réécrit « %s » en « %s » sans retirer de mot', (value, expected) => {
    expect(normalizeSize(value)).toEqual({ size: expected, removed: [] })
  })

  // Seuls les mots d'une taille sont gardés (liste exhaustive dans
  // predeposit-size.ts) : les autres sont retirés et rendus pour la simulation.
  it.each([
    ['Pointure 31/32', '31/32', ['Pointure']],
    ['Taille 149', '149', ['Taille']],
    ['29 (taille 18,5)', '29 (18,5)', ['taille']],
    ['Pointure XS 23 - 36/37 Euphoria', 'XS 23 - 36/37', ['Pointure', 'Euphoria']],
    ['Pointure : 38', '38', ['Pointure']],
    ['(environ)', '', ['environ']],
  ])('réduit « %s » à « %s » en retirant %j', (value, size, removed) => {
    expect(normalizeSize(value)).toEqual({ size, removed })
  })
})
