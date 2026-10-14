"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <Card key={n} className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <div className="mt-4 space-y-1.5">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart Skeleton */}
        <Card className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <div className="h-[250px] w-full flex items-end gap-3 pt-6 px-4">
            {[40, 65, 50, 80, 60, 90, 75, 95, 70, 85, 60, 100].map((heightPercent, idx) => (
              <div key={idx} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
                <Skeleton
                  className="w-full rounded-t-md opacity-70"
                  style={{ height: `${heightPercent}%` }}
                />
                <Skeleton className="h-2.5 w-6" />
              </div>
            ))}
          </div>
        </Card>

        {/* Donut Chart Skeleton */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <Skeleton className="h-5 w-40 mb-1.5" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <div className="my-8 flex items-center justify-center">
            <div className="relative w-36 h-36 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full border-4 border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Activity / Overview Row */}
      <Card className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-950 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default DashboardSkeleton;
