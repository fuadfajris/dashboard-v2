"use client";

import React from "react";

interface PaginatorProps {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  setPageIndex: (updater: number) => void;
  setPageSize: (updater: number) => void;
  firstPage?: () => void;
  previousPage?: () => void;
  nextPage?: () => void;
  lastPage?: () => void;
  isDisabled?: boolean;
  totalData?: number;
}

export function Paginator({
  pageIndex,
  pageCount,
  pageSize,
  canPreviousPage,
  canNextPage,
  setPageIndex,
  setPageSize,
  firstPage,
  previousPage,
  nextPage,
  lastPage,
  isDisabled = false,
  totalData,
}: PaginatorProps) {
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalData ?? 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        {[firstPage, previousPage, nextPage, lastPage].map((fn, idx) => {
          const labels = ["<<", "<", ">", ">>"];
          const disabled =
            idx < 2
              ? !canPreviousPage || isDisabled
              : !canNextPage || isDisabled;
          return (
            <button
              key={idx}
              onClick={fn}
              disabled={disabled}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              {labels[idx]}
            </button>
          );
        })}

        <span className="text-sm px-2 text-gray-700 dark:text-gray-300">
          Page <strong>{pageIndex + 1}</strong> of{" "}
          <strong>{pageCount || 1}</strong>
        </span>
      </div>

      {/* Info + Page size */}
      <div className="flex items-center gap-3 text-sm">
        {typeof totalData === "number" && totalData > 0 && (
          <span className="text-gray-600 dark:text-gray-300">
            Showing <strong>{start}</strong>–<strong>{end}</strong> of{" "}
            <strong>{totalData}</strong>
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-gray-300">
            Rows per page:
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            disabled={isDisabled}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
