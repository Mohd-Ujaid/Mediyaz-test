"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Check,
  Ban,
  FilePlus,
} from "lucide-react";

export type StatusVariant =
  | "NEW"
  | "SUBMITTED"
  | "IN_PROCESS"
  | "UNDER_REVIEW"
  | "DOCUMENTS_VERIFIED"
  | "AFFIDAVIT_UPLOADED"
  | "APPROVED"
  | "WAITING_FORM13"
  | "FILE_COMPLETED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "SUSPENDED"
  | "DRAFT"
  | "PAID"
  | "RECEIVED"
  | "PARTIALLY_PAID"
  | "PARTIALLY_RECEIVED"
  | "PENDING"
  | "UNPAID"
  | "ACTIVE"
  | "INACTIVE"
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  showIcon?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  className: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const statusMap: Record<string, StatusConfig> = {
  // New / Intake
  NEW: {
    label: "New",
    className: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    dotColor: "bg-sky-500",
    icon: FilePlus,
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    dotColor: "bg-sky-500",
    icon: FileText,
  },

  // Review & Progression
  IN_PROCESS: {
    label: "In Process",
    className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  DOCUMENTS_VERIFIED: {
    label: "Docs Verified",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
    icon: ShieldCheck,
  },
  AFFIDAVIT_UPLOADED: {
    label: "Affidavit Uploaded",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
    icon: FileText,
  },
  WAITING_FORM13: {
    label: "Waiting Form 13",
    className: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dotColor: "bg-purple-500",
    icon: Clock,
  },

  // Approved & Completed
  APPROVED: {
    label: "Approved",
    className: "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    dotColor: "bg-teal-600",
    icon: CheckCircle2,
  },
  FILE_COMPLETED: {
    label: "File Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: Check,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },

  // Negative / Inactive
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotColor: "bg-rose-500",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotColor: "bg-rose-500",
    icon: XCircle,
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-600",
    icon: Ban,
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
    dotColor: "bg-slate-400",
    icon: FileText,
  },

  // Financial / Invoices
  PAID: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  RECEIVED: {
    label: "Received",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  PARTIALLY_RECEIVED: {
    label: "Partially Received",
    className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  UNPAID: {
    label: "Unpaid",
    className: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotColor: "bg-rose-500",
    icon: AlertCircle,
  },

  // General Status
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    icon: CheckCircle2,
  },
  INACTIVE: {
    label: "Inactive",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
    dotColor: "bg-slate-400",
    icon: XCircle,
  },
};

const sizeClasses = {
  xs: "text-[10px] py-0.5 px-2 gap-1 rounded-full",
  sm: "text-[11px] py-1 px-2.5 gap-1.5 rounded-full",
  md: "text-xs py-1 px-3 gap-1.5 rounded-full",
};

export function StatusBadge({
  status,
  label,
  size = "xs",
  showDot = true,
  showIcon = false,
  className,
}: StatusBadgeProps) {
  const normalizedKey = (status || "").toString().trim().toUpperCase().replace(/\s+/g, "_");
  const config = statusMap[normalizedKey] || {
    label: status ? status.replace(/_/g, " ") : "Unknown",
    className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
    dotColor: "bg-slate-400",
    icon: Clock,
  };

  const displayText = label || config.label;
  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wide border uppercase whitespace-nowrap shadow-2xs select-none transition-colors",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dotColor
          )}
        />
      )}
      {showIcon && <IconComponent className="w-3 h-3 shrink-0" />}
      <span>{displayText}</span>
    </span>
  );
}

export default StatusBadge;
