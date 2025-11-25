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
import { Field, FieldContent } from '@/components/ui/field.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Euro } from 'lucide-react'
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Workstation } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { getYear } from '@/utils'
import {
  DepositCashRegisterControlPdf,
  type DepositCashRegisterControlProps,
} from '@/pdf/deposit-cash-register-control-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'

export const Route = createFileRoute('/deposits/cash-register-control')({
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
      title="Controler la caisse"
    >
      <CashRegisterControlForm workstation={workstation} />
    </Page>
  )
}

type CashRegisterControlFormProps = {
  workstation: Workstation
}

function CashRegisterControlForm(props: CashRegisterControlFormProps) {
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
  const { control, register, getValues } = methods

  const { fields } = useFieldArray({
    control,
    name: 'amounts',
  })

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
    <FormProvider {...methods}>
      <form className="flex flex-col gap-4">
        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <div className="flex flex-row justify-between">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field, index) => (
                <div key={field.id}>
                  <Controller
                    control={control}
                    name={`amounts.${index}.amount`}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldContent>
                          <Label>{field.value}</Label>
                          <InputGroup>
                            <InputGroupInput
                              {...controllerField}
                              aria-invalid={fieldState.invalid}
                              type="text"
                            />
                          </InputGroup>
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-5">
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
          <div className="flex justify-end">
            <CustomButton type="button" onClick={print}>
              Imprimer le rapport
            </CustomButton>
          </div>
        </div>
      </form>
    </FormProvider>
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
      <Label>Montant réels</Label>
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

  const deposits = useLiveQuery(
    () =>
      db.deposits
        .where({
          incrementStart: workstation.incrementStart,
        })
        .toArray(),
    [workstation],
  )
  useEffect(() => {
    const theoreticalAmount =
      deposits?.reduce((acc, deposit) => {
        const amount =
          deposit.contributionStatus === 'PAYEE'
            ? (parseInt(deposit.contributionAmount) ?? 0)
            : 0
        return acc + amount
      }, 0) ?? 0
    setValue('theoreticalAmount', theoreticalAmount)
  }, [deposits, setValue])

  return (
    <Field>
      <Label>Montant théoriques</Label>
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
