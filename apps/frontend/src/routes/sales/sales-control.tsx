import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { z } from 'zod'
import {
  Controller,
  FormProvider,
  type UseFormSetValue,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  type CashRegisterControl,
  type Contact,
  db,
  type Sale,
  type Workstation,
} from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { getYear } from '@/utils'
import { printPdf } from '@/pdf/print.tsx'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { FormattedNumber } from 'react-intl'
import {
  SaleCashRegisterControlPdf,
  type SaleCashRegisterControlProps,
} from '@/pdf/sale-cash-register-control-pdf.tsx'
import { TextField } from '@/components/custom/input/TextField.tsx'
import { MonetaryField } from '@/components/custom/input/MonetaryField.tsx'
import { Textarea } from '@/components/ui/textarea.tsx'
import { Label } from '@/components/ui/label.tsx'
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'
import { CashRegisterControlFormSchema } from '@/types/SaveDepositCashRegisterControlForm.ts'
import { toast } from 'sonner'
import { useSaveCashRegisterControlMutation } from '@/hooks/useSaveCashRegisterControlMutation.ts'

export const Route = createFileRoute('/sales/sales-control')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

const SalesCashRegisterControlFormSchema = z.object({
  cardPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
      saleTotal: z.number(),
    }),
  ),
  checkPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
      saleTotal: z.number(),
    }),
  ),
  deferredPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
      saleTotal: z.number(),
    }),
  ),
  cashSales: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
      saleTotal: z.number(),
    }),
  ),
  refundPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      type: z.union([z.literal('CB'), z.literal('CASH')]),
      comment: z.string(),
      amount: z.number(),
      saleTotal: z.number(),
    }),
  ),
  cashPayment: CashRegisterControlFormSchema,
})

function computeSaleTotal(sale: Sale): number {
  return (
    (sale.cardAmount ?? 0) +
    (sale.cashAmount ?? 0) +
    (sale.checkAmount ?? 0) +
    (sale.deferredAmount ?? 0) -
    (sale.totalRefundAmount ?? 0)
  )
}

type CashRegisterControlFormType = z.infer<
  typeof SalesCashRegisterControlFormSchema
>

function useCardPaymentData({
  setValue,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
}) {
  const [workstation] = useWorkstation()
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .and((sale) => sale.cardAmount != null && sale.cardAmount > 0)
        .sortBy('saleIndex'),
    [workstation.incrementStart],
  )
  const refunds = useLiveQuery(
    () =>
      db.refunds
        .where({ incrementStart: workstation.incrementStart })
        .and((refund) => refund.deletedAt == null && refund.cardAmount > 0)
        .toArray(),
    [workstation.incrementStart],
  )
  const allSales = useLiveQuery(() => db.sales.toArray())
  const saleMap = useMemo(
    () => new Map<string, Sale>(allSales?.map((sale) => [sale.id, sale])),
    [allSales],
  )
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(
    () =>
      new Map<string, Contact>(
        contacts?.map((contact) => [contact.id, contact]),
      ),
    [contacts],
  )
  useEffect(() => {
    const saleRows = (sales ?? [])
      .map((payment) => {
        const buyer = contactMap.get(payment.buyerId)
        if (!buyer) return
        return {
          saleIndex: payment.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: payment.cardAmount ?? 0,
          saleTotal: computeSaleTotal(payment),
        }
      })
      .filter((row) => !!row)
    const refundRows = (refunds ?? [])
      .map((refund) => {
        const sale = saleMap.get(refund.saleId)
        if (!sale) return
        const buyer = contactMap.get(sale.buyerId)
        if (!buyer) return
        return {
          saleIndex: sale.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: -refund.cardAmount,
          saleTotal: computeSaleTotal(sale),
        }
      })
      .filter((row) => !!row)
    const merged = [...saleRows, ...refundRows].sort(
      (a, b) => a!.saleIndex - b!.saleIndex,
    ) as CashRegisterControlFormType['cardPayments']
    setValue('cardPayments', merged)
  }, [sales, refunds, contactMap, saleMap])
}

