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
import { Field } from '@/components/ui/field.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Euro } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Contact, db, type Workstation } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { getYear } from '@/utils'
import {
  DepositCashRegisterControlPdf,
  type DepositCashRegisterControlProps,
} from '@/pdf/deposit-cash-register-control-pdf.tsx'
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

const CashRegisterControlFormSchema = z.object({
  initialAmount: z.coerce.number(),
  realAmount: z.coerce.number(),
  theoreticalAmount: z.coerce.number(),
  amounts: z.array(
    z.object({
      amount: z.coerce.number(),
      value: z.coerce.number(),
    }),
  ),
})

type CashRegisterControlFormType = z.infer<typeof CashRegisterControlFormSchema>

function RouteComponent() {
  const [workstation] = useWorkstation()
  if (!workstation) return null
  return (
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Controler les espèces"
    >
      <SalesControlPage workstation={workstation} />
    </Page>
  )
}

type SalesControlPageProps = {
  workstation: Workstation
}
function SalesControlPage(props: SalesControlPageProps) {
  const { workstation } = props
  const methods = useForm<CashRegisterControlFormType>({
    resolver: zodResolver(CashRegisterControlFormSchema),
    defaultValues: {
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
  })

  const { getValues } = methods

  const print = async () => {
    const formData = getValues()
    const year = getYear()
    const data: DepositCashRegisterControlProps['data'] = {
      year,
      cashRegisterId: workstation.incrementStart,
      ...formData,
    }
    await printPdf(<DepositCashRegisterControlPdf data={data} />)
  }

  return (
    <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
      <FormProvider {...methods}>
        <form className="flex flex-col gap-4">
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="card-payments">
              <AccordionTrigger>Carte bancaires</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <CardPaymentDetails workstation={workstation} />
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
                <CheckPaymentDetails workstation={workstation} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="refund-payments">
              <AccordionTrigger>Remboursement</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <RefundPaymentDetails workstation={workstation} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
        <div className="flex justify-end">
          <CustomButton type="button" onClick={print}>
            Imprimer le rapport
          </CustomButton>
        </div>
      </FormProvider>
    </div>
  )
}

function CardPaymentDetails({ workstation }: { workstation: Workstation }) {
  const sales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
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
  if (!sales) return null
  const onlyCardSales = sales.filter(
    (sale) => sale.cardAmount !== null && sale.cardAmount > 0,
  )
  const total = onlyCardSales.reduce(
    (acc, cur) => acc + parseInt(`${cur.cardAmount}`),
    0,
  )
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
          {onlyCardSales.map((sale) => {
            const buyer = contactMap.get(sale.buyerId)
            if (!buyer) return
            return (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>
                  {buyer.lastName} {buyer.firstName}
                </TableCell>
                <TableCell>{buyer.phoneNumber}</TableCell>
                <TableCell>{buyer.city}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.cardAmount ?? 0}
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

function CheckPaymentDetails({ workstation }: { workstation: Workstation }) {
  const allSales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
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
  if (!allSales) return null
  const sales = allSales.filter(
    (sale) => sale.checkAmount !== null && sale.checkAmount > 0,
  )
  const total = sales.reduce(
    (acc, cur) => acc + parseInt(`${cur.checkAmount}`),
    0,
  )
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
          {sales.map((sale) => {
            const buyer = contactMap.get(sale.buyerId)
            if (!buyer) return
            return (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>
                  {buyer.lastName} {buyer.firstName}
                </TableCell>
                <TableCell>{buyer.phoneNumber}</TableCell>
                <TableCell>{buyer.city}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={sale.checkAmount ?? 0}
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

function RefundPaymentDetails({ workstation }: { workstation: Workstation }) {
  const allSales = useLiveQuery(
    () =>
      db.sales
        .where({
          incrementStart: workstation.incrementStart,
        })
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
  if (!allSales) return null
  const sales = allSales.filter(
    (sale) =>
      (sale.refundCashAmount !== null && sale.refundCashAmount > 0) ||
      (sale.refundCardAmount !== null && sale.refundCardAmount > 0),
  )
  const total = sales.reduce(
    (acc, cur) =>
      acc +
      parseInt(`${cur.refundCashAmount}`) +
      parseInt(`${cur.refundCardAmount}`),
    0,
  )
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
          {sales.map((sale) => {
            const buyer = contactMap.get(sale.buyerId)
            if (!buyer) return
            return (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleIndex}</TableCell>
                <TableCell>
                  {buyer.lastName} {buyer.firstName}
                </TableCell>
                <TableCell>{buyer.phoneNumber}</TableCell>
                <TableCell>{buyer.city}</TableCell>
                <TableCell>{sale.refundCardAmount ? 'CB' : 'Espèce'}</TableCell>
                <TableCell>{sale.refundComment}</TableCell>
                <TableCell className="text-right">
                  <FormattedNumber
                    value={
                      (sale.refundCardAmount || sale.refundCashAmount) ?? 0
                    }
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
  const { register } = useFormContext<CashRegisterControlFormType>()
  const { fields } = useFieldArray<CashRegisterControlFormType>({
    name: 'amounts',
  })
  return (
    <div className="flex flex-2 gap-6 flex-col">
      <div className="flex flex-row justify-between gap-6">
        <div className="grid grid-cols-6 gap-2">
          {fields.map((field, index) => (
            <Controller
              key={field.id}
              name={`amounts.${index}.amount`}
              render={({ field: controllerField, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Label>{field.value}</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </Field>
              )}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Field>
            <Label>Fonds de caisse</Label>
            <InputGroup>
              <InputGroupInput
                type="text"
                disabled
                {...register('initialAmount')}
              />
              <InputGroupAddon align="inline-end">
                <Euro />
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <RealAmountInput />
          <TheoreticalAmount />
          <DifferenceInput />
        </div>
      </div>
    </div>
  )
}

function RealAmountInput() {
  const { watch, setValue, register } =
    useFormContext<CashRegisterControlFormType>()
  const amounts = watch('amounts', [])
  const realAmount = amounts.reduce(
    (acc, cur) => acc + cur.amount * cur.value,
    0,
  )
  useEffect(() => {
    setValue('realAmount', realAmount)
  }, [realAmount, setValue])

  return (
    <Field>
      <Label>Montant réel</Label>
      <InputGroup>
        <InputGroupInput type="text" readOnly {...register('realAmount')} />
        <InputGroupAddon align="inline-end">
          <Euro />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function TheoreticalAmount() {
  const { setValue, register } = useFormContext<CashRegisterControlFormType>()
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
    setValue('theoreticalAmount', theoreticalAmount)
  }, [sales, setValue])

  return (
    <Field>
      <Label>Montant théorique</Label>
      <InputGroup>
        <InputGroupInput
          type="text"
          {...register('theoreticalAmount')}
          readOnly
        />
        <InputGroupAddon align="inline-end">
          <Euro />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function DifferenceInput() {
  const { watch } = useFormContext<CashRegisterControlFormType>()

  const realAmount = watch('realAmount')
  const theoreticalAmount = watch('theoreticalAmount')
  const difference = realAmount - theoreticalAmount

  return (
    <Field>
      <Label>Différence</Label>
      <InputGroup>
        <InputGroupInput type="text" value={difference} readOnly />
        <InputGroupAddon align="inline-end">
          <Euro />
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
