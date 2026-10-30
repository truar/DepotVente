import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import {
  type KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { SquarePenIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type Article, db } from '@/db.ts'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Combobox } from '@/components/Combobox.tsx'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { articleColumns } from '@/components/custom/articleColumns.tsx'
import { alertNoDymoPrinter, articleLabel, useDymo } from '@/hooks/useDymo.ts'
import { showErrorAlert } from '@/stores/errorAlertStore'
import { compareIdentificationLetters, normalizeArticleCode } from '@/utils'

export const Route = createFileRoute('/deposits/articles/')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  return (
    <Page
      title="Liste des articles"
      navigation={<Link to="/deposits">Retour au menu</Link>}
    >
      <div className="flex flex-col gap-5">
        <ArticleSearchInput />
        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <ArticleList />
        </div>
      </div>
    </Page>
  )
}

// Le code scanné (ou tapé) ouvre l'article à corriger.
function ArticleSearchInput() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string>('')
  const submit = useCallback(async () => {
    const searched = code.trim()
    setCode('')
    if (!searched) return
    const article = await db.articles.where({ code: searched }).first()
    if (!article) {
      showErrorAlert(`La référence ${searched} n'existe pas`)
      return
    }
    await navigate({
      to: '/deposits/articles/$articleId/edit',
      params: { articleId: article.id },
    })
  }, [code, navigate])
  const checkKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Sans cela, la même frappe valide aussi le bouton qui prend le focus
        // dans l'alerte qui vient de s'ouvrir (« OK »).
        e.preventDefault()
        void submit()
      }
    },
    [submit],
  )
  return (
    <div className="flex gap-3">
      <div>
        <Input
          value={code}
          onChange={(e) => setCode(normalizeArticleCode(e.target.value))}
          placeholder="Ex: 2026 1001A"
          onKeyDown={checkKeyDown}
          autoFocus
        />
      </div>
      <div>
        <CustomButton onClick={submit}>Rechercher</CustomButton>
      </div>
    </div>
  )
}

const statusLabels: Record<Article['status'], string> = {
  RECEPTION_PENDING: 'Réception en attente',
  RECEPTION_OK: 'Réception OK',
  SOLD: 'Vendu',
  DELETED: 'Supprimé',
  ABSENT: 'Absent',
  RETURNED: 'Restitué',
}