function useCheckPaymentData({
  setValue,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
}) {
  const [workstation] = useWorkstation()
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .and((sale) => sale.checkAmount != null && sale.checkAmount > 0)
        .sortBy('saleIndex'),
    [workstation.incrementStart],
  )
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(
    () =>
      new Map<string, Contact>(
        contacts?.map((contact) => [contact.id, contact]),
      ),
    [contacts],
  )
  useEffect(() => {
    const data = (sales ?? [])
      .map((payment) => {
        const buyer = contactMap.get(payment.buyerId)
        if (!buyer) return
        return {
          saleIndex: payment.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: payment.checkAmount ?? 0,
          saleTotal: computeSaleTotal(payment),
        }
      })
      .filter((sale) => !!sale)
    setValue('checkPayments', data)
  }, [sales, contactMap])
}

function useDeferredPaymentData({
  setValue,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
}) {
  const [workstation] = useWorkstation()
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .and((sale) => sale.deferredAmount != null && sale.deferredAmount > 0)
        .sortBy('saleIndex'),
    [workstation.incrementStart],
  )
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(
    () =>
      new Map<string, Contact>(
        contacts?.map((contact) => [contact.id, contact]),
      ),
    [contacts],
  )
  useEffect(() => {
    const data = (sales ?? [])
      .map((payment) => {
        const buyer = contactMap.get(payment.buyerId)
        if (!buyer) return
        return {
          saleIndex: payment.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: payment.deferredAmount ?? 0,
          saleTotal: computeSaleTotal(payment),
        }
      })
      .filter((sale) => !!sale)
    setValue('deferredPayments', data)
  }, [sales, contactMap])
}

function useCashSalesData({
  setValue,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
}) {
  const [workstation] = useWorkstation()
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .and((sale) => sale.cashAmount != null && sale.cashAmount > 0)
        .sortBy('saleIndex'),
    [workstation.incrementStart],
  )
  const refunds = useLiveQuery(
    () =>
      db.refunds
        .where({ incrementStart: workstation.incrementStart })
        .and((refund) => refund.deletedAt == null && refund.cashAmount > 0)
        .toArray(),
    [workstation.incrementStart],
  )
  const allSales = useLiveQuery(() => db.sales.toArray())
  const saleMap = useMemo(
    () => new Map<string, Sale>(allSales?.map((sale) => [sale.id, sale])),
    [allSales],
  )
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(
    () =>
      new Map<string, Contact>(
        contacts?.map((contact) => [contact.id, contact]),
      ),
    [contacts],
  )
  useEffect(() => {
    const saleRows = (sales ?? [])
      .map((payment) => {
        const buyer = contactMap.get(payment.buyerId)
        if (!buyer) return
        return {
          saleIndex: payment.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: payment.cashAmount ?? 0,
          saleTotal: computeSaleTotal(payment),
        }
      })
      .filter((row) => !!row)
    const refundRows = (refunds ?? [])
      .map((refund) => {
        const sale = saleMap.get(refund.saleId)
        if (!sale) return
        const buyer = contactMap.get(sale.buyerId)
        if (!buyer) return
        return {
          saleIndex: sale.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          amount: -refund.cashAmount,
          saleTotal: computeSaleTotal(sale),
        }
      })
      .filter((row) => !!row)
    const merged = [...saleRows, ...refundRows].sort(
      (a, b) => a!.saleIndex - b!.saleIndex,
    ) as CashRegisterControlFormType['cashSales']
    setValue('cashSales', merged)
  }, [sales, refunds, contactMap, saleMap])
}

