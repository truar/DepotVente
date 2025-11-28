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

type ComboboxProps = {
  items: { label: string; value: string; keywords?: string[] }[]
  onSelect: (value: string) => void
  placeholder?: string
  value: string | null
  invalid?: boolean
  emptyLabel?: string
}

export const Combobox = memo(function Combobox(props: ComboboxProps) {
  const {
    items,
    onSelect,
    value,
    placeholder,
    invalid,
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
  }, [items])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
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
