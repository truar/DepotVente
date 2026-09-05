import { memo, useMemo, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.tsx'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx'
import { Button } from '@/components/ui/button.tsx'

// cmdk's default filter is a fuzzy *subsequence* matcher scored over the item's
// value and its keywords. At a till that is wrong twice over:
//
//   - "rua" matches any name holding r...u...a in that order, so it returned 24
//     of the 210 contacts - "rutella", "ROUSSEL ADELAIDE", "GRUFFAT" - when one
//     of them actually contains "rua".
//   - the value we pass for people and deposits is a UUID, and cmdk searches
//     that too. Typing the deposit number "12" matched 127 of 210 deposits
//     through their ids alone, ranking "3042 - thierry roche" (0.89) above
//     "1012 - Karine RAFFESTIN" (0.17), the one that does contain "12".
//
// Volunteers type a name or a deposit number and expect the entries containing
// it. So match literally: on the keywords when the caller passes them (which
// leaves the id out), on the value otherwise - the brand, category and
// discipline lists pass no keywords and their value is the visible text.
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // "René" -> "rene", so either spelling finds it
    .toLowerCase()

export function filterItem(
  value: string,
  search: string,
  keywords?: string[],
): number {
  // Each word is matched on its own, so "ruaro laurence" finds the contact
  // whose last name and first name are two separate keywords.
  const terms = normalize(search).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return 1

  const fields = (keywords?.length ? keywords : [value]).map(normalize)
  if (!terms.every((term) => fields.some((field) => field.includes(term)))) {
    return 0
  }
  // Entries starting with what was typed rank above ones that merely contain
  // it, so "rua" puts RUARO first. Equal scores keep the order given, which is
  // already alphabetical (contacts) or by deposit number (deposits).
  return fields.some((field) => field.startsWith(terms[0])) ? 2 : 1
}

type ComboboxProps = {
  items: { label: string; value: string; keywords?: string[] }[]
  onSelect: (value: string) => void
  placeholder?: string
  value: string | null
  invalid?: boolean
  emptyLabel?: string
  readOnly?: boolean
}

export const Combobox = memo(function Combobox(props: ComboboxProps) {
  const {
    items,
    onSelect,
    value,
    placeholder,
    invalid,
    readOnly,
    emptyLabel = 'Vide',
  } = props
  const [open, setOpen] = useState(false)

  const commandItems = useMemo(() => {
    return items.map((item) => {
      return (
        <CommandItem
          keywords={item.keywords}
          key={item.value}
          value={item.value}
          onSelect={(currentValue) => {
            onSelect(currentValue === value ? '' : currentValue)
            setOpen(false)
          }}
        >
          {item.label}
          <Check
            className={cn(
              'ml-auto',
              value === item.value ? 'opacity-100' : 'opacity-0',
            )}
          />
        </CommandItem>
      )
    })
  }, [items, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={readOnly}
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command filter={filterItem}>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>{commandItems}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
