import { type ColumnDef } from '@tanstack/react-table'
import { type Article } from '@/db.ts'
import { compareIdentificationLetters } from '@/utils'

export const articleColumns: ColumnDef<Article>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 100,
    sortingFn: (a, b) =>
      compareIdentificationLetters(
        a.original.identificationLetter,
        b.original.identificationLetter,
      ),
    meta: { filterVariant: 'text' },
  },
  {
    accessorKey: 'discipline',
    header: 'Discipline',
    meta: { filterVariant: 'select' },
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
    sortingFn: (a, b) =>
      a.original.category.localeCompare(b.original.category, 'fr'),
    meta: { filterVariant: 'select' },
  },
  {
    accessorKey: 'brand',
    header: 'Marque',
    sortingFn: (a, b) =>
      a.original.brand.localeCompare(b.original.brand, 'fr'),
    meta: { filterVariant: 'select' },
  },
  {
    accessorKey: 'model',
    header: 'Descriptif',
    sortingFn: (a, b) =>
      a.original.model.localeCompare(b.original.model, 'fr'),
    meta: { filterVariant: 'text' },
  },
  {
    accessorKey: 'color',
    header: 'Couleur',
    sortingFn: (a, b) =>
      a.original.color.localeCompare(b.original.color, 'fr'),
    meta: { filterVariant: 'select' },
  },
  {
    accessorKey: 'size',
    header: 'Taille',
    meta: { filterVariant: 'select' },
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ getValue }) => `${getValue<number>()}€`,
  },
]