function useRefundPaymentData({
  setValue,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
}) {
  const [workstation] = useWorkstation()
  const refunds = useLiveQuery(
    () =>
      db.refunds
        .where({ incrementStart: workstation.incrementStart })
        .and((refund) => refund.deletedAt == null)
        .toArray(),
    [workstation.incrementStart],
  )
  const sales = useLiveQuery(() => db.sales.toArray())
  const contacts = useLiveQuery(() => db.contacts.toArray())
  const saleMap = useMemo(
    () => new Map<string, Sale>(sales?.map((sale) => [sale.id, sale])),
    [sales],
  )
  const contactMap = useMemo(
    () =>
      new Map<string, Contact>(
        contacts?.map((contact) => [contact.id, contact]),
      ),
    [contacts],
  )
  useEffect(() => {
    const data = (refunds ?? [])
      .map((refund) => {
        const sale = saleMap.get(refund.saleId)
        if (!sale) return
        const buyer = contactMap.get(sale.buyerId)
        if (!buyer) return
        return {
          saleIndex: sale.saleIndex,
          buyerName: `${buyer.lastName} ${buyer.firstName}`,
          buyerPhoneNumber: buyer.phoneNumber,
          buyerCity: buyer.city || '',
          type:
            refund.cardAmount > 0 ? ('CB' as const) : ('CASH' as const),
          comment: refund.comment || '',
          amount: refund.cardAmount > 0 ? refund.cardAmount : refund.cashAmount,
          saleTotal: computeSaleTotal(sale),
        }
      })
      .filter((row) => !!row)
      .sort((a, b) => a!.saleIndex - b!.saleIndex)
    setValue('refundPayments', data as CashRegisterControlFormType['refundPayments'])
  }, [refunds, saleMap, contactMap])
}
function buildCashPaymentValues(
  cashRegisterControl: CashRegisterControl,
): CashRegisterControlFormType['cashPayment'] {
  return {
    id: cashRegisterControl.id,
    cashRegisterId: cashRegisterControl.cashRegisterId,
    initialAmount: cashRegisterControl.initialAmount,
    realAmount: cashRegisterControl.totalAmount,
    theoreticalAmount: cashRegisterControl.theoreticalCashAmount,
    amounts: [
      { amount: cashRegisterControl.cash200, value: 200 },
      { amount: cashRegisterControl.cash100, value: 100 },
      { amount: cashRegisterControl.cash50, value: 50 },
      { amount: cashRegisterControl.cash20, value: 20 },
      { amount: cashRegisterControl.cash10, value: 10 },
      { amount: cashRegisterControl.cash5, value: 5 },
      { amount: cashRegisterControl.cash2, value: 2 },
      { amount: cashRegisterControl.cash1, value: 1 },
      { amount: cashRegisterControl.cash05, value: 0.5 },
      { amount: cashRegisterControl.cash02, value: 0.2 },
      { amount: cashRegisterControl.cash01, value: 0.1 },
      { amount: cashRegisterControl.cash005, value: 0.05 },
      { amount: cashRegisterControl.cash002, value: 0.02 },
      { amount: cashRegisterControl.cash001, value: 0.01 },
    ],
    comment: cashRegisterControl.comment ?? '',
  }
}

function useCashPaymentData({
  setValue,
  cashRegisterControl,
}: {
  setValue: UseFormSetValue<CashRegisterControlFormType>
  cashRegisterControl: CashRegisterControl | undefined
}) {
  useEffect(() => {
    if (cashRegisterControl) {
      setValue('cashPayment', buildCashPaymentValues(cashRegisterControl))
    }
  }, [cashRegisterControl])
}
function RouteComponent() {
  const [workstation] = useWorkstation()
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)
  const cashRegisterControlsDb = useCashRegisterControlsDb()
  const cashRegisterControl = useLiveQuery(
    () =>
      cashRegisterControlsDb.findByCashRegisterIdAndType(
        workstation.incrementStart,
        'SALE',
      ),
    [workstation.incrementStart],
  )
  if (!workstation || !workstation.incrementStart) return null
  return (
    <>
      <Page
        navigation={
          <Link
            to={'..'}
            onClick={(e) => {
              e.preventDefault()
              setBackOpen(true)
            }}
          >
            Retour au menu
          </Link>
        }
        title="Contrôler la caisse"
      >
        <SalesControlPage
          workstation={workstation}
          cashRegisterControl={cashRegisterControl}
        />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title="Etes vous sur de vouloir quitter cette page ?"
        description="Les données non enregistrées seront perdues."
        onConfirm={() => navigate({ to: '..' })}
      />
    </>
  )
}