const columns: ColumnDef<Article>[] = [
  {
    id: 'select',
    size: 40,
    header: ({ table }) => <TickAllBox table={table} />,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Sélectionner ${row.original.code}`}
      />
    ),
  },
  // La fiche de l'article, masquée : c'est la colonne que filtre le choix du
  // vendeur, au-dessus de la table.
  {
    id: 'depositId',
    accessorKey: 'depositId',
    filterFn: 'equals',
  },
  ...articleColumns,
  {
    id: 'status',
    accessorFn: (article) => statusLabels[article.status],
    header: 'Statut',
    meta: {
      filterVariant: 'select',
      filterOptions: Object.values(statusLabels),
    },
  },
  {
    id: 'actions',
    size: 40,
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon">
        <Link
          to="/deposits/articles/$articleId/edit"
          params={{ articleId: row.original.id }}
          aria-label={`Modifier ${row.original.code}`}
        >
          <SquarePenIcon />
        </Link>
      </Button>
    ),
  },
]

// Coche tout ce que les filtres laissent, toutes pages confondues, et pas
// seulement les lignes de la page affichée.
function TickAllBox({ table }: { table: Table<Article> }) {
  const rows = table
    .getFilteredRowModel()
    .rows.filter((row) => row.getCanSelect())
  const ticked = rows.filter((row) => row.getIsSelected()).length
  const checked =
    rows.length > 0 && ticked === rows.length
      ? true
      : ticked > 0
        ? 'indeterminate'
        : false
  return (
    <Checkbox
      checked={checked}
      disabled={rows.length === 0}
      onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
      aria-label="Tout sélectionner"
    />
  )
}

const ALL_SELLERS = 'all'

type SellerItem = { label: string; value: string; keywords: Array<string> }

// Toutes les fiches, particuliers et pros, par numéro de fiche.
function useSellerItems(): Array<SellerItem> {
  const deposits = useLiveQuery(() => db.deposits.toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  return useMemo(() => {
    const contactsById = new Map(
      (contacts ?? []).map((contact) => [contact.id, contact]),
    )
    const sellers = [...(deposits ?? [])]
      .sort((a, b) => a.depositIndex - b.depositIndex)
      .flatMap((deposit) => {
        const contact = contactsById.get(deposit.sellerId)
        if (!contact) return []
        return [
          {
            label: `${deposit.depositIndex} - ${contact.firstName} ${contact.lastName}`,
            value: deposit.id,
            keywords: [
              contact.firstName,
              contact.lastName,
              `${deposit.depositIndex}`,
            ],
          },
        ]
      })
    return [
      {
        label: 'Tous les vendeurs',
        value: ALL_SELLERS,
        keywords: ['tous les vendeurs'],
      },
      ...sellers,
    ]
  }, [deposits, contacts])
}

function ArticleList() {
  // Fiche par fiche, puis lettre par lettre (B avant AA).
  const articles = useLiveQuery(async () => {
    const rows = await db.articles.toArray()
    return rows.sort(
      (a, b) =>
        a.depositIndex - b.depositIndex ||
        compareIdentificationLetters(
          a.identificationLetter,
          b.identificationLetter,
        ),
    )
  })
  const sellers = useSellerItems()
  const data = useMemo(() => articles ?? [], [articles])

  if (!articles) return null

  return (
    <DataTable
      columns={columns}
      columnVisibility={{ depositId: false }}
      data={data}
      enableColumnSort
      enableColumnFilters
      hideGlobalFilter
      initialPageSize={50}
      getRowId={(article) => article.id}
      // Un article supprimé a quitté le dépôt : son étiquette ne se
      // réimprime pas, comme sur l'écran « Modifier un article ».
      canSelectRow={(article) => article.status !== 'DELETED'}
      headerActions={(table) => (
        <ArticleListActions table={table} sellers={sellers} />
      )}
    />
  )
}

type ArticleListActionsProps = {
  table: Table<Article>
  sellers: Array<SellerItem>
}

function ArticleListActions(props: ArticleListActionsProps) {
  const { table, sellers } = props
  const sellerColumn = table.getColumn('depositId')
  const seller =
    (sellerColumn?.getFilterValue() as string | undefined) ?? ALL_SELLERS
  const pickSeller = useCallback(
    (value: string) =>
      sellerColumn?.setFilterValue(
        value && value !== ALL_SELLERS ? value : undefined,
      ),
    [sellerColumn],
  )
  return (
    <div className="flex flex-1 items-center justify-between gap-3">
      <div className="w-[500px]">
        <Combobox
          emptyLabel="Aucun vendeur"
          items={sellers}
          value={seller}
          onSelect={pickSeller}
          placeholder="Rechercher un vendeur"
        />
      </div>
      <PrintLabelsButton table={table} />
    </div>
  )
}

const labelCount = (count: number) =>
  count > 1 ? `${count} étiquettes` : `${count} étiquette`

// Ce qui reste coché reste à imprimer : après une panne, relancer
// l'impression n'imprime pas deux fois les étiquettes déjà sorties.
const stillTicked = "Les articles encore cochés n'ont pas été imprimés."

function PrintLabelsButton({ table }: { table: Table<Article> }) {
  const dymo = useDymo()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [printing, setPrinting] = useState(false)
  // Dans l'ordre affiché, et seulement ce que les filtres laissent voir :
  // une ligne cochée puis masquée par un filtre n'est pas imprimée.
  const ticked = table
    .getSortedRowModel()
    .rows.filter((row) => row.getIsSelected())
    .map((row) => row.original)

  const print = async () => {
    setPrinting(true)
    const printed: Array<string> = []
    try {
      for (const article of ticked) {
        if (!(await dymo.print(articleLabel(article)))) {
          alertNoDymoPrinter(stillTicked)
          return
        }
        printed.push(article.id)
      }
      toast.success(
        `${labelCount(printed.length)} ${printed.length > 1 ? 'imprimées' : 'imprimée'}`,
      )
    } catch {
      showErrorAlert(`L'impression des étiquettes a échoué. ${stillTicked}`)
    } finally {
      table.setRowSelection((selection) => {
        const next = { ...selection }
        for (const id of printed) delete next[id]
        return next
      })
      setPrinting(false)
    }
  }

  return (
    <>
      <CustomButton
        type="button"
        disabled={ticked.length === 0 || printing}
        onClick={() => setConfirmOpen(true)}
      >
        Imprimer les étiquettes
        {ticked.length > 0 && ` (${ticked.length})`}
      </CustomButton>
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Imprimer ${labelCount(ticked.length)}\u00a0?`}
        onConfirm={print}
      />
    </>
  )
}
