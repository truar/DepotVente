import { describe, expect, it } from 'vitest'
import { findBrand } from '../src/scripts/import/predeposit-brand'

describe('findBrand (import des pré-dépôts du Google Form)', () => {
  it.each([
    ['Salomon', 'Salomon'],
    ['ROSSIGNOL', 'Rossignol'],
    ['Black Diamond', 'Black Diamond'],
    ['Queschua', 'Quechua'],
    ['Colombia', 'Columbia'],
  ])('reconnaît « %s » comme %s', (value, brand) => {
    expect(findBrand(value)).toEqual({ brand, rest: '' })
  })

  // Saisies des pré-dépôts 2026 qui ne sont pas des marques, ou introuvables.
  it.each(['CORED', 'Happy', 'Pop', 'Baby shoes', 'Pantalon V', ''])('ne trouve pas de marque dans « %s »', (value) => {
    expect(findBrand(value)).toEqual({ brand: undefined, rest: '' })
  })

  // La marque textile de Super U s'écrit de plusieurs façons.
  it.each(['U-Oxyg', 'U Oxyg', 'U-OXYG', 'UOXYG', 'U Oxygn', "U Oxyg'n", 'Oxyg', 'OXYGN'])(
    'reconnaît « %s » comme U-Oxyg',
    (value) => {
      expect(findBrand(value)).toEqual({ brand: 'U-Oxyg', rest: '' })
    },
  )

  // Marques saisies dans les pré-dépôts 2026, vérifiées puis ajoutées à la
  // liste, telles que les vendeurs les ont écrites.
  it.each([
    ['Aigle', 'Aigle'],
    ['Alpen gaudi', 'AlpenGaudi'],
    ['Béaba', 'Béaba'],
    ['GAP KIDS', 'Gap'],
    ['Grain de blé', 'Grain de Blé'],
    ['JONES', 'Jones'],
    ['Kiabi', 'Kiabi'],
    ['KIPSTA', 'Kipsta'],
    ['La compagnie des petits', 'La Compagnie des Petits'],
    ['Primark', 'Primark'],
    ['Primigi', 'Primigi'],
    ['Sevira kids', 'Sevira Kids'],
    ['Tissaia', 'Tissaia'],
    ['U-topik', 'U-Topik'],
    ['Utopik', 'U-Topik'],
    ['Vertigo', 'Vertigo'],
    ['Vertigo Alpes', 'Vertigo'],
    // Shaver est un modèle de snowboard enfant d'O'Sin, pas une marque.
    ['Shavers', 'Osin'],
    ['Original Sin', 'Osin'],
  ])('reconnaît « %s » comme %s', (value, brand) => {
    expect(findBrand(value)).toEqual({ brand, rest: '' })
  })

  // Quand une partie seulement du champ est une marque, le reste est rendu
  // pour partir au descriptif.
  it.each([
    ['ALPINA AJ 3', 'Alpina', 'AJ 3'],
    ['Rossignol Experience 80', 'Rossignol', 'Experience 80'],
    ['Veste Colombia', 'Columbia', 'Veste'],
    ['K2 Mindbender', 'K2', 'Mindbender'],
    // « Black » est aussi une marque : la plus longue suite de mots l'emporte.
    ['Black Diamond Expedition', 'Black Diamond', 'Expedition'],
    // À longueur égale, la plus à gauche.
    ['Salomon Rossignol', 'Salomon', 'Rossignol'],
  ])('trouve dans « %s » la marque %s, reste « %s »', (value, brand, rest) => {
    expect(findBrand(value)).toEqual({ brand, rest })
  })
})
