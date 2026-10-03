// Amounts as the screens write them, in French, read back by the page
// objects.

// « 1 234,50 € », « -19,47 » or « 30,30 » -> 1234.5, -19.47, 30.3. Only for
// what the screen formats: a raw « 6.53 » typed in a field would lose its
// point.
export const euros = (text: string) =>
  Number(text.replace(/[^\d,-]/g, '').replace(',', '.'))

// Spaces as the screen writes them (Intl puts narrow no-break spaces
// around the € and between thousands) read as plain spaces.
export const plain = (text: string) => text.replace(/\s+/g, ' ').trim()