type SalesControlPageProps = {
  workstation: Workstation
  cashRegisterControl?: CashRegisterControl
}
function SalesControlPage(props: SalesControlPageProps) {
  const { workstation, cashRegisterControl } = props
  const mutation = useSaveCashRegisterControlMutation('SALE')
  const methods = useForm<CashRegisterControlFormType>({
    resolver: typedZodResolver(SalesCashRegisterControlFormSchema),
    defaultValues: {
      cardPayments: [],
      checkPayments: [],
      deferredPayments: [],
      cashSales: [],
      cashPayment: {
        cashRegisterId: workstation.incrementStart,
        initialAmount: 80,
        realAmount: 0,
        theoreticalAmount: 0,
        amounts: [
          { amount: 0, value: 200 },
          { amount: 0, value: 100 },
          { amount: 0, value: 50 },
          { amount: 0, value: 20 },
          { amount: 0, value: 10 },
          { amount: 0, value: 5 },
          { amount: 0, value: 2 },
          { amount: 0, value: 1 },
          { amount: 0, value: 0.5 },
          { amount: 0, value: 0.2 },
          { amount: 0, value: 0.1 },
          { amount: 0, value: 0.05 },
          { amount: 0, value: 0.02 },
          { amount: 0, value: 0.01 },
        ],
        comment: '',
      },
    },
  })

  const { getValues, setValue, handleSubmit, reset, trigger } = methods
  const [hasPrinted, setHasPrinted] = useState(false)
  const [printError, setPrintError] = useState(false)
  const navigate = useNavigate()

  useCardPaymentData({ setValue })
  useCheckPaymentData({ setValue })
  useDeferredPaymentData({ setValue })
  useCashSalesData({ setValue })
  useRefundPaymentData({ setValue })
  useCashPaymentData({ setValue, cashRegisterControl })

  const print = async () => {
    const isValid = await trigger()
    if (!isValid) return
    const formData = getValues()
    const year = getYear()
    const data: SaleCashRegisterControlProps['data'] = {
      year,
      cashRegisterId: workstation.incrementStart,
      cashPayment: formData.cashPayment,
      cardPayments: formData.cardPayments,
      checkPayments: formData.checkPayments,
      deferredPayments: formData.deferredPayments,
      cashSales: formData.cashSales,
      refundPayments: formData.refundPayments,
    }
    await printPdf(<SaleCashRegisterControlPdf data={data} />)
    setHasPrinted(true)
    setPrintError(false)
  }

  const onSubmit = async (data: CashRegisterControlFormType) => {
    if (!hasPrinted) {
      setPrintError(true)
      return
    }
    await mutation.mutate(data.cashPayment)
    toast.success(`Caisse ${data.cashPayment.cashRegisterId} enregistrée`)
    await navigate({ to: '..' })
  }

  const onCancel = async () => {
    if (cashRegisterControl) {
      setValue('cashPayment', buildCashPaymentValues(cashRegisterControl))
    } else {
      reset()
    }
    setHasPrinted(false)
    setPrintError(false)
    await navigate({ to: '..' })
  }

  const onError = (error: any) => console.log(error)

  return (
    <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
      <FormProvider {...methods}>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit, onError)}
        >
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="card-payments">
              <AccordionTrigger>Cartes bancaires</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CardPaymentDetails />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cash-sales-details">
              <AccordionTrigger>Espèces — détail des ventes</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CashSalesDetails />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cash-register-control">
              <AccordionTrigger>Espèces — contrôle de caisse</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CashRegisterControlForm />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="check-payments">
              <AccordionTrigger>Chèques</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CheckPaymentDetails />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deferred-payments">
              <AccordionTrigger>Paiements différés</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <DeferredPaymentDetails />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="refund-payments">
              <AccordionTrigger>Remboursement</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <RefundPaymentDetails />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <CommentField />
          {printError && (
            <p className="text-red-600 text-sm text-right">
              Merci d'imprimer le rapport avant de valider le contrôle
            </p>
          )}
          <div className="flex justify-end gap-3">
            <CustomButton type="button" onClick={print} variant="secondary">
              Imprimer
            </CustomButton>
            <ConfirmationDialog
              trigger={
                <CustomButton type="button" variant="destructive">
                  Annuler
                </CustomButton>
              }
              title="Etes vous sur de vouloir annuler ?"
              description="Cette action va réinitialiser le formulaire. Les données non enregistrées seront perdues."
              onConfirm={onCancel}
            />
            <CustomButton type="submit">Valider</CustomButton>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

