import type { Noop, RefCallBack } from 'react-hook-form/dist/types'
import { useMemo } from 'react'
import { cities } from '@/types/cities.ts'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'

export function CityInput({
  invalid,
  onChange,
  onBlur,
  value,
  disabled,
  name,
}: {
  invalid: boolean
  onChange: (...event: any[]) => void
  onBlur: Noop
  value: string | readonly string[] | number | undefined
  disabled?: boolean
  name: string
  ref: RefCallBack
}) {
  const cityOptions = useMemo(() => {
    return cities.map((city) => <option key={city} value={city}></option>)
  }, [cities])

  return (
    <Field data-invalid={invalid}>
      <FieldContent>
        <Label htmlFor="city">Ville</Label>
        <InputGroup>
          <InputGroupInput
            onChange={onChange}
            onBlur={onBlur}
            value={value}
            disabled={disabled}
            name={name}
            list="city-list"
            id="city"
            aria-invalid={invalid}
            type="text"
          />
          <datalist id="city-list">{cityOptions}</datalist>
        </InputGroup>
      </FieldContent>
    </Field>
  )
}
