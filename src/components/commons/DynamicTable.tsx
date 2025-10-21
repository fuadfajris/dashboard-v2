"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
  useReactTable,
  ColumnDef,
  Row,
  Cell,
  HeaderGroup,
  Header,
} from "@tanstack/react-table";
import clsx from "clsx";
import Spinner from "./Spinner";
import { Paginator } from "./Paginator";

interface DynamicTableProps<T extends object> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationState;
  setPagination?: (
    updater: PaginationState | ((old: PaginationState) => PaginationState)
  ) => void;
  sorting?: SortingState;
  setSorting?: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void;
  totalData?: number;
  pageSize?: number;
  emptyMessage?: string;
}

export default function DynamicTable<T extends object>({
  columns,
  data,
  isLoading = false,
  pagination,
  setPagination,
  sorting,
  setSorting,
  totalData = 0,
  emptyMessage = "No data found",
}: DynamicTableProps<T>) {
  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: !!pagination,
    pageCount: pagination
      ? Math.ceil(totalData / (pagination.pageSize || 10))
      : undefined,
  });

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-max table-auto">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const headerContent = flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  );
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b dark:border-gray-600"
                      style={{ width: header.getSize() }}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={() => header.column.toggleSorting()}
                          className="flex items-center gap-2"
                        >
                          <span>{headerContent}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-400">
                            {header.column.getIsSorted()
                              ? header.column.getIsSorted() === "asc"
                                ? "▲"
                                : "▼"
                              : ""}
                          </span>
                        </button>
                      ) : (
                        <div>{headerContent}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Spinner className="w-8 h-8" />
                    <span className="text-sm text-gray-500 dark:text-gray-300">
                      Loading data...
                    </span>
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={clsx(
                    "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm border-b dark:border-gray-600 dark:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-300"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && setPagination && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Paginator
            pageIndex={table.getState().pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            setPageIndex={table.setPageIndex}
            setPageSize={table.setPageSize}
            firstPage={table.firstPage}
            previousPage={table.previousPage}
            nextPage={table.nextPage}
            lastPage={table.lastPage}
            isDisabled={isLoading}
            totalData={totalData}
          />
        </div>
      )}
    </div>
  );
}
