import type { Noop, RefCallBack } from 'react-hook-form'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'

type TextInputProps = {
  invalid?: boolean
  label?: string
  onChange: (...event: any[]) => void
  onBlur: Noop
  value: string | readonly string[] | number | undefined
  disabled?: boolean
  readOnly?: boolean
  name: string
  ref: RefCallBack
}

export function TextField(props: TextInputProps) {
  const { invalid, onChange, onBlur, value, disabled, name, label, readOnly } =
    props
  return (
    <Field data-invalid={invalid}>
      <FieldContent>
        {label ? <Label htmlFor={name}>{label}</Label> : <></>}
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
        </InputGroup>
      </FieldContent>
    </Field>
  )
}
