import { Link, useNavigate } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { type CashRegisterControl } from '@/db.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { fromCents, getYear, toCents } from '@/utils'
import { CashCount } from '@/components/forms/CashCount.tsx'
import {
  DepositCashRegisterControlPdf,
  type DepositCashRegisterControlProps,
} from '@/pdf/deposit-cash-register-control-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
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

/**
 * Écran de comptage des espèces, partagé par la caisse de dépôt et la caisse
 * de retour. Les deux comptent la même chose (les cotisations encaissées en
 * espèces) et ne diffèrent que par le montant théorique attendu, calculé par
 * l'écran appelant : les cotisations PAYE de ses propres dépôts côté dépôt,
 * les cotisations SOLDE qu'elle a encaissées côté retour.
 *
 * La caisse comptée est celle du poste pour le caissier, celle choisie dans
 * la liste des contrôles pour l'administrateur.
 */
export type CashRegisterControlScreenProps = {
  type: CashRegisterControl['type']
  cashRegisterId: number
  pageTitle: string
  pdfTitle: string
  theoreticalAmount: number
  backLabel?: string
}

export function CashRegisterControlScreen(
  props: CashRegisterControlScreenProps,
) {
  const {
    type,
    cashRegisterId,
    pageTitle,
    pdfTitle,
    theoreticalAmount,
    backLabel = 'Retour au menu',
  } = props
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)
  const cashRegisterControlsDb = useCashRegisterControlsDb()
  const cashRegisterControl = useLiveQuery(
    () =>
      cashRegisterControlsDb.findByCashRegisterIdAndType(cashRegisterId, type),
    [cashRegisterId, type],
  )
  if (!cashRegisterId) return null
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
            {backLabel}
          </Link>
        }
        title={pageTitle}
      >
        {/* Un formulaire par caisse : rien du comptage d'une autre caisse ne
            reste affiché quand on passe de l'une à l'autre. */}
        <CashRegisterControlForm
          key={cashRegisterId}
          cashRegisterId={cashRegisterId}
          type={type}
          pdfTitle={pdfTitle}
          theoreticalAmount={theoreticalAmount}
          cashRegisterControl={cashRegisterControl}
        />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title={'Etes vous sur de vouloir quitter cette page\u00a0?'}
        description="Les données non enregistrées seront perdues."
        onConfirm={() => navigate({ to: '..' })}
      />
    </>
  )
}

type CashRegisterControlFormProps = {
  cashRegisterId: number
  type: CashRegisterControl['type']
  pdfTitle: string
  theoreticalAmount: number
  cashRegisterControl?: CashRegisterControl
}

function CashRegisterControlForm(props: CashRegisterControlFormProps) {
  const {
    cashRegisterId,
    type,
    pdfTitle,
    theoreticalAmount,
    cashRegisterControl,
  } = props
  const mutation = useSaveCashRegisterControlMutation(type)
  const methods = useForm<CashRegisterControlFormType>({
    resolver: typedZodResolver(CashRegisterControlFormSchema),
    defaultValues: {
      cashRegisterId,
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
  const { getValues, handleSubmit, reset, trigger } = methods
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

  const print = async () => {
    const isValid = await trigger()
    if (!isValid) return
    const formData = getValues()
    const year = getYear()
    const data: DepositCashRegisterControlProps['data'] = {
      year,
      title: pdfTitle,
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
        <div className="flex flex-col gap-3.5 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <CashCount />
          <TheoreticalAmount theoreticalAmount={theoreticalAmount} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">Commentaire</Label>
            <Controller
              name="comment"
              render={({ field, fieldState }) => (
                <>
                  <Textarea id="comment" {...field} value={field.value ?? ''} />
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
              title={'Etes vous sur de vouloir annuler\u00a0?'}
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

// Le théorique est toujours recalculé, y compris à la réouverture d'un
// contrôle déjà enregistré : il écrase la valeur remise par reset().
function TheoreticalAmount(props: { theoreticalAmount: number }) {
  const { theoreticalAmount } = props
  const { setValue } = useFormContext<CashRegisterControlFormType>()
  useEffect(() => {
    setValue('theoreticalAmount', fromCents(toCents(theoreticalAmount)))
  }, [theoreticalAmount, setValue])
  return null
}
