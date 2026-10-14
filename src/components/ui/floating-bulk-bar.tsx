"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingBulkBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
  itemLabel?: string;
}

export function FloatingBulkBar({
  selectedCount,
  onClear,
  children,
  className,
  itemLabel = "records",
}: FloatingBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90vw] sm:w-auto animate-in slide-in-from-bottom-6 fade-in duration-200",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white shadow-2xl backdrop-blur-md border border-slate-700/80">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
          <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-bold text-[11px] flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
          <span className="text-xs font-semibold whitespace-nowrap">
            <span className="text-teal-400 font-bold">{selectedCount}</span> {itemLabel} selected
          </span>
        </div>

        {/* Action buttons slot */}
        <div className="flex items-center gap-2 flex-wrap">{children}</div>

        {/* Clear selection */}
        <Button
          type="button"
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export default FloatingBulkBar;
