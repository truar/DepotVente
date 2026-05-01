import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { type Contact, db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { SquarePenIcon } from 'lucide-react'
import { useMemo } from 'react'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/sales/listing')({
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

function RouteComponent() {
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Gérer les ventes"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <SalesDataTable />
      </div>
    </Page>
  )
}

function SalesDataTable() {
  const sales = useLiveQuery(() => db.sales.offset(0).sortBy('saleIndex'))
  const contact = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(() => {
    return (
      contact?.reduce<Map<string, Contact>>((acc, el) => {
        acc.set(el.id, el)
        return acc
      }, new Map()) ?? new Map()
    )
  }, [contact])

  const data: DataTableType[] = useMemo(
    () =>
      sales?.map((sale) => {
        const seller = contactMap.get(sale.buyerId)
        return {
          saleId: sale.id,
          index: sale.saleIndex,
          buyer: `${seller?.lastName} ${seller?.firstName}`,
        }
      }) ?? [],
    [contactMap, sales],
  )

  return (
    <>
      <DataTable
        columnVisibility={{
          saleId: false,
        }}
        columns={columns}
        data={data}
        hideSelectionCount
      />
      <SalesSummary />
    </>
  )
}

function SalesSummary() {
  const sales = useLiveQuery(() => db.sales.toArray())
  const soldArticlesCount = useLiveQuery(() =>
    db.articles.filter((article) => article.status === 'SOLD').count(),
  )
  const count = sales?.length ?? 0
  const total =
    sales?.reduce(
      (acc, sale) =>
        acc +
        (sale.cardAmount ?? 0) +
        (sale.cashAmount ?? 0) +
        (sale.checkAmount ?? 0) +
        (sale.deferredAmount ?? 0) -
        (sale.totalRefundAmount ?? 0),
      0,
    ) ?? 0

  return (
    <div className="flex flew-row gap-5 font-bold">
      <p>Nombre de ventes: {count}</p>
      <p>Nombre d'articles vendus: {soldArticlesCount ?? 0}</p>
      <p>
        Montant total:{' '}
        <FormattedNumber value={total} style="currency" currency="EUR" />
      </p>
    </div>
  )
}

export type DataTableType = {
  saleId: string
  index: number
  buyer: string
}

export const columns: ColumnDef<DataTableType>[] = [
  {
    id: 'saleId',
    accessorKey: 'saleId',
  },
  {
    accessorKey: 'index',
    header: 'Identifiant',
  },
  {
    accessorKey: 'buyer',
    header: 'Acheteur',
  },
  {
    id: 'amount',
    header: 'Montant',
    cell: ({ row }) => {
      const articles = useLiveQuery(() =>
        db.articles.where({ saleId: row.original.saleId }).toArray(),
      )
      const sum =
        articles?.reduce((acc, article) => acc + article.price, 0) ?? 0

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
      const id = row.original.saleId
      return (
        <div>
          <Link to="/sales/$saleId/edit" params={{ saleId: id }}>
            <Button variant="ghost" size="icon">
              <SquarePenIcon />
            </Button>
          </Link>
        </div>
      )
    },
  },
]