function CardPaymentDetails() {
  const { control } = useFormContext<CashRegisterControlFormType>()
  const onlyCardSales = useWatch({ control, name: 'cardPayments' }) ?? []
  const total = onlyCardSales.reduce((acc, cur) => acc + cur.amount, 0)
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">N° vente</TableHead>
            <TableHead>Nom acheteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead className="text-right">Total vente</TableHead>
            <TableHead className="text-right">Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {onlyCardSales.map((sale, index) => {
            const mismatch = sale.amount !== sale.saleTotal
            return (
              <TableRow
                key={`card-${index}`}
                className={mismatch ? 'bg-amber-100 hover:bg-amber-200' : undefined}
              >
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.saleTotal}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.amount}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <p className="font-bold">
          Total:{' '}
          <FormattedNumber value={total} style="currency" currency="EUR" />
        </p>
      </div>
    </>
  )
}

function CheckPaymentDetails() {
  const { control } = useFormContext<CashRegisterControlFormType>()
  const sales = useWatch({ control, name: 'checkPayments' }) ?? []
  const total = sales.reduce((acc, cur) => acc + cur.amount, 0)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">N° vente</TableHead>
            <TableHead>Nom acheteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead className="text-right">Total vente</TableHead>
            <TableHead className="text-right">Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => {
            const mismatch = sale.amount !== sale.saleTotal
            return (
              <TableRow
                key={`check-${index}`}
                className={mismatch ? 'bg-amber-100 hover:bg-amber-200' : undefined}
              >
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.saleTotal}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.amount}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <p className="font-bold">
          Total:{' '}
          <FormattedNumber value={total} style="currency" currency="EUR" />
        </p>
      </div>
    </>
  )
}

function DeferredPaymentDetails() {
  const { control } = useFormContext<CashRegisterControlFormType>()
  const sales = useWatch({ control, name: 'deferredPayments' }) ?? []
  const total = sales.reduce((acc, cur) => acc + cur.amount, 0)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">N° vente</TableHead>
            <TableHead>Nom acheteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead className="text-right">Total vente</TableHead>
            <TableHead className="text-right">Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => {
            const mismatch = sale.amount !== sale.saleTotal
            return (
              <TableRow
                key={`deferred-${index}`}
                className={mismatch ? 'bg-amber-100 hover:bg-amber-200' : undefined}
              >
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.saleTotal}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.amount}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <p className="font-bold">
          Total:{' '}
          <FormattedNumber value={total} style="currency" currency="EUR" />
        </p>
      </div>
    </>
  )
}

function CashSalesDetails() {
  const { control } = useFormContext<CashRegisterControlFormType>()
  const sales = useWatch({ control, name: 'cashSales' }) ?? []
  const total = sales.reduce((acc, cur) => acc + cur.amount, 0)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">N° vente</TableHead>
            <TableHead>Nom acheteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead className="text-right">Total vente</TableHead>
            <TableHead className="text-right">Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => {
            const mismatch = sale.amount !== sale.saleTotal
            return (
              <TableRow
                key={`cash-${index}`}
                className={mismatch ? 'bg-amber-100 hover:bg-amber-200' : undefined}
              >
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.saleTotal}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.amount}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <p className="font-bold">
          Total:{' '}
          <FormattedNumber value={total} style="currency" currency="EUR" />
        </p>
      </div>
    </>
  )
}

