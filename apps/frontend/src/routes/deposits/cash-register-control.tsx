import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  CashRegisterControlFormSchema,
  type CashRegisterControlFormType,
} from '@/types/SaveDepositCashRegisterControlForm.ts'
import { useSaveCashRegisterControlMutation } from '@/hooks/useSaveCashRegisterControlMutation.ts'
import { toast } from 'sonner'
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'

export const Route = createFileRoute('/deposits/cash-register-control')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const [workstation] = useWorkstation()
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)
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
        title="Contrôler les espèces"
      >
        <CashRegisterControlForm
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

type CashRegisterControlFormProps = {
  workstation: Workstation
  cashRegisterControl?: CashRegisterControl
}

function CashRegisterControlForm(props: CashRegisterControlFormProps) {
  const { workstation, cashRegisterControl } = props
  const mutation = useSaveCashRegisterControlMutation('DEPOSIT')
  const methods = useForm<CashRegisterControlFormType>({
    resolver: typedZodResolver(CashRegisterControlFormSchema),
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
      comment: '',
    },
  })
  const { control, getValues, handleSubmit, reset, trigger } = methods
  const [hasPrinted, setHasPrinted] = useState(false)
  const [printError, setPrintError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (cashRegisterControl) {
      reset({
        id: cashRegisterControl.id,
        cashRegisterId: cashRegisterControl.cashRegisterId,
        initialAmount: cashRegisterControl.initialAmount,
        realAmount: cashRegisterControl.realCashAmount,
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
      })
    }
  }, [cashRegisterControl, reset])

  const { fields } = useFieldArray({
    control,
    name: 'amounts',
  })

  const print = async () => {
    const isValid = await trigger()
    if (!isValid) return
    const formData = getValues()
    const year = getYear()
    const data: DepositCashRegisterControlProps['data'] = {
      year,
      ...formData,
    }
    await printPdf(<DepositCashRegisterControlPdf data={data} />)
    setHasPrinted(true)
    setPrintError(false)
  }

  const onSubmit = async (data: CashRegisterControlFormType) => {
    if (!hasPrinted) {
      setPrintError(true)
      return
    }
    await mutation.mutate(data)
    toast.success(`Caisse ${data.cashRegisterId} enregistrée`)
    await navigate({ to: '..' })
  }

  const onCancel = async () => {
    reset()
    setHasPrinted(false)
    setPrintError(false)
    await navigate({ to: '..' })
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
                      label={field.value < 1 ? field.value.toFixed(2) : `${field.value}`}
                    />
                  )}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Controller
                name="initialAmount"
                render={({ field }) => (
                  <MonetaryField {...field} label="Fonds de caisse" />
                )}
              />
              <RealAmountInput />
              <TheoreticalAmount />
              <DifferenceInput />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">Commentaire</Label>
            <Controller
              name="comment"
              render={({ field, fieldState }) => (
                <>
                  <Textarea
                    id="comment"
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
        </div>
      </form>
    </FormProvider>
  )
}

function RealAmountInput() {
  const { watch, setValue } = useFormContext<CashRegisterControlFormType>()
  const amounts = watch('amounts', [])
  const initialAmount = watch('initialAmount', 0)
  const realAmount =
    amounts.reduce((acc, cur) => acc + cur.amount * cur.value, 0) -
    initialAmount
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
          deposit.contributionStatus === 'PAYE'
            ? deposit.contributionAmount
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
