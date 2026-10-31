import writeXlsxFile, { type Column } from 'write-excel-file/browser'
import { type Article, type Contact, articleStatusLabels, db } from '@/db.ts'

// Export Excel de tous les articles d'une fiche, demandé par les pros en fin
// de bourse : une ligne par article, dans l'ordre de la fiche, avec tous ses
// champs sauf le message d'alerte destiné au caissier (saleAlert), plus une
// colonne VENDU (OUI quand le statut est « Vendu »). Tout vient de
// l'IndexedDB locale, comme le reste des écrans.
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

// Excel n'a pas de fuseau horaire : il affiche une date telle qu'elle est
// écrite. write-excel-file écrirait l'heure UTC ; on écrit l'heure locale du
// PC, celle que montrent les écrans. Synchronisée depuis le serveur, une
// date arrive en chaîne ISO.
const dateTime = (value: Date | string | null | undefined) => {
  if (!value) return null
  const date = new Date(value)
  return {
    value: new Date(date.getTime() - date.getTimezoneOffset() * 60_000),
    format: 'dd/mm/yyyy hh:mm:ss',
  }
}

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
  { header: header('Année'), cell: (a) => a.year, width: 7 },
  { header: header('N° fiche'), cell: (a) => a.depositIndex, width: 9 },
  {
    header: header('Lettre'),
    cell: (a) => text(a.identificationLetter),
    width: 7,
  },
  { header: header('N° article'), cell: (a) => a.articleIndex, width: 10 },
  {
    header: header('Statut'),
    cell: (a) => articleStatusLabels[a.status],
    width: 18,
  },
  {
    header: header('VENDU'),
    cell: (a) => ({
      value: a.status === 'SOLD' ? 'OUI' : 'NON',
      align: 'center' as const,
    }),
    width: 8,
  },
  { header: header('Créé le'), cell: (a) => dateTime(a.createdAt), width: 19 },
  {
    header: header('Modifié le'),
    cell: (a) => dateTime(a.updatedAt),
    width: 19,
  },
  {
    header: header('Supprimé le'),
    cell: (a) => dateTime(a.deletedAt),
    width: 19,
  },
  { header: header('id'), cell: (a) => a.id, width: 38 },
  { header: header('depositId'), cell: (a) => a.depositId, width: 38 },
  { header: header('saleId'), cell: (a) => text(a.saleId), width: 38 },
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
