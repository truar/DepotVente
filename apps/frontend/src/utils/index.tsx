export function generateArticleIndex(articleIndex: number) {
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
