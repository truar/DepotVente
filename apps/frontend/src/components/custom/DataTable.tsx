import {
  type Table as TableDef,
  type VisibilityState,
} from '@tanstack/react-table'

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
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
import type { ReactNode } from 'react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  columnVisibility: VisibilityState
  data: TData[]
  headerActions?: (table: TableDef<TData>) => ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  headerActions,
  columnVisibility,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility,
    },
    defaultColumn: {
      size: 200, //starting column size
      minSize: 200, //enforced during column resizing
      maxSize: 200, //enforced during column resizing
    },
  })

  return (
    <div className="flex flex-col gap-2">
      {headerActions && headerActions(table)}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.column.columnDef.size}px` }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
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
      <DataTablePagination table={table} />
    </div>
  )
}
