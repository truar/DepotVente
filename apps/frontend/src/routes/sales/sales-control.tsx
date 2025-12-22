import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { z } from 'zod'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  type CashRegisterControl,
  type Contact,
  db,
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
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'
import { CashRegisterControlFormSchema } from '@/types/SaveDepositCashRegisterControlForm.ts'
import { toast } from 'sonner'
import { useSaveCashRegisterControlMutation } from '@/hooks/useSaveCashRegisterControlMutation.ts'

export const Route = createFileRoute('/sales/sales-control')({
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

const SalesCashRegisterControlFormSchema = z.object({
  cardPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
    }),
  ),
  checkPayments: z.array(
    z.object({
      saleIndex: z.number(),
      buyerName: z.string(),
      buyerPhoneNumber: z.string(),
      buyerCity: z.string(),
      amount: z.number(),
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
    }),
  ),
  cashPayment: CashRegisterControlFormSchema,
})

type CashRegisterControlFormType = z.infer<
  typeof SalesCashRegisterControlFormSchema
>

function useCardPaymentData({
  setValue,
}: {
  setValue: (key: string, value: any) => void
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
    [workstation],
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
          amount: parseInt(`${payment.cardAmount}`) || 0,
        }
      })
      .filter((sale) => !!sale)
    setValue('cardPayments', data)
  }, [sales, contactMap])
}

function useCheckPaymentData({
  setValue,
}: {
  setValue: (key: string, value: any) => void
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
    [workstation],
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
          amount: parseInt(`${payment.checkAmount}`) || 0,
        }
      })
      .filter((sale) => !!sale)
    setValue('checkPayments', data)
  }, [sales, contactMap])
}

function useRefundPaymentData({
  setValue,
}: {
  setValue: (key: string, value: any) => void
}) {
  const [workstation] = useWorkstation()
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
        .and(
          (sale) =>
            (sale.refundCashAmount != null && sale.refundCashAmount > 0) ||
            (sale.refundCardAmount != null && sale.refundCardAmount > 0),
        )
        .sortBy('saleIndex'),
    [workstation],
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
          type: payment.refundCardAmount ? 'CB' : 'CASH',
          comment: payment.refundComment || '',
          amount:
            parseInt(`${payment.refundCardAmount}`) ||
            parseInt(`${payment.refundCashAmount}`) ||
            0,
        }
      })
      .filter((sale) => !!sale)
    setValue('refundPayments', data)
  }, [sales, contactMap])
}
function useCashPaymentData({
  setValue,
  cashRegisterControl,
}: {
  setValue: (key: string, value: any) => void
  cashRegisterControl: CashRegisterControl | undefined
}) {
  useEffect(() => {
    if (cashRegisterControl) {
      setValue('cashPayment.id', cashRegisterControl.id)
      setValue('cashPayment.cashRegisterId', cashRegisterControl.cashRegisterId)
      setValue('cashPayment.initialAmount', cashRegisterControl.initialAmount)
      setValue('cashPayment.realAmount', cashRegisterControl.realCashAmount)
      setValue(
        'cashPayment.theoreticalAmount',
        cashRegisterControl.theoreticalCashAmount,
      )
      setValue('cashPayment.amounts', [
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
      ])
    }
  }, [cashRegisterControl])
}
function RouteComponent() {
  const [workstation] = useWorkstation()
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
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Controler les espèces"
    >
      <SalesControlPage
        workstation={workstation}
        cashRegisterControl={cashRegisterControl}
      />
    </Page>
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
    resolver: zodResolver(SalesCashRegisterControlFormSchema),
    defaultValues: {
      cardPayments: [],
      checkPayments: [],
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
      },
    },
  })

  const { getValues, setValue, handleSubmit } = methods

  useCardPaymentData({ setValue })
  useCheckPaymentData({ setValue })
  useRefundPaymentData({ setValue })
  useCashPaymentData({ setValue, cashRegisterControl })

  const print = async () => {
    const formData = getValues()
    const year = getYear()
    const data: SaleCashRegisterControlProps['data'] = {
      year,
      cashRegisterId: workstation.incrementStart,
      cashPayment: formData.cashPayment,
      cardPayments: formData.cardPayments,
      checkPayments: formData.checkPayments,
      refundPayments: formData.refundPayments,
    }
    await printPdf(<SaleCashRegisterControlPdf data={data} />)
  }

  const onSubmit = async (data: CashRegisterControlFormType) => {
    await mutation.mutate(data.cashPayment)
    toast.success(`Caisse ${data.cashPayment.cashRegisterId} enregistrée`)
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
              <AccordionTrigger>Carte bancaires</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CardPaymentDetails />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cash-payments">
              <AccordionTrigger>Espèces</AccordionTrigger>
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
            <AccordionItem value="refund-payments">
              <AccordionTrigger>Remboursement</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <RefundPaymentDetails />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex justify-end gap-3">
            <CustomButton type="button" onClick={print} variant="secondary">
              Imprimer le rapport
            </CustomButton>
            <CustomButton type="submit">Valider</CustomButton>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}

function CardPaymentDetails() {
  const { getValues } = useFormContext<CashRegisterControlFormType>()
  const onlyCardSales = getValues('cardPayments')
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
            <TableHead>Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {onlyCardSales.map((sale, index) => {
            return (
              <TableRow key={`card-${index}`}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
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
  const { getValues } = useFormContext<CashRegisterControlFormType>()
  const sales = getValues('checkPayments')
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
            <TableHead>Montant vente</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale, index) => {
            return (
              <TableRow key={`check-${index}`}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>{sale.buyerName}</TableCell>
                <TableCell>{sale.buyerPhoneNumber}</TableCell>
                <TableCell>{sale.buyerCity}</TableCell>
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
  const { getValues } = useFormContext<CashRegisterControlFormType>()
  const sales = getValues('refundPayments')
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
            <TableHead>Remboursement</TableHead>
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
  const { fields } = useFieldArray<CashRegisterControlFormType>({
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
                  label={`${field.value}`}
                />
              )}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Controller
            name="cashPayment.initialAmount"
            render={({ field }) => (
              <MonetaryField
                {...field}
                label="Fonds de caisse"
                readOnly={true}
              />
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

function RealAmountInput() {
  const { watch, setValue } = useFormContext<CashRegisterControlFormType>()
  const amounts = watch('cashPayment.amounts', [])
  const realAmount = amounts.reduce(
    (acc, cur) => acc + cur.amount * cur.value,
    0,
  )
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
  useEffect(() => {
    const theoreticalAmount =
      sales?.reduce((acc, sale) => {
        const amount = sale.cashAmount
          ? (parseInt(`${sale.cashAmount}`) ?? 0)
          : 0
        return acc + amount
      }, 0) ?? 0
    setValue('cashPayment.theoreticalAmount', theoreticalAmount)
  }, [sales, setValue])

  return (
    <Controller
      name="cashPayment.theoreticalAmount"
      render={({ field }) => (
        <MonetaryField {...field} label="Montant théorique" />
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
