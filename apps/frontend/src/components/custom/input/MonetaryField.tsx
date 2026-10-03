import type { Noop, RefCallBack } from 'react-hook-form'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Euro } from 'lucide-react'
import { Label } from '@/components/ui/label.tsx'
import { useFormatAmount } from '@/hooks/useFormatAmount.ts'

type MonetaryFieldProps = {
  invalid?: boolean
  label?: string
  onChange?: (...event: any[]) => void
  onBlur?: Noop
  value?: string | readonly string[] | number
  // Montant calculé, seulement affiché : le champ passe en lecture seule et
  // montre « 1 234,50 ». La valeur du formulaire, elle, reste un nombre.
  displayValue?: number
  disabled?: boolean
  readOnly?: boolean
  name?: string
  ref?: RefCallBack
}

export function MonetaryField(props: MonetaryFieldProps) {
  const {
    invalid,
    onChange,
    onBlur,
    value,
    displayValue,
    disabled,
    name,
    label,
    readOnly,
  } = props
  const formatAmount = useFormatAmount()
  const displayed = displayValue !== undefined
  return (
    <Field data-invalid={invalid}>
      {label ? <Label htmlFor={name}>{label}</Label> : <></>}
      <FieldContent>
        <InputGroup>
          <InputGroupInput
            onChange={displayed ? undefined : onChange}
            onBlur={onBlur}
            value={displayed ? formatAmount(displayValue) : value}
            disabled={disabled}
            name={name}
            id={name}
            aria-invalid={invalid}
            readOnly={displayed || readOnly}
            type="text"
          />
          <Euro className="w-5 pr-1" />
        </InputGroup>
      </FieldContent>
    </Field>
  )
}
