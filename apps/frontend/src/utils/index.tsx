export function generateIdentificationLetter(articleIndex: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  let index = articleIndex

  while (index >= 0) {
    result = alphabet[index % 26] + result
    index = Math.floor(index / 26) - 1
  }

  return result
}

export function generateArticleCode(
  year: number,
  depotIndex: number,
  articleIndex: string,
) {
  // Combine all parts into the final code
  return `${year} ${depotIndex}${articleIndex}`
}

export function shortArticleCode(
  depositIndex: number,
  identificationLetter: string,
) {
  return `${depositIndex} ${identificationLetter}`
}

export function timeout(delay: number) {
  return new Promise((res) => setTimeout(res, delay))
}

export function getYear() {
  return new Date().getFullYear()
}

export function computeContributionAmount(articleCount: number) {
  return (Math.floor((articleCount - 1) / 10) + 1) * 2
}

export function numberToFrenchWords(input: number | string): string {
  // Accept "85,50" as well as 85.5
  const normalized =
    typeof input === 'string' ? input.trim().replace(',', '.') : `${input}`

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return ''

  // Work in cents to avoid floating issues
  const totalCents = Math.round(parsed * 100)
  const integerPart = Math.floor(totalCents / 100)
  const centsPart = totalCents % 100

  const units = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
  ]

  const tens = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante', // 70s use base 60
    'quatre-vingt', // 80s
    'quatre-vingt', // 90s use base 80
  ]

  function convertLessThanHundred(n: number): string {
    if (n < 20) return units[n]

    const ten = Math.floor(n / 10)
    const unit = n % 10

    // 20-69
    if (n < 70) {
      const tensStr = tens[ten]
      if (unit === 0) return tensStr
      if (unit === 1) return `${tensStr} et un`
      return `${tensStr}-${units[unit]}`
    }

    // 70-79
    if (n < 80) {
      const tensStr = 'soixante'
      if (n === 71) return `${tensStr} et onze`
      return `${tensStr}-${units[n - 60]}`
    }

    // 80-99
    const tensStr = 'quatre-vingt'
    if (n === 80) return `${tensStr}s`
    return `${tensStr}-${units[n - 80]}`
  }

  function convertHundreds(n: number): string {
    if (n < 100) return convertLessThanHundred(n)

    const hundred = Math.floor(n / 100)
    const remainder = n % 100
    let result = ''

    if (hundred === 1) {
      result = 'cent'
    } else {
      result = `${units[hundred]} cent`
      if (remainder === 0) result += 's'
    }

    if (remainder > 0) {
      result += ` ${convertLessThanHundred(remainder)}`
    }

    return result
  }

  function convertUpTo9999(n: number): string {
    if (n === 0) return 'zéro'
    if (n < 1000) return convertHundreds(n)

    const thousand = Math.floor(n / 1000)
    const remainder = n % 1000

    let result =
      thousand === 1 ? 'mille' : `${convertLessThanHundred(thousand)} mille`

    if (remainder > 0) {
      result += ` ${convertHundreds(remainder)}`
    }

    return result
  }

  const integerWords = convertUpTo9999(integerPart)

  if (centsPart === 0) return `${integerWords} euro`

  const centsWords = convertLessThanHundred(centsPart)
  return `${integerWords} euro et ${centsWords} centimes`
}
