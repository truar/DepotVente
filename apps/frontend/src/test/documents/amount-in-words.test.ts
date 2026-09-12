import { describe, expect, it } from 'vitest'
import { numberToFrenchWords } from '@/utils'

// The seller's cheque carries the amount in letters, and it is the wording
// that makes the cheque valid. Singular below two, plural from two on, on
// both halves.
describe('An amount written in letters', () => {
  it.each([
    [0, 'zéro euro'],
    [1, 'un euro'],
    [2, 'deux euros'],
    [180, 'cent quatre-vingts euros'],
    [1.01, 'un euro et un centime'],
    [1.5, 'un euro et cinquante centimes'],
    [21.02, 'vingt et un euros et deux centimes'],
    [72.68, 'soixante-douze euros et soixante-huit centimes'],
  ])('writes %s as "%s"', (amount, words) => {
    expect(numberToFrenchWords(amount)).toBe(words)
  })

  // What a seller is owed is stored unrounded; the cheque rounds to the cent.
  it('rounds a half cent to the nearest cent', () => {
    expect(numberToFrenchWords(72.675)).toBe(
      'soixante-douze euros et soixante-huit centimes',
    )
  })
})
