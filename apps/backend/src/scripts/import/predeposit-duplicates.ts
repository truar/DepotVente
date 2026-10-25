// Doublons entre réponses du Google Form « Pré-enregistrement bourse au ski ».

export interface ArticleInput {
  category: string
  discipline: string
  brand: string
  model: string
  size: string
  color: string
  price: number
}

export interface Response {
  number: number
  createdAt: Date
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  city: string
  articles: ArticleInput[]
}

// Forme de comparaison d'un nom : minuscules, sans accent, sans rien d'autre
// que lettres et chiffres.
function nameKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Regroupe les réponses qui partagent un téléphone, un email ou un nom +
// prénom (union-find). Ne renvoie que les groupes d'au moins deux réponses.
export function findDuplicates(responses: Response[]): Response[][] {
  const parent = responses.map((_, index) => index)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const seen = new Map<string, number>()
  responses.forEach((response, index) => {
    const keys = [
      response.phoneNumber && `tel:${response.phoneNumber}`,
      response.email && `mail:${response.email}`,
      `nom:${nameKey(response.lastName)}|${nameKey(response.firstName)}`,
    ].filter(Boolean) as string[]
    for (const k of keys) {
      const other = seen.get(k)
      if (other === undefined) seen.set(k, index)
      else parent[find(index)] = find(other)
    }
  })
  const groups = new Map<number, Response[]>()
  responses.forEach((response, index) => {
    const root = find(index)
    groups.set(root, [...(groups.get(root) ?? []), response])
  })
  return [...groups.values()].filter((group) => group.length > 1)
}

// La personne derrière une réponse : nom, prénom et téléphone. Sans
// téléphone, on ne peut pas dire que c'est la même personne.
function sellerKey(response: Response): string | undefined {
  if (response.phoneNumber === '') return undefined
  return `${nameKey(response.lastName)}|${nameKey(response.firstName)}|${response.phoneNumber}`
}

// Ce qui identifie un objet d'un envoi à l'autre. Le descriptif et la couleur,
// en texte libre, sont souvent ressaisis autrement quand le formulaire est
// renvoyé (« Cloud 6 » puis « CLOUD 6 », « Blanc gris » puis « BLANCHE ») :
// ils n'en font pas partie.
function articleKey(article: ArticleInput): string {
  return JSON.stringify([article.category, article.discipline, article.brand, article.size, article.price])
}

export interface SellerMerge {
  // Dans l'ordre d'envoi : la dernière donne les coordonnées de la fiche.
  responses: Response[]
  articles: ArticleInput[]
  // Formulaire envoyé plusieurs fois avec les mêmes articles : on ne les
  // garde qu'une fois.
  repeated: boolean
}

// Les réponses d'une même personne (mêmes nom, prénom et téléphone, sans
// casse ni accent) ne font qu'une fiche, sans arbitrage : quelqu'un qui a fait
// deux dépôts, ou qui a renvoyé le formulaire. Les articles sont mis à la
// suite ; si toutes les réponses ont les mêmes articles (articleKey), on ne
// garde que ceux de la plus récente. Quand une partie seulement se répète, on ne peut
// pas savoir si c'est un renvoi ou deux objets identiques : le groupe est
// rendu dans `partial`, pour qu'on appelle le vendeur. Les réponses déjà
// arbitrées en option (`decided`) ne sont pas touchées.
export function sameSeller(
  responses: Response[],
  decided: Set<number>,
): { merges: SellerMerge[]; partial: Response[][] } {
  const groups = new Map<string, Response[]>()
  for (const response of responses) {
    const k = sellerKey(response)
    if (k !== undefined) groups.set(k, [...(groups.get(k) ?? []), response])
  }
  const merges: SellerMerge[] = []
  const partial: Response[][] = []
  for (const group of groups.values()) {
    if (group.length < 2 || group.some((response) => decided.has(response.number))) continue
    const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const lists = sorted.map((response) => response.articles.map(articleKey).sort().join('\n'))
    if (lists.every((list) => list === lists[0])) {
      merges.push({ responses: sorted, articles: sorted[sorted.length - 1].articles, repeated: true })
      continue
    }
    const owners = new Map<string, Set<number>>()
    for (const response of sorted) {
      for (const article of response.articles) {
        const k = articleKey(article)
        owners.set(k, (owners.get(k) ?? new Set()).add(response.number))
      }
    }
    if ([...owners.values()].some((numbers) => numbers.size > 1)) {
      partial.push(sorted)
      continue
    }
    merges.push({ responses: sorted, articles: sorted.flatMap((response) => response.articles), repeated: false })
  }
  return { merges, partial }
}

// Pourquoi un groupe de doublons attend un arbitrage :
//   same-phone   un même téléphone sous des noms différents ;
//   same-seller  une même personne dont une partie des articles se répète ;
//   other        un même email ou un même nom, avec un autre téléphone.
// Les deux premiers demandent d'appeler le vendeur.
export function duplicateReason(group: Response[]): 'same-phone' | 'same-seller' | 'other' {
  const names = new Map<string, Set<string>>()
  const sellers = new Set<string>()
  let repeatedSeller = false
  for (const response of group) {
    if (response.phoneNumber === '') continue
    const name = `${nameKey(response.lastName)}|${nameKey(response.firstName)}`
    names.set(response.phoneNumber, (names.get(response.phoneNumber) ?? new Set()).add(name))
    const seller = sellerKey(response)!
    if (sellers.has(seller)) repeatedSeller = true
    sellers.add(seller)
  }
  if ([...names.values()].some((set) => set.size > 1)) return 'same-phone'
  return repeatedSeller ? 'same-seller' : 'other'
}