function RefundPaymentDetails() {
  const { control } = useFormContext<CashRegisterControlFormType>()
  const sales = useWatch({ control, name: 'refundPayments' }) ?? []
  const total = sales.reduce((acc, cur) => acc + cur.amount, 0)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">N° vente</TableHead>
            <TableHead>Nom acheteur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Commentaires</TableHead>
            <TableHead className="text-right">Total vente</TableHead>
            <TableHead className="text-right">Remboursement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => {
            return (
              <TableRow key={`refund-${index}`}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
                <TableCell>{sale.type}</TableCell>
                <TableCell>{sale.comment}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.saleTotal}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.amount}
                    style="currency"
                    currency="EUR"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <p className="font-bold">
          Total:{' '}
          <FormattedNumber value={total} style="currency" currency="EUR" />
        </p>
      </div>
    </>
  )
}

function CashRegisterControlForm() {
  const { fields } = useFieldArray<CashRegisterControlFormType, 'cashPayment.amounts'>({
    name: 'cashPayment.amounts',
  })
  return (
    <div className="flex flex-2 gap-6 flex-col">
      <div className="flex flex-row justify-between gap-6">
        <div className="grid grid-cols-6 gap-2">
          {fields.map((field, index) => (
            <Controller
              key={field.id}
              name={`cashPayment.amounts.${index}.amount`}
              render={({ field: controllerField, fieldState }) => (
                <TextField
                  invalid={fieldState.invalid}
                  {...controllerField}
                  label={field.value < 1 ? field.value.toFixed(2) : `${field.value}`}
                />
              )}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Controller
            name="cashPayment.initialAmount"
            render={({ field }) => (
              <MonetaryField {...field} label="Fonds de caisse" />
            )}
          />
          <RealAmountInput />
          <TheoreticalAmount />
          <DifferenceInput />
        </div>
      </div>
    </div>
  )
}

function CommentField() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="cashPayment-comment">Commentaire</Label>
      <Controller
        name="cashPayment.comment"
        render={({ field, fieldState }) => (
          <>
            <Textarea
              id="cashPayment-comment"
              {...field}
              value={field.value ?? ''}
            />
            {fieldState.invalid && fieldState.error?.message && (
              <p className="text-red-600 text-sm">
                {fieldState.error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  )
}

function RealAmountInput() {
  const { watch, setValue } = useFormContext<CashRegisterControlFormType>()
  const amounts = watch('cashPayment.amounts', [])
  const initialAmount = watch('cashPayment.initialAmount', 0)
  const realAmount =
    amounts.reduce((acc, cur) => acc + cur.amount * cur.value, 0) -
    initialAmount
  useEffect(() => {
    setValue('cashPayment.realAmount', realAmount)
  }, [realAmount, setValue])

  return (
    <Controller
      name="cashPayment.realAmount"
      render={({ field }) => <MonetaryField {...field} label="Montant réel" />}
    />
  )
}

function TheoreticalAmount() {
  const { setValue } = useFormContext<CashRegisterControlFormType>()
  const [workstation] = useWorkstation()
  if (!workstation) return null

  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .toArray(),
    [workstation],
  )
  const cashRefunds = useLiveQuery(
    () =>
      db.refunds
        .where({ incrementStart: workstation.incrementStart })
        .and((refund) => refund.deletedAt == null && refund.cashAmount > 0)
        .toArray(),
    [workstation],
  )
  useEffect(() => {
    const cashIn =
      sales?.reduce((acc, sale) => acc + (sale.cashAmount ?? 0), 0) ?? 0
    const cashOut =
      cashRefunds?.reduce((acc, refund) => acc + refund.cashAmount, 0) ?? 0
    setValue('cashPayment.theoreticalAmount', cashIn - cashOut)
  }, [sales, cashRefunds, setValue])

  return (
    <Controller
      name="cashPayment.theoreticalAmount"
      render={({ field }) => (
        <MonetaryField {...field} label="Montant théorique" readOnly />
      )}
    />
  )
}

function DifferenceInput() {
  const { watch } = useFormContext<CashRegisterControlFormType>()

  const [realAmount, theoreticalAmount] = watch([
    'cashPayment.realAmount',
    'cashPayment.theoreticalAmount',
  ])
  const difference = realAmount - theoreticalAmount

  return (
    <MonetaryField
      value={difference}
      label="Différence"
      onChange={() => {}}
      readOnly={true}
    />
  )
}
