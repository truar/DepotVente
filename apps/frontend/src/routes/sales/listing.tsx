import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { type Contact, db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { ErrorDialog } from '@/components/custom/ErrorDialog.tsx'
import { InvoicesPdf, type InvoicesPdfProps } from '@/pdf/invoice-pdf.tsx'
import { loadInvoicePdfData } from '@/pdf/load-invoice-pdf-data.ts'
import { printPdf } from '@/pdf/print.tsx'
import { SquarePenIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/sales/listing')({
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
          workstation: sale.incrementStart,
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
        headerActions={(table) => <SalesDataTableHeaderAction table={table} />}
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
  workstation: number
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
    accessorKey: 'workstation',
    header: 'Caisse',
  },
  {
    id: 'amount',
    header: () => <div className="text-right pr-3">Montant</div>,
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

type SalesDataTableHeaderActionProps = {
  table: Table<DataTableType>
}

// Les factures de plusieurs ventes, dans un seul document : celles qui sont
// cochées, ou toutes celles que la liste garde (recherche comprise, toutes
// pages confondues). Chacune est la facture imprimée à la caisse.
function SalesDataTableHeaderAction({
  table,
}: SalesDataTableHeaderActionProps) {
  const [errorOpen, setErrorOpen] = useState(false)

  const printInvoices = async (saleIds: Array<string>) => {
    const invoices: InvoicesPdfProps['data'] = []
    for (const id of saleIds) {
      const invoice = await loadInvoicePdfData(id)
      if (invoice) invoices.push(invoice)
    }
    await printPdf(<InvoicesPdf data={invoices} />)
  }

  const printSelected = async () => {
    const saleIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.saleId)
    if (saleIds.length === 0) {
      setErrorOpen(true)
      return
    }
    await printInvoices(saleIds)
  }

  const printAll = async () => {
    const saleIds = table
      .getFilteredRowModel()
      .rows.map((row) => row.original.saleId)
    if (saleIds.length === 0) return
    await printInvoices(saleIds)
  }

  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={printSelected}>
        Imprimer les factures sélectionnées
      </CustomButton>
      <CustomButton onClick={printAll}>
        Imprimer toutes les factures
      </CustomButton>
      <ErrorDialog
        open={errorOpen}
        onOpenChange={setErrorOpen}
        description="Veuillez sélectionner au moins une vente."
      />
    </div>
  )
}
