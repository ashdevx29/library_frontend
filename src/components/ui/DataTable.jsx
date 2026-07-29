import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { useState } from 'react';
import { FiChevronUp, FiChevronDown, FiChevronsLeft, FiChevronsRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import EmptyState from './EmptyState';
import { cn } from '../../utils/helpers';

export default function DataTable({ columns, data = [], emptyIcon, emptyTitle = 'No data', emptyDescription, pageSize = 10, onRowClick, loading }) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse h-12 rounded-xl bg-[var(--bg-hover)]" />)}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-[var(--border)]">
                {hg.headers.map(h => (
                  <th key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: <FiChevronUp size={10} />, desc: <FiChevronDown size={10} /> }[h.column.getIsSorted()] || null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} onClick={() => onRowClick?.(row.original)} className={cn('border-b border-[var(--border)] transition-colors', onRowClick && 'cursor-pointer hover:bg-[var(--bg-hover)]')}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2.5 text-[var(--text-primary)]">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({data.length} rows)</span>
          <div className="flex items-center gap-1">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-[var(--border)] p-1.5 disabled:opacity-30 hover:bg-[var(--bg-hover)]"><FiChevronsLeft size={14} /></button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-[var(--border)] p-1.5 disabled:opacity-30 hover:bg-[var(--bg-hover)]"><FiChevronLeft size={14} /></button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-lg border border-[var(--border)] p-1.5 disabled:opacity-30 hover:bg-[var(--bg-hover)]"><FiChevronRight size={14} /></button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="rounded-lg border border-[var(--border)] p-1.5 disabled:opacity-30 hover:bg-[var(--bg-hover)]"><FiChevronsRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
