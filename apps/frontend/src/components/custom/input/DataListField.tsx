import type { Noop, RefCallBack } from 'react-hook-form'
import { useMemo } from 'react'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'

type CityInputProps = {
  invalid: boolean
  label?: string
  onChange: (...event: any[]) => void
  onBlur: Noop
  value: string | readonly string[] | number | undefined
  disabled?: boolean
  readOnly?: boolean
  name: string
  ref: RefCallBack
  items: string[]
}

export function DataListField(props: CityInputProps) {
  const {
    invalid,
    onChange,
    onBlur,
    value,
    disabled,
    name,
    label,
    readOnly,
    items,
  } = props
  const options = useMemo(() => {
    return items.map((item) => <option key={item} value={item}></option>)
  }, [items])

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
            list={`${name}-list`}
            aria-invalid={invalid}
            type="text"
            readOnly={readOnly}
          />
          <datalist id={`${name}-list`}>{options}</datalist>
        </InputGroup>
      </FieldContent>
    </Field>
  )
}
