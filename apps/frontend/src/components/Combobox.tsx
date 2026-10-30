import { memo, useCallback, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
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
//   - "dur" matches any name holding d...u...r in that order, so it returned
//     dozens of the 210 contacts - "dufour", "DUPUIS ROMAIN", "LEDUC ROBERT" -
//     when one of them actually contains "dur".
//   - the value we pass for people and deposits is a UUID, and cmdk searches
//     that too. Typing the deposit number "12" matched 127 of 210 deposits
//     through their ids alone, ranking "3042 - paul bernard" (0.89) above
//     "1012 - Lucie MARTIN" (0.17), the one that does contain "12".
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
  // Each word is matched on its own, so "durand camille" finds the contact
  // whose last name and first name are two separate keywords.
  const terms = normalize(search).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return 1

  const fields = (keywords?.length ? keywords : [value]).map(normalize)
  if (!terms.every((term) => fields.some((field) => field.includes(term)))) {
    return 0
  }
  // Entries starting with what was typed rank above ones that merely contain
  // it, so "dur" puts DURAND first. Equal scores keep the order given, which is
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
  // What is searched, and the highlighted entry: the one Enter or Tab picks.
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState('')
  // The list opens with its first entry highlighted: Tab only puts it in the
  // field once the volunteer has searched or moved with the arrows.
  const navigated = useRef(false)
  const searchInput = useRef<HTMLInputElement>(null)

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next)
    if (next) return
    setSearch('')
    setHighlighted('')
    navigated.current = false
  }, [])

  // Volunteers who never take the mouse Tab onto the field and type. As the
  // W3C recommends for this kind of field (WAI-ARIA APG, select-only
  // combobox), a letter typed on it opens the list and searches it - the
  // rest of the typing goes to the search field - and Enter or the down
  // arrow open it too, as Space does.
  const onTriggerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key
      if (key === 'Enter' || key === 'ArrowDown') {
        e.preventDefault()
        changeOpen(true)
      } else if (key.length === 1 && key !== ' ') {
        e.preventDefault()
        setSearch((typed) => typed + key)
        changeOpen(true)
      }
    },
    [changeOpen],
  )

  // Tab keeps the highlighted entry and moves on to the next field: the list
  // sits right after its field in the page, and closes by itself once the
  // focus leaves it. Shift+Tab keeps the entry too and comes back to the
  // field.
  const onListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        navigated.current = true
      }
      if (e.key !== 'Tab') return
      // The popover would loop Tab back into its search field.
      e.stopPropagation()
      if ((search || navigated.current) && highlighted && highlighted !== value)
        onSelect(highlighted)
      if (e.shiftKey) {
        e.preventDefault()
        changeOpen(false)
      }
    },
    [search, highlighted, value, onSelect, changeOpen],
  )

  const commandItems = useMemo(() => {
    return items.map((item) => {
      return (
        <CommandItem
          keywords={item.keywords}
          key={item.value}
          value={item.value}
          onSelect={(currentValue) => {
            onSelect(currentValue === value ? '' : currentValue)
            changeOpen(false)
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
  }, [items, value, onSelect, changeOpen])

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={readOnly}
          onKeyDown={onTriggerKeyDown}
        >
          {value
            ? items.find((item) => item.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        // The list leaves the page as soon as it closes, without fading out:
        // while fading it still sits between its field and the next one, and
        // a quick Shift+Tab would land in it and lose the focus.
        className="p-0 data-[state=closed]:hidden"
        inline
        // Radix selects the text of the field it focuses: the letter that
        // opened the list would be replaced by the next one typed. The caret
        // goes after it instead.
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          const input = searchInput.current
          if (!input) return
          input.focus()
          input.setSelectionRange(input.value.length, input.value.length)
        }}
      >
        <Command
          filter={filterItem}
          value={highlighted}
          onValueChange={setHighlighted}
          onKeyDown={onListKeyDown}
        >
          <CommandInput
            ref={searchInput}
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>{commandItems}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
