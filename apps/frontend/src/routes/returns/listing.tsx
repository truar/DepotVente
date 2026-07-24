import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { getYear, sortByIdentificationLetter } from '@/utils'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { type Contact, db, type Deposit } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { CheckIcon, EyeIcon, RefreshCwIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import {
  ReturnDepositPdf,
  type ReturnDepositPdfProps,
  ReturnDepositsPdf,
  type ReturnDepositsPdfProps,
} from '@/pdf/return-deposit-pdf.tsx'
import { useComputeReturnMutation } from '@/hooks/useComputeReturnMutation.ts'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { FormattedNumber } from 'react-intl'
import {
  DepositsMissingContributionPdf,
  type DepositsMissingContributionProps,
} from '@/pdf/deposits-missing-contributions-pdf.tsx'

export const Route = createFileRoute('/returns/listing')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

async function createReturnDepositPdfData(
  id: string,
): Promise<ReturnDepositPdfProps['data'] | undefined> {
  const year = getYear()
  const deposit = await db.deposits.get(id)
  if (!deposit) return undefined

  const articles = sortByIdentificationLetter(
    await db.articles.where({ depositId: deposit.id }).toArray(),
  )
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  const soldArticles = articles.filter((article) => !!article.saleId)
  return {
    deposit: {
      depositIndex: deposit.depositIndex,
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      year: year,
      totalAmount: deposit.soldAmount ?? 0,
      clubAmount: deposit.clubAmount ?? 0,
      dueContributionAmount: deposit.dueContributionAmount ?? 0,
      dueAmount: Math.max(0, deposit.sellerAmount ?? 0),
      countSoldArticles: soldArticles.length,
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
      isSold: !!article.saleId,
      isDeleted: article.status === 'DELETED',
    })),
  }
}

function RouteComponent() {
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Gérer les fiches retours"
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
          soldAmount: deposit.soldAmount,
          contributionStatus: deposit.contributionStatus,
          returnStatus: deposit.signatory
            ? 'TRAITÉ'
            : deposit.returnedCalculationDate
              ? 'PRÊT'
              : 'RETOUR A CALCULER',
          seller: `${seller?.lastName} ${seller?.firstName}`,
        }
      }) ?? [],
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
        headerActions={(table) => (
          <DepositDataTableHeaderAction table={table} />
        )}
      />
      <DepositsSummary />
    </>
  )
}

export type DepositTableType = {
  depositId: string
  index: number
  type: Deposit['type']
  returnStatus: string
  soldAmount?: number
  contributionStatus?: string
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
    id: 'mustPayContribution',
    header: 'Doit cotisation ?',
    accessorFn: (row) => (row.contributionStatus === 'A_PAYER' ? 'Oui' : 'Non'),
    cell: ({ getValue, row }) => {
      const v = getValue() as string
      const depositsDb = useDepositsDb()
      const id = row.original.depositId
      return (
        <div className="flex items-center gap-2">
          <p className={v === 'Oui' ? 'text-red-500' : 'text-green-500'}>{v}</p>
          {v === 'Oui' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                depositsDb.update(id, { contributionStatus: 'PAYE' })
              }
            >
              <CheckIcon />
              Marquer payé
            </Button>
          )}
        </div>
      )
    },
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
    accessorKey: 'returnStatus',
    header: 'Statut du retour',
  },
  {
    id: 'amount',
    header: () => <div className="text-right pr-3">Montant vendu</div>,
    cell: ({ row }) => {
      const soldAmount = row.original.soldAmount
      return (
        <p className="text-right pr-3">
          {soldAmount ? (
            <FormattedNumber
              value={soldAmount}
              style="currency"
              currency="EUR"
            />
          ) : null}
        </p>
      )
    },
  },
  {
    id: 'actions',
    size: 30,
    cell: ({ row }) => {
      const mutation = useComputeReturnMutation()
      const id = row.original.depositId
      const printReturn = useCallback(async (depositId: string) => {
        const data = await createReturnDepositPdfData(depositId)
        if (!data) return
        await printPdf(<ReturnDepositPdf data={data} />)
      }, [])
      const computeReturn = useCallback(
        async (depositId: string) => {
          await mutation.mutate(depositId)
        },
        [mutation],
      )
      return (
        <div>
          <Button variant="ghost" size="icon" onClick={() => computeReturn(id)}>
            <RefreshCwIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => printReturn(id)}>
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
  const mutation = useComputeReturnMutation()
  const printReturn = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    const pdfsData: ReturnDepositsPdfProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await createReturnDepositPdfData(id)
      if (data) {
        pdfsData.push(data)
      }
    }

    await printPdf(<ReturnDepositsPdf data={pdfsData} />)
  }

  const computeReturns = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    for (const id of selectedDepositIds) {
      await mutation.mutate(id)
    }
  }

  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={computeReturns}>
        Lancer le calcul des retours
      </CustomButton>
      <CustomButton onClick={printReturn}>
        Imprimer les fiches retour
      </CustomButton>
    </div>
  )
}

function DepositsSummary() {
  const allDeposits = useLiveQuery(() => db.deposits.toArray())
  const { toCompute, ready, processed } = useMemo(() => {
    let toCompute = 0
    let ready = 0
    let processed = 0
    for (const deposit of allDeposits ?? []) {
      if (deposit.signatory) {
        processed++
      } else if (deposit.returnedCalculationDate) {
        ready++
      } else {
        toCompute++
      }
    }
    return { toCompute, ready, processed }
  }, [allDeposits])

  const printMissingContribution = async () => {
    const deposits = await db.deposits
      .offset(0)
      .and((deposit) => deposit.contributionStatus === 'A_PAYER')
      .sortBy('depositIndex')
    const year = getYear()
    const data: DepositsMissingContributionProps['data']['deposits'] = (
      await Promise.all(
        deposits.map(async (deposit) => {
          const seller = await db.contacts.get(deposit.sellerId)
          if (!seller) return
          return {
            contributionAmount: deposit.contributionAmount,
            depositIndex: deposit.depositIndex,
            seller: `${seller.lastName} ${seller.firstName}`,
            withReturn: !!(deposit.soldAmount && deposit.soldAmount > 0),
          }
        }),
      )
    ).filter((d) => !!d)

    await printPdf(
      <DepositsMissingContributionPdf
        data={{
          deposits: data,
          year,
        }}
      />,
    )
  }

  return (
    <div className="flex flex-row justify-between">
      <div className="flex flew-row gap-5 font-bold">
        <p>Fiches à calculer: {toCompute}</p>
        <p>Fiches prêtes: {ready}</p>
        <p>Fiches traitées: {processed}</p>
      </div>
      <div>
        <CustomButton onClick={() => printMissingContribution()}>
          Récapitulatif des cotisations à encaisser
        </CustomButton>
      </div>
    </div>
  )
}
