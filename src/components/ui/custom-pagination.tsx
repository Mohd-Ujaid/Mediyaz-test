"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  loading?: boolean;
  className?: string;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize = 25,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = "records",
  loading = false,
  className = "",
}: CustomPaginationProps) {
  // If there are no items and no pages, do not render
  if (totalPages <= 0 && (!totalCount || totalCount === 0)) {
    return null;
  }

  // Calculate start and end count
  const effectivePageSize = pageSize || 25;
  const startCount =
    totalCount !== undefined
      ? totalCount === 0
        ? 0
        : (currentPage - 1) * effectivePageSize + 1
      : (currentPage - 1) * effectivePageSize + 1;

  const endCount =
    totalCount !== undefined
      ? Math.min(currentPage * effectivePageSize, totalCount)
      : currentPage * effectivePageSize;

  // Build page number sequence with ellipsis (1, 2, ..., N)
  const pageNumbers = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
        acc.push("...");
      }
      acc.push(p);
      return acc;
    }, []);

  return (
    <div
      className={`p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 select-none print:hidden ${className}`}
    >
      {/* Left side: Showing X to Y of Z [item] | Rows: [N] */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div>
          {totalCount !== undefined ? (
            <>
              Showing{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {startCount}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {endCount}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {totalCount}
              </span>{" "}
              {itemName}
            </>
          ) : (
            <>
              Page{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {currentPage}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {totalPages}
              </span>
            </>
          )}
        </div>

        {/* Rows per page selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-1 border-l border-slate-200 dark:border-slate-700 pl-3">
            <span className="text-slate-400">Rows:</span>
            <select
              value={effectivePageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              disabled={loading}
              className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: < Previous  1  2 ... 16  Next > */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
          className="h-8 px-2.5 text-xs gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            typeof p === "string" ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={currentPage === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={`h-8 w-8 p-0 text-xs rounded-lg transition-colors ${
                  currentPage === p
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-transparent shadow-xs"
                    : "text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
          className="h-8 px-2.5 text-xs gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
