import writeXlsxFile, { type Column } from 'write-excel-file/browser'
import { type Article, type Contact, db } from '@/db.ts'

// Export Excel de tous les articles d'une fiche, demandé par les pros en fin
// de bourse : une ligne par article, dans l'ordre de la fiche, avec ce qui
// décrit l'article pour le pro, plus une colonne VENDU (OUI quand le statut
// est « Vendu »). Rien d'interne à notre système (statut, dates, ids,
// numéros de fiche et d'article, année), ni le message d'alerte destiné au
// caissier. Tout vient de l'IndexedDB locale, comme le reste des écrans.
export async function exportDepositArticlesXlsx(
  depositId: string,
): Promise<void> {
  const deposit = await db.deposits.get(depositId)
  if (!deposit) return
  const seller = await db.contacts.get(deposit.sellerId)
  const articles = await db.articles.where({ depositId }).toArray()
  articles.sort((a, b) => a.articleIndex - b.articleIndex)

  await writeXlsxFile(articles, {
    columns,
    sheet: `Fiche ${deposit.depositIndex}`,
    stickyRowsCount: 1,
  }).toFile(fileName(deposit.depositIndex, seller))
}

const header = (value: string) => ({ value, fontWeight: 'bold' as const })

// Une chaîne vide s'exporte comme une cellule vide.
const text = (value: string | null | undefined) => value || null

// Synchronisé depuis le serveur, un prix arrive en chaîne (Decimal Prisma).
const price = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === ''
    ? null
    : { value: Number(value), format: '#,##0.00 "€"' }

const columns: Array<Column<Article>> = [
  { header: header('Code'), cell: (a) => a.code, width: 12 },
  { header: header('Prix'), cell: (a) => price(a.price), width: 10 },
  { header: header('Catégorie'), cell: (a) => text(a.category), width: 16 },
  { header: header('Discipline'), cell: (a) => text(a.discipline), width: 12 },
  { header: header('Marque'), cell: (a) => text(a.brand), width: 18 },
  { header: header('Modèle'), cell: (a) => text(a.model), width: 26 },
  {
    header: header('N° de série'),
    cell: (a) => text(a.serialNumber),
    width: 20,
  },
  { header: header('Taille'), cell: (a) => text(a.size), width: 8 },
  { header: header('Couleur'), cell: (a) => text(a.color), width: 12 },
  {
    header: header('VENDU'),
    cell: (a) => ({
      value: a.status === 'SOLD' ? 'OUI' : 'NON',
      align: 'center' as const,
    }),
    width: 8,
  },
]

// « articles-fiche-4-ALLOSKI.xlsx » : le nom du vendeur sans accents ni
// caractères qu'un système de fichiers pourrait refuser.
function fileName(depositIndex: number, seller: Contact | undefined): string {
  const name = [seller?.lastName, seller?.firstName]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return name
    ? `articles-fiche-${depositIndex}-${name}.xlsx`
    : `articles-fiche-${depositIndex}.xlsx`
}
