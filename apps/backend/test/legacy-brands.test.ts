import { describe, expect, it } from 'vitest'
import { brands } from '../../frontend/src/types/brands'
import { marques } from '../src/scripts/import/marques'

describe("marques de l'ancien export (identifiant → nom)", () => {
  // Une marque renommée dans la liste doit l'être aussi ici, sinon l'import
  // de l'ancien export écrit un nom que le formulaire ne propose plus.
  it('ne donne que des noms de la liste des marques', () => {
    const known = new Set(brands)
    expect(Object.values(marques).filter((name) => !known.has(name))).toEqual([])
  })
})
