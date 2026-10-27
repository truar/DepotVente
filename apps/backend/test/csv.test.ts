import { describe, expect, it } from 'vitest'
import { parseCsv } from '../src/scripts/import/csv'

describe('parseCsv (exports CSV des imports)', () => {
  it('lit les champs entre guillemets : virgules, guillemets doublés, retours à la ligne', () => {
    expect(parseCsv('a,"b, c","d ""e""","f\ng"\r\n1,2,3,4\n')).toEqual([
      ['a', 'b, c', 'd "e"', 'f\ng'],
      ['1', '2', '3', '4'],
    ])
  })

  it('retire le BOM et les lignes vides', () => {
    expect(parseCsv('﻿a,b\n\n,\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})
