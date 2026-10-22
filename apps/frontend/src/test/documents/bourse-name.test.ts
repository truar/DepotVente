import { describe, expect, it } from 'vitest'

// The event is « Bourse aux skis », with an x to both words: on every état
// and in the name the browser and the installed app show.
const sources = import.meta.glob<string>(
  ['/src/pdf/*.tsx', '/index.html', '/vite.config.ts'],
  { query: '?raw', import: 'default', eager: true },
)

describe('The name of the bourse', () => {
  it('reads « Bourse aux skis » on every état and in the app title', () => {
    const misspelled = Object.entries(sources).flatMap(([path, text]) =>
      (text.match(/bourse aux? skis?\b/gi) ?? [])
        .filter((name) => name.toLowerCase() !== 'bourse aux skis')
        .map((name) => `${path}: ${name}`),
    )
    expect(misspelled).toEqual([])
  })
})
