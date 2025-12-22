import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { type CashRegisterControl, db, type Workstation } from '@/db.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { getYear } from '@/utils'
import {
  DepositCashRegisterControlPdf,
  type DepositCashRegisterControlProps,
} from '@/pdf/deposit-cash-register-control-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { TextField } from '@/components/custom/input/TextField.tsx'
import { MonetaryField } from '@/components/custom/input/MonetaryField.tsx'
import {
  CashRegisterControlFormSchema,
  type CashRegisterControlFormType,
} from '@/types/SaveDepositCashRegisterControlForm.ts'
import { useSaveCashRegisterControlMutation } from '@/hooks/useSaveCashRegisterControlMutation.ts'
import { toast } from 'sonner'
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'

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

function RouteComponent() {
  const [workstation] = useWorkstation()
  const cashRegisterControlsDb = useCashRegisterControlsDb()
  const cashRegisterControl = useLiveQuery(
    () =>
      cashRegisterControlsDb.findByCashRegisterIdAndType(
        workstation.incrementStart,
        'DEPOSIT',
      ),
    [workstation.incrementStart],
  )
  if (!workstation || !workstation.incrementStart) return null
  return (
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Controler les espèces"
    >
      <CashRegisterControlForm
        workstation={workstation}
        cashRegisterControl={cashRegisterControl}
      />
    </Page>
  )
}

type CashRegisterControlFormProps = {
  workstation: Workstation
  cashRegisterControl?: CashRegisterControl
}

function CashRegisterControlForm(props: CashRegisterControlFormProps) {
  const { workstation, cashRegisterControl } = props
  const mutation = useSaveCashRegisterControlMutation('DEPOSIT')
  const methods = useForm<CashRegisterControlFormType>({
    resolver: zodResolver(CashRegisterControlFormSchema),
    defaultValues: {
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
  })
  const { control, getValues, handleSubmit, setValue } = methods

  useEffect(() => {
    if (cashRegisterControl) {
      setValue('id', cashRegisterControl.id)
      setValue('cashRegisterId', cashRegisterControl.cashRegisterId)
      setValue('initialAmount', cashRegisterControl.initialAmount)
      setValue('realAmount', cashRegisterControl.realCashAmount)
      setValue('theoreticalAmount', cashRegisterControl.theoreticalCashAmount)
      setValue('amounts', [
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

  const { fields } = useFieldArray({
    control,
    name: 'amounts',
  })

  const print = async () => {
    const formData = getValues()
    const year = getYear()
    const data: DepositCashRegisterControlProps['data'] = {
      year,
      ...formData,
    }
    await printPdf(<DepositCashRegisterControlPdf data={data} />)
  }

  const onSubmit = async (data: CashRegisterControlFormType) => {
    await mutation.mutate(data)
    toast.success(`Caisse ${data.cashRegisterId} enregistrée`)
  }

  return (
    <FormProvider {...methods}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <div className="flex flex-row justify-between gap-6">
            <div className="grid grid-cols-6 gap-2">
              {fields.map((field, index) => (
                <Controller
                  key={field.id}
                  name={`amounts.${index}.amount`}
                  render={({ field: controlledField, fieldState }) => (
                    <TextField
                      invalid={fieldState.invalid}
                      {...controlledField}
                      label={`${field.value}`}
                    />
                  )}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Controller
                name="initialAmount"
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
          <div className="flex justify-end gap-3">
            <CustomButton type="button" onClick={print} variant="secondary">
              Imprimer le rapport
            </CustomButton>
            <CustomButton type="submit">Valider</CustomButton>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function RealAmountInput() {
  const { watch, setValue } = useFormContext<CashRegisterControlFormType>()
  const amounts = watch('amounts', [])
  const realAmount = amounts.reduce(
    (acc, cur) => acc + cur.amount * cur.value,
    0,
  )
  useEffect(() => {
    setValue('realAmount', realAmount)
  }, [realAmount, setValue])

  return (
    <Controller
      name="realAmount"
      render={({ field }) => <MonetaryField {...field} label="Montant réel" />}
    />
  )
}

function TheoreticalAmount() {
  const { setValue } = useFormContext<CashRegisterControlFormType>()
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
            ? (parseInt(`${deposit.contributionAmount}`) ?? 0)
            : 0
        return acc + amount
      }, 0) ?? 0
    setValue('theoreticalAmount', theoreticalAmount)
  }, [deposits, setValue])

  return (
    <Controller
      name="theoreticalAmount"
      render={({ field }) => (
        <MonetaryField {...field} label="Montant théorique" />
      )}
    />
  )
}

function DifferenceInput() {
  const { watch } = useFormContext<CashRegisterControlFormType>()

  const [realAmount, theoreticalAmount] = watch([
    'realAmount',
    'theoreticalAmount',
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
