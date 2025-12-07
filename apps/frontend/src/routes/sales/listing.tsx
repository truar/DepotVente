import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { type Contact, db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { SquarePenIcon } from 'lucide-react'
import { useMemo } from 'react'

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
    [contactMap],
  )

  return (
    <DataTable
      columnVisibility={{
        saleId: false,
      }}
      columns={columns}
      data={data}
    />
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
    accessorKey: 'buyer',
    header: 'Acheteur',
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
