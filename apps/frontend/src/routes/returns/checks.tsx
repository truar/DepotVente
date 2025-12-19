import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { type Contact, db } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useMemo } from 'react'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/returns/checks')({
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
      title="Visualiser les chèques"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <ChecksDataTable />
      </div>
    </Page>
  )
}

function ChecksDataTable() {
  const deposits = useLiveQuery(() =>
    db.deposits.offset(0).sortBy('depositIndex'),
  )
  const contact = useLiveQuery(() => db.contacts.toArray())
  const contactMap: Map<string, Contact> = useMemo(() => {
    return (
      contact?.reduce<Map<string, Contact>>((acc, el) => {
        acc.set(el.id, el)
        return acc
      }, new Map()) ?? new Map()
    )
  }, [contact])

  const data: CheckTableType[] = useMemo(
    () =>
      deposits
        ?.map((deposit) => {
          const seller = contactMap.get(deposit.sellerId)
          if (!seller) return
          // FIXME by reading the DB, collectedAt is a string `2025-11-01T14:58:00.000Z` not a Date
          const collectedAt = (
            deposit.collectedAt as string | undefined
          )?.split('T')
          return {
            depositId: deposit.id,
            index: deposit.depositIndex,
            seller: `${seller.lastName} ${seller.firstName}`,
            sellerAmount: deposit.sellerAmount,
            checkId: deposit.checkId,
            signatory: deposit.signatory,
            collectedAt: `${collectedAt?.at(0) ?? ''} ${collectedAt?.at(1)?.split('.')[0] ?? ''}`,
          }
        })
        .filter(
          (deposit) =>
            !!deposit && !!deposit.sellerAmount && deposit.sellerAmount > 0,
        ) ?? [],
    [contactMap, deposits],
  )

  return (
    <>
      <DataTable
        columnVisibility={{
          depositId: false,
        }}
        columns={columns}
        data={data}
        headerActions={(table) => <ChecksDataTableHeaderAction table={table} />}
      />
    </>
  )
}

export type CheckTableType = {
  depositId: string
  index: number
  seller: string
  sellerAmount?: number
  checkId?: string
  collectedAt?: string
  signatory?: string
}

export const columns: ColumnDef<CheckTableType>[] = [
  {
    accessorKey: 'index',
    header: 'Identifiant',
  },
  {
    accessorKey: 'seller',
    header: 'Déposant',
  },
  {
    accessorKey: 'checkId',
    header: 'Numéro du chèque',
  },
  {
    accessorKey: 'signatory',
    header: 'Signature',
  },
  {
    accessorKey: 'collectedAt',
    header: 'Heure retour',
  },
  {
    id: 'amount',
    header: 'Montant vendu',
    cell: ({ row }) => {
      const sellerAmount = row.original.sellerAmount
      return (
        <p className="text-right pr-3">
          {sellerAmount ? (
            <FormattedNumber
              value={sellerAmount}
              style="currency"
              currency="EUR"
            />
          ) : null}
        </p>
      )
    },
  },
]

type ChecksDataTableHeaderActionProps = {
  table: Table<CheckTableType>
}
function ChecksDataTableHeaderAction({
  table,
}: ChecksDataTableHeaderActionProps) {
  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={() => console.log('printing...')}>
        Imprimer en PDF
      </CustomButton>
    </div>
  )
}
