import type { Noop, RefCallBack } from 'react-hook-form'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Euro } from 'lucide-react'
import { Label } from '@/components/ui/label.tsx'

type MonetaryFieldProps = {
  invalid: boolean
  label?: string
  onChange: (...event: any[]) => void
  onBlur: Noop
  value: string | readonly string[] | number | undefined
  disabled?: boolean
  readOnly?: boolean
  name: string
  ref: RefCallBack
}

export function MonetaryField(props: MonetaryFieldProps) {
  const { invalid, onChange, onBlur, value, disabled, name, label, readOnly } =
    props
  return (
    <Field data-invalid={invalid}>
      {label ? <Label htmlFor={name}>{label}</Label> : <></>}
      <FieldContent>
        <InputGroup>
          <InputGroupInput
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            disabled={disabled}
            name={name}
            id={name}
            aria-invalid={invalid}
            readOnly={readOnly}
            type="text"
          />
          <Euro className="w-5 pr-1" />
        </InputGroup>
      </FieldContent>
    </Field>
  )
}
