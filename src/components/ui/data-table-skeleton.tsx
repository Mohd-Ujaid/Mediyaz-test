"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  density?: "compact" | "comfortable";
  hasCheckbox?: boolean;
  hasActions?: boolean;
}

export function DataTableSkeleton({
  rows = 6,
  columns = 8,
  density = "comfortable",
  hasCheckbox = true,
  hasActions = true,
}: DataTableSkeletonProps) {
  const rowArray = Array.from({ length: rows });
  const cellPad = density === "compact" ? "py-2 px-2.5" : "p-3.5";

  return (
    <div className="w-full overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              {hasCheckbox && (
                <th className={`${cellPad} w-10`}>
                  <Skeleton className="w-4 h-4 rounded" />
                </th>
              )}
              <th className={`${cellPad} w-28`}>
                <Skeleton className="h-3.5 w-20" />
              </th>
              <th className={`${cellPad} w-44`}>
                <Skeleton className="h-3.5 w-28" />
              </th>
              <th className={`${cellPad} w-48`}>
                <Skeleton className="h-3.5 w-32" />
              </th>
              <th className={`${cellPad} w-32`}>
                <Skeleton className="h-3.5 w-24" />
              </th>
              <th className={`${cellPad} w-32`}>
                <Skeleton className="h-3.5 w-24" />
              </th>
              <th className={`${cellPad} w-36`}>
                <Skeleton className="h-3.5 w-28" />
              </th>
              <th className={`${cellPad} w-28`}>
                <Skeleton className="h-3.5 w-20" />
              </th>
              {hasActions && (
                <th className={`${cellPad} w-20 text-right`}>
                  <Skeleton className="h-3.5 w-14 ml-auto" />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 dark:divide-slate-900">
            {rowArray.map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50/30 transition-colors"
              >
                {hasCheckbox && (
                  <td className={cellPad}>
                    <Skeleton className="w-4 h-4 rounded" />
                  </td>
                )}
                {/* ID pill */}
                <td className={cellPad}>
                  <Skeleton className="h-6 w-24 rounded-md" />
                </td>
                {/* Name & subtitle */}
                <td className={cellPad}>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-20 opacity-70" />
                  </div>
                </td>
                {/* Hospital / Clinic */}
                <td className={cellPad}>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-2.5 w-24 opacity-70" />
                  </div>
                </td>
                {/* Deal / Amount */}
                <td className={cellPad}>
                  <Skeleton className="h-3.5 w-20" />
                </td>
                {/* Payout / Status */}
                <td className={cellPad}>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                {/* Date / Form */}
                <td className={cellPad}>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-20 opacity-70" />
                  </div>
                </td>
                {/* Main Status badge */}
                <td className={cellPad}>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </td>
                {/* Actions button */}
                {hasActions && (
                  <td className={`${cellPad} text-right`}>
                    <Skeleton className="h-7 w-8 rounded-lg ml-auto" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableSkeletonRows({
  rows = 6,
  columns = 8,
  density = "comfortable",
}: {
  rows?: number;
  columns?: number;
  density?: "compact" | "comfortable";
}) {
  const cellPad = density === "compact" ? "py-2.5 px-3" : "py-3.5 px-4";
  const rowList = Array.from({ length: rows });
  const colList = Array.from({ length: columns });

  return (
    <>
      {rowList.map((_, rIdx) => (
        <tr key={rIdx} className="hover:bg-slate-50/30 transition-colors animate-pulse">
          {colList.map((_, cIdx) => (
            <td key={cIdx} className={cellPad}>
              {cIdx === 0 ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              ) : cIdx === 1 ? (
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-16 opacity-70" />
                </div>
              ) : cIdx === columns - 1 ? (
                <Skeleton className="h-7 w-8 rounded-lg ml-auto" />
              ) : cIdx === 2 ? (
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-14 opacity-70" />
                </div>
              ) : (
                <Skeleton className="h-4 w-20 rounded-md" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default DataTableSkeleton;
