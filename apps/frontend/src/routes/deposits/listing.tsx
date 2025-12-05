import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { getYear } from '@/utils'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DepositPdf,
  type DepositPdfProps,
  DepositsPdf,
  type DepositsPdfProps,
} from '@/pdf/deposit-pdf.tsx'
import { type Contact, db, type Deposit } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { EyeIcon, SquarePenIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'

export const Route = createFileRoute('/deposits/listing')({
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

async function createDepositPdfData(
  id: string,
): Promise<DepositPdfProps['data'] | undefined> {
  const year = getYear()
  const deposit = await db.deposits.get(id)
  if (!deposit) return undefined

  const articles = await db.articles
    .where({ depositId: deposit.id })
    .sortBy('code')
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  return {
    deposit: {
      depositIndex: deposit.depositIndex,
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      year: year,
    },
    contact: {
      lastName: contact.lastName,
      firstName: contact.firstName,
      city: contact.city,
      phoneNumber: contact.phoneNumber,
    },
    articles: articles.map((article) => ({
      shortCode: article.depositIndex + ' ' + article.identificationLetter,
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
      title="Gérer les fiches des dépôts"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <DepositDataTable />
      </div>
    </Page>
  )
}

function DepositDataTable() {
  const deposits = useLiveQuery(() =>
    db.deposits.offset(0).sortBy('depositIndex'),
  )
  const contact = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(() => {
    return (
      contact?.reduce<Map<string, Contact>>((acc, el) => {
        acc.set(el.id, el)
        return acc
      }, new Map()) ?? new Map()
    )
  }, [contact])

  const data: DepositTableType[] = useMemo(
    () =>
      deposits?.map((deposit) => {
        const seller = contactMap.get(deposit.sellerId)
        return {
          depositId: deposit.id,
          index: deposit.depositIndex,
          type: deposit.type,
          seller: `${seller?.lastName} ${seller?.firstName}`,
        }
      }) ?? [],
    [contactMap],
  )

  return (
    <DataTable
      columnVisibility={{
        depositId: false,
      }}
      columns={columns}
      data={data}
      headerActions={(table) => <DepositDataTableHeaderAction table={table} />}
    />
  )
}

export type DepositTableType = {
  depositId: string
  index: number
  type: Deposit['type']
  seller: string
}

export const columns: ColumnDef<DepositTableType>[] = [
  {
    id: 'depositId',
    accessorKey: 'depositId',
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
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'seller',
    header: 'Déposant',
  },
  {
    id: 'actions',
    size: 30,
    cell: ({ row }) => {
      const id = row.original.depositId
      const print = useCallback(async (depositId: string) => {
        const data = await createDepositPdfData(depositId)
        if (!data) return
        await printPdf(<DepositPdf data={data} />)
      }, [])
      return (
        <div>
          <Link to="/deposits/$depositId/edit" params={{ depositId: id }}>
            <Button variant="ghost" size="icon">
              <SquarePenIcon />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => print(id)}>
            <EyeIcon />
          </Button>
        </div>
      )
    },
  },
]

type DepositDataTableHeaderActionProps = {
  table: Table<DepositTableType>
}
function DepositDataTableHeaderAction({
  table,
}: DepositDataTableHeaderActionProps) {
  const print = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    const depositsPdfData: DepositsPdfProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await createDepositPdfData(id)
      if (data) {
        depositsPdfData.push(data)
      }
    }

    await printPdf(<DepositsPdf data={depositsPdfData} />)
  }

  return (
    <div>
      <CustomButton onClick={print}>Imprimer les fiches</CustomButton>
    </div>
  )
}
