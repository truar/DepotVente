import { useEffect } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { useIntl } from 'react-intl'
import { Euro } from 'lucide-react'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { cn } from '@/lib/utils'
import { useFormatAmount } from '@/hooks/useFormatAmount.ts'
import { fromCents, toCents } from '@/utils'

/**
 * Le comptage du tiroir, commun aux trois caisses (dépôt, retour, vente) :
 * les billets et les pièces, le fonds de caisse, et les trois montants qui
 * en découlent. Le montant théorique est posé dans le formulaire par
 * l'écran appelant ; les boutons (imprimer, valider) restent à l'écran, car
 * chaque caisse imprime et enregistre à sa façon.
 *
 * `prefix` situe le comptage dans le formulaire : vide pour les caisses de
 * dépôt et de retour, « cashPayment » pour la caisse de vente.
 */
type Amount = { amount: number | string; value: number }

// Les 6 premières coupures du formulaire sont les billets, les 8 suivantes
// les pièces.
const NOTES_COUNT = 6

export function CashCount(props: { prefix?: string }) {
  const path = (name: string) =>
    props.prefix ? `${props.prefix}.${name}` : name
  const intl = useIntl()
  const formatAmount = useFormatAmount()
  const euros = (cents: number) =>
    intl.formatNumber(fromCents(cents), { style: 'currency', currency: 'EUR' })

  const { control, setValue } = useFormContext()
  const amounts: Array<Amount> = useWatch({ control, name: path('amounts') })
  const initialAmount = useWatch({ control, name: path('initialAmount') })
  const theoreticalAmount: number = useWatch({
    control,
    name: path('theoreticalAmount'),
  })

  // Les pièces s'additionnent en centimes entiers : 3 × 0,10 € font 0,30 €,
  // pas 0.30000000000000004.
  const pileCents = (pile: Amount) =>
    (Number(pile.amount) || 0) * toCents(pile.value)
  const sumCents = (piles: Array<Amount>) =>
    piles.reduce((acc, pile) => acc + pileCents(pile), 0)
  const notesCents = sumCents(amounts.slice(0, NOTES_COUNT))
  const coinsCents = sumCents(amounts.slice(NOTES_COUNT))
  const countedCents = notesCents + coinsCents
  const realAmount = fromCents(
    countedCents - toCents(Number(initialAmount) || 0),
  )
  const difference = fromCents(toCents(realAmount) - toCents(theoreticalAmount))

  // Calculé depuis le comptage et le fonds de caisse : jamais saisi.
  const realPath = path('realAmount')
  useEffect(() => {
    setValue(realPath, realAmount)
  }, [realAmount, realPath, setValue])

  const denominationLabel = (value: number) =>
    intl.formatNumber(value, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: value < 1 ? 2 : 0,
    })

  const group = (legend: string, totalCents: number, from: number) => {
    const piles = amounts.slice(from, from === 0 ? NOTES_COUNT : undefined)
    return (
      <fieldset className="flex flex-col gap-1.5 min-w-0">
        <legend className="mb-1.5 flex gap-2 text-sm font-semibold text-slate-700">
          {legend}
          <span className="font-normal text-slate-600">
            · {euros(totalCents)}
          </span>
        </legend>
        <div
          className={cn(
            'grid gap-2',
            from === 0 ? 'grid-cols-6' : 'grid-cols-8',
          )}
        >
          {piles.map((pile, offset) => {
            const index = from + offset
            const id = path(`amounts.${index}.amount`)
            return (
              <div key={id} className="flex flex-col gap-0.5 min-w-0">
                <Label htmlFor={id} className="text-sm">
                  {denominationLabel(pile.value)}
                </Label>
                <Controller
                  name={id}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id={id}
                      type="text"
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={`${id}-subtotal`}
                      className="h-8 px-2 tabular-nums"
                    />
                  )}
                />
                <span
                  id={`${id}-subtotal`}
                  className="text-xs text-slate-600 tabular-nums"
                >
                  = {euros(pileCents(pile))}
                </span>
              </div>
            )
          })}
        </div>
      </fieldset>
    )
  }

  const verdict =
    difference === 0
      ? { label: 'Juste', tone: 'border-green-300 bg-green-50 text-green-900' }
      : difference < 0
        ? { label: 'Manque', tone: 'border-red-300 bg-red-50 text-red-900' }
        : {
            label: 'Excédent',
            tone: 'border-amber-300 bg-amber-50 text-amber-900',
          }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3">
        {group('Billets', notesCents, 0)}
        {group('Pièces', coinsCents, NOTES_COUNT)}
      </div>
      <div className="flex min-w-0 max-w-[300px] flex-[1_1_220px] flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor={path('initialAmount')}>Fonds de caisse</Label>
          <Controller
            name={path('initialAmount')}
            control={control}
            render={({ field }) => (
              <InputGroup className="h-8">
                <InputGroupInput
                  {...field}
                  id={field.name}
                  type="text"
                  className="tabular-nums"
                />
                <Euro className="w-5 pr-1" />
              </InputGroup>
            )}
          />
        </div>
        <ComputedAmount
          id={realPath}
          label="Montant réel"
          value={formatAmount(realAmount)}
          description={`Total compté ${euros(countedCents)} moins le fonds de caisse`}
        />
        <ComputedAmount
          id={path('theoreticalAmount')}
          label="Montant théorique"
          value={formatAmount(theoreticalAmount)}
        />
        <ComputedAmount
          id={path('difference')}
          label="Différence"
          value={formatAmount(difference)}
          verdict={verdict}
        />
      </div>
    </div>
  )
}

// Un montant calculé : lisible, sélectionnable, jamais modifiable.
function ComputedAmount(props: {
  id: string
  label: string
  value: string
  description?: string
  verdict?: { label: string; tone: string }
}) {
  const { id, label, value, description, verdict } = props
  const describedBy = description || verdict ? `${id}-description` : undefined
  return (
    <div className="flex flex-col gap-0.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup className={cn('h-8 bg-slate-50', verdict?.tone)}>
        <InputGroupInput
          id={id}
          value={value}
          readOnly
          type="text"
          aria-describedby={describedBy}
          className="font-semibold tabular-nums"
        />
        {verdict && (
          <span id={describedBy} className="pr-2 text-sm">
            {verdict.label}
          </span>
        )}
        <Euro className="w-5 pr-1" />
      </InputGroup>
      {description && (
        <span id={describedBy} className="text-xs text-slate-600">
          {description}
        </span>
      )}
    </div>
  )
}
