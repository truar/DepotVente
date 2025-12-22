import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { getYear } from '@/utils'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { EyeIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import {
  type PdfProps,
  type PdfsProps,
  PredepositPdf,
  PredepositsPdf,
} from '@/pdf/predeposit-pdf.tsx'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/deposits/predeposits')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

async function createPdfData(
  id: string,
): Promise<PdfProps['data'] | undefined> {
  const year = getYear()
  const predeposit = await db.predeposits.get(id)
  if (!predeposit) return undefined

  const articles = await db.predepositArticles
    .where({ predepositId: predeposit.id })
    .sortBy('articleIndex')

  return {
    deposit: {
      depositIndex: predeposit.predepositIndex,
      year: year,
    },
    contact: {
      lastName: predeposit.sellerLastName,
      firstName: predeposit.sellerFirstName,
      city: predeposit.sellerCity,
      phoneNumber: predeposit.sellerPhoneNumber,
    },
    articles: articles.map((article) => ({
      shortCode: article.identificationLetter,
      discipline: article.discipline,
      size: article.size,
      price: article.price,
      brand: article.brand,
      model: article.model,
      color: article.color,
      category: article.category,
    })),
  }
}

function RouteComponent() {
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Gérer les fiches des pré-dépôts"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <PredepositDataTable />
      </div>
    </Page>
  )
}

function PredepositDataTable() {
  const predeposits = useLiveQuery(() =>
    db.predeposits.offset(0).sortBy('predepositIndex'),
  )
  const data: TableType[] = useMemo(
    () =>
      predeposits?.map((predeposit) => ({
        predepositId: predeposit.id,
        depositId: predeposit.depositId,
        index: predeposit.predepositIndex,
        status: predeposit.depositId ? 'CONFIRMÉ' : 'NON CONFIRMÉ',
        seller: `${predeposit.sellerLastName} ${predeposit.sellerFirstName}`,
      })) ?? [],
    [predeposits],
  )

  return (
    <>
      <DataTable
        columnVisibility={{
          predepositId: false,
        }}
        columns={columns}
        data={data}
        headerActions={(table) => <DataTableHeaderAction table={table} />}
      />
      <PredepositsSummary />
    </>
  )
}

export type TableType = {
  predepositId: string
  depositId?: string
  index: number
  status: string
  seller: string
}

export const columns: ColumnDef<TableType>[] = [
  {
    id: 'predepositId',
    accessorKey: 'predepositId',
  },
  {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tous sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner une ligne"
      />
    ),
  },
  {
    accessorKey: 'index',
    header: 'Identifiant',
  },
  {
    accessorKey: 'seller',
    header: 'Déposant',
  },
  {
    id: 'depositId',
    header: 'Numéro de fiche',
    cell: ({ row }) => {
      const deposit = useLiveQuery(() =>
        row.original.depositId
          ? db.deposits.get(row.original.depositId)
          : undefined,
      )

      return <p>{deposit?.depositIndex}</p>
    },
  },
  {
    id: 'countArticles',
    header: "Nombre d'articles",
    cell: ({ row }) => {
      const articlesCount = useLiveQuery(() =>
        db.predepositArticles
          .where({ predepositId: row.original.predepositId })
          .count(),
      )

      return <p>{articlesCount}</p>
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
  },
  {
    id: 'amount',
    header: 'Montant',
    cell: ({ row }) => {
      const articles = useLiveQuery(() =>
        db.predepositArticles
          .where({ predepositId: row.original.predepositId })
          .toArray(),
      )
      const sum =
        articles?.reduce(
          (acc, article) => acc + parseFloat(`${article.price}`),
          0,
        ) ?? 0

      return (
        <p className="text-right pr-3">
          <FormattedNumber value={sum} style="currency" currency="EUR" />
        </p>
      )
    },
  },
  {
    id: 'actions',
    size: 30,
    cell: ({ row }) => {
      const id = row.original.predepositId
      const print = useCallback(async (predepositId: string) => {
        const data = await createPdfData(predepositId)
        if (!data) return
        await printPdf(<PredepositPdf data={data} />)
      }, [])
      return (
        <div>
          <Button variant="ghost" size="icon" onClick={() => print(id)}>
            <EyeIcon />
          </Button>
        </div>
      )
    },
  },
]

type DataTableHeaderActionProps = {
  table: Table<TableType>
}
function DataTableHeaderAction({ table }: DataTableHeaderActionProps) {
  const print = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.predepositId)

    const pdfData: PdfsProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await createPdfData(id)
      if (data) {
        pdfData.push(data)
      }
    }

    await printPdf(<PredepositsPdf data={pdfData} />)
  }

  return (
    <div>
      <CustomButton onClick={print}>Imprimer les pré-dépôts</CustomButton>
    </div>
  )
}

function PredepositsSummary() {
  const predepositArticles = useLiveQuery(() => db.predepositArticles.toArray())
  const predeposits = useLiveQuery(() => db.predeposits.toArray())
  const notConfirmed =
    predeposits?.filter((predeposit) => !predeposit.depositId).length ?? 0
  const total =
    predepositArticles?.reduce(
      (acc, article) => acc + parseFloat(`${article.price}`),
      0,
    ) ?? 0
  const count = predepositArticles?.length ?? 0

  return (
    <div className="flex flew-row gap-5 font-bold">
      <p>Nombre de Non Confirmés: {notConfirmed}</p>
      <p>Nombre d'articles: {count}</p>
      <p>
        Montant total:{' '}
        <FormattedNumber value={total} style="currency" currency="EUR" />
      </p>
    </div>
  )
}
