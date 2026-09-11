// Réarme des articles pro à scanner, sans réimporter la base.
//
// L'import réserve déjà, pour les fiches de PENDING_PRO_DEPOSIT_INDEXES, les
// N derniers articles de chaque catégorie en RECEPTION_PENDING. Ce script
// fait la même chose sur une base déjà en place : avant une répétition, ou
// après une répétition pour remettre le même lot à scanner.
//
//   pnpm --filter backend script:reserve-pro --fiches 2,3,4
//   pnpm --filter backend script:reserve-pro --fiches 4 --categories Skis --count 10
//   pnpm --filter backend script:reserve-pro --fiches 2,3,4 --dry-run
//
// Les articles vendus, supprimés ou rendus ne sont jamais touchés. Le lot est
// déterministe (les derniers `article_index` de la catégorie), donc rejouer le
// script redonne exactement le même lot.
import { prisma } from 'database'

const DEFAULT_FICHES = [2, 3, 4]
const DEFAULT_CATEGORIES = ['Skis', 'Chaussures']
const DEFAULT_COUNT = 30

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const fiches = (arg('fiches')?.split(',').map(Number) ?? DEFAULT_FICHES).filter(
  (fiche) => Number.isInteger(fiche),
)
const categories = arg('categories')?.split(',') ?? DEFAULT_CATEGORIES
const count = Number(arg('count') ?? DEFAULT_COUNT)
const dryRun = process.argv.includes('--dry-run')

async function main() {
  if (fiches.length === 0 || categories.length === 0 || !Number.isInteger(count)) {
    console.error('Usage: --fiches 2,3,4 [--categories Skis,Chaussures] [--count 30] [--dry-run]')
    process.exit(1)
  }

  console.log(
    `Réservation de ${count} article(s) par catégorie (${categories.join(', ')}) ` +
      `sur les fiches pro ${fiches.join(', ')}${dryRun ? ' — simulation' : ''}\n`,
  )

  for (const depositIndex of fiches) {
    const deposit = await prisma.deposit.findFirst({
      where: { depositIndex, type: 'PRO' },
      include: { seller: true },
    })
    if (!deposit) {
      console.warn(`  fiche ${depositIndex} : aucune fiche pro, ignorée`)
      continue
    }
    const name = deposit.seller?.lastName ?? '?'

    for (const category of categories) {
      // Les derniers articles de la catégorie, comme le fait l'import.
      // Vendus, supprimés et rendus exclus : on ne peut plus les scanner.
      const candidates = await prisma.article.findMany({
        where: {
          depositId: deposit.id,
          category,
          saleId: null,
          status: { in: ['RECEPTION_OK', 'RECEPTION_PENDING'] },
        },
        orderBy: { articleIndex: 'desc' },
        take: count,
        select: { id: true, code: true, status: true },
      })

      if (candidates.length < count) {
        console.warn(
          `  fiche ${depositIndex} (${name}) / ${category} : ` +
            `${candidates.length} article(s) disponibles seulement`,
        )
      }
      const toFlip = candidates.filter((a) => a.status !== 'RECEPTION_PENDING')
      if (!dryRun && toFlip.length > 0) {
        await prisma.article.updateMany({
          where: { id: { in: toFlip.map((a) => a.id) } },
          data: { status: 'RECEPTION_PENDING', updatedAt: new Date() },
        })
      }
      const codes = candidates.map((a) => a.code)
      console.log(
        `  fiche ${depositIndex} (${name}) / ${category} : ` +
          `${candidates.length} à scanner (${toFlip.length} remis en attente) ` +
          `— ${codes.at(-1)} … ${codes.at(0)}`,
      )
    }
  }

  console.log(
    '\nLes postes clients recevront le changement à leur prochain poll (20 s).',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
