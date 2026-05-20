import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type RowData,
  type SortingState,
  type Table as TableDef,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { DataTablePagination } from '@/components/custom/DataTablePagination.tsx'
import { type ReactNode, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input.tsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'select'
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  columnVisibility: VisibilityState
  data: TData[]
  headerActions?: (table: TableDef<TData>) => ReactNode
  hideSelectionCount?: boolean
  enableColumnSort?: boolean
  enableColumnFilters?: boolean
  hideGlobalFilter?: boolean
  initialSorting?: SortingState
  initialPageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  headerActions,
  columnVisibility,
  hideSelectionCount,
  enableColumnSort,
  enableColumnFilters,
  hideGlobalFilter,
  initialSorting,
  initialPageSize,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState<any>([])
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility,
      ...(initialPageSize !== undefined && {
        pagination: { pageIndex: 0, pageSize: initialPageSize },
      }),
    },
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString', // built-in filter function
    getSortedRowModel: enableColumnSort ? getSortedRowModel() : undefined,
    onSortingChange: enableColumnSort ? setSorting : undefined,
    getFacetedRowModel: enableColumnFilters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableColumnFilters
      ? getFacetedUniqueValues()
      : undefined,
    onColumnFiltersChange: enableColumnFilters ? setColumnFilters : undefined,
    defaultColumn: {
      size: 200, //starting column size
      minSize: 200, //enforced during column resizing
      maxSize: 200, //enforced during column resizing
    },
    state: {
      globalFilter,
      sorting: enableColumnSort ? sorting : undefined,
      columnFilters: enableColumnFilters ? columnFilters : undefined,
    },
  })

  return (
    <div className="flex flex-col gap-2">
      {(!hideGlobalFilter || headerActions) && (
        <div className="flex justify-between">
          <div>
            {!hideGlobalFilter && (
              <Input
                value={globalFilter}
                onChange={(e) =>
                  table.setGlobalFilter(String(e.target.value))
                }
                placeholder="Rechercher..."
              />
            )}
          </div>
          {headerActions && headerActions(table)}
        </div>
      )}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort =
                    enableColumnSort && header.column.getCanSort()
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.column.columnDef.size}px` }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIndicator
                            direction={header.column.getIsSorted()}
                          />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
            {enableColumnFilters &&
              table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={`${headerGroup.id}-filters`}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={`${header.id}-filter`}
                      style={{ width: `${header.column.columnDef.size}px` }}
                    >
                      {header.isPlaceholder ? null : (
                        <ColumnFilter column={header.column} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun résultat
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        hideSelectionCount={hideSelectionCount}
      />
    </div>
  )
}

function SortIndicator({
  direction,
}: {
  direction: false | 'asc' | 'desc'
}) {
  if (direction === 'asc') return <ArrowUp className="size-3" />
  if (direction === 'desc') return <ArrowDown className="size-3" />
  return <ChevronsUpDown className="size-3 opacity-50" />
}

function ColumnFilter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>
}) {
  const variant = column.columnDef.meta?.filterVariant
  if (variant === 'select') return <SelectColumnFilter column={column} />
  if (variant === 'text') return <TextColumnFilter column={column} />
  return null
}

function TextColumnFilter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>
}) {
  const value = column.getFilterValue() as string | undefined
  return (
    <Input
      className="h-8"
      value={value ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      placeholder="Filtrer…"
    />
  )
}

function SelectColumnFilter<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>
}) {
  const facets = column.getFacetedUniqueValues()
  const uniqueValues = useMemo(
    () =>
      Array.from(facets.keys())
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .sort((a, b) => a.localeCompare(b, 'fr')),
    [facets],
  )
  const current = (column.getFilterValue() as string | undefined) ?? 'all'
  return (
    <Select
      value={current}
      onValueChange={(v) =>
        column.setFilterValue(v === 'all' ? undefined : v)
      }
    >
      <SelectTrigger className="h-8 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes</SelectItem>
        {uniqueValues.map((v) => (
          <SelectItem key={v} value={v}>
            {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
