"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  Search,
  Crown,
  Check,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
}

export interface PermissionGroup {
  category: string;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "Overview & Dashboards",
    permissions: [
      { key: "VIEW_DASHBOARD", label: "Dashboard Overview", description: "View operations overview, KPIs and navigation" },
      { key: "VIEW_ANALYTICS", label: "Analytics & Reports", description: "Access detailed charts and operational statistics" },
    ],
  },
  {
    category: "Donors & Clinical Dossiers",
    permissions: [
      { key: "VIEW_REGISTRATIONS", label: "View Registrations", description: "Inspect Egg & Sperm donor clinical dossier files" },
      { key: "CREATE_REGISTRATIONS", label: "Create Registrations", description: "Initiate new donor registration applications" },
      { key: "EDIT_REGISTRATIONS", label: "Edit Clinical Forms", description: "Update forms, medical tests, and stage progression" },
      { key: "APPROVE_REGISTRATIONS", label: "Approve & Certify", description: "Clear quarantine and issue donor certificates" },
      { key: "ASSIGN_REGISTRATIONS", label: "Assign to Hospitals", description: "Link cleared donor files to partner fertility clinics" },
      { key: "EXPORT_REGISTRATIONS", label: "Export Dossiers & Excel", description: "Download donor summary spreadsheets and PDF dossiers" },
    ],
  },
  {
    category: "Clinics & Partner Hospitals",
    permissions: [
      { key: "VIEW_HOSPITALS", label: "View Hospitals", description: "Access directory of IVF centers and contracted rates" },
      { key: "MANAGE_HOSPITALS", label: "Manage Hospitals", description: "Onboard new IVF clinics and manage agreements" },
    ],
  },
  {
    category: "Billing, Invoices & Ledgers",
    permissions: [
      { key: "VIEW_INVOICES", label: "View Invoices", description: "Review clinic billing and invoice payment statuses" },
      { key: "MANAGE_INVOICES", label: "Generate & Manage Invoices", description: "Issue GST tax invoices and record payments" },
      { key: "VIEW_LEDGER", label: "View Ledgers", description: "Inspect clinic balance ledgers and payout records" },
      { key: "MANAGE_LEDGER", label: "Manage Financial Ledgers", description: "Record settlements, disbursements, and collections" },
    ],
  },
  {
    category: "Team Directory & Administration",
    permissions: [
      { key: "VIEW_EMPLOYEES", label: "Staff Directory", description: "View internal clinic employees and roles" },
      { key: "MANAGE_EMPLOYEES", label: "Manage Staff", description: "Add, edit, or archive internal clinic employees" },
      { key: "VIEW_USERS", label: "View Portal Users", description: "Inspect portal login accounts and credentials" },
      { key: "MANAGE_USERS", label: "Manage User Roles", description: "Modify user permissions, departments, and roles" },
      { key: "MANAGE_CMS", label: "CMS & Editorial Blog", description: "Create and publish educational articles" },
    ],
  },
  {
    category: "Security & Governance",
    permissions: [
      { key: "REVIEW_DELETION_REQUESTS", label: "Review Deletion Requests", description: "Audit data removal requests from staff" },
      { key: "DELETE_RECORDS", label: "Direct Purge Authority", description: "Permanently delete records directly (Super Admin only)" },
    ],
  },
];

export const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_REGISTRATIONS",
    "CREATE_REGISTRATIONS",
    "EDIT_REGISTRATIONS",
    "APPROVE_REGISTRATIONS",
    "ASSIGN_REGISTRATIONS",
    "EXPORT_REGISTRATIONS",
    "VIEW_HOSPITALS",
    "MANAGE_HOSPITALS",
    "VIEW_INVOICES",
    "MANAGE_INVOICES",
    "VIEW_LEDGER",
    "MANAGE_LEDGER",
    "VIEW_EMPLOYEES",
    "MANAGE_EMPLOYEES",
    "VIEW_USERS",
    "MANAGE_USERS",
    "MANAGE_CMS",
  ],
  MANAGER: [
    "VIEW_DASHBOARD",
    "VIEW_REGISTRATIONS",
    "CREATE_REGISTRATIONS",
    "EDIT_REGISTRATIONS",
    "ASSIGN_REGISTRATIONS",
    "VIEW_HOSPITALS",
    "VIEW_EMPLOYEES",
    "MANAGE_EMPLOYEES",
    "VIEW_INVOICES",
  ],
  EMPLOYEE: [
    "VIEW_DASHBOARD",
    "VIEW_REGISTRATIONS",
    "CREATE_REGISTRATIONS",
    "EDIT_REGISTRATIONS",
    "VIEW_HOSPITALS",
  ],
  DOCTOR: [
    "VIEW_DASHBOARD",
    "VIEW_REGISTRATIONS",
    "EDIT_REGISTRATIONS",
    "VIEW_HOSPITALS",
  ],
  STAFF: [
    "VIEW_DASHBOARD",
    "VIEW_REGISTRATIONS",
    "CREATE_REGISTRATIONS",
    "EDIT_REGISTRATIONS",
  ],
  RECEPTIONIST: [
    "VIEW_DASHBOARD",
    "VIEW_REGISTRATIONS",
    "CREATE_REGISTRATIONS",
  ],
};

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (newPermissions: string[]) => void;
  role: string;
  isSuperAdmin?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

export function PermissionSelector({
  selectedPermissions = [],
  onChange,
  role,
  isSuperAdmin = false,
  disabled = false,
  disabledMessage,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");

  const isFullRootAccess = selectedPermissions.includes("*");

  const togglePermission = (key: string) => {
    if (disabled) return;
    if (isFullRootAccess) {
      // Transition from root to explicit list
      onChange(ALL_PERM_KEYS.filter((k) => k !== key));
      return;
    }
    if (selectedPermissions.includes(key)) {
      onChange(selectedPermissions.filter((p) => p !== key));
    } else {
      onChange([...selectedPermissions, key]);
    }
  };

  const applyRoleDefaults = () => {
    if (disabled) return;
    const defaults = DEFAULT_ROLE_PERMS[role] || ["VIEW_DASHBOARD"];
    onChange([...defaults]);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...ALL_PERM_KEYS]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const toggleFullAccess = () => {
    if (disabled) return;
    if (isFullRootAccess) {
      applyRoleDefaults();
    } else {
      onChange(["*"]);
    }
  };

  // Filter permissions based on search
  const filteredGroups = PERMISSION_GROUPS.map((group) => {
    const filtered = group.permissions.filter(
      (p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
    return { ...group, permissions: filtered };
  }).filter((group) => group.permissions.length > 0);

  const selectedCount = isFullRootAccess
    ? ALL_PERM_KEYS.length
    : selectedPermissions.filter((p) => ALL_PERM_KEYS.includes(p)).length;

  return (
    <div className="space-y-2.5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <label className="font-bold text-xs text-slate-800 dark:text-slate-200">
            Access Permissions
          </label>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#285b63]/10 text-[#285b63] dark:text-teal-300 border border-[#285b63]/20">
            {isFullRootAccess ? "Full Root (*)" : `${selectedCount} of ${ALL_PERM_KEYS.length} enabled`}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={applyRoleDefaults}
            className="h-7 px-2 text-[11px] font-semibold rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 text-[#285b63] dark:text-teal-300 border-[#285b63]/30 disabled:opacity-50"
            title={`Set default permissions for ${role}`}
          >
            <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
            Apply {role} Defaults
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={selectAll}
            className="h-7 px-2 text-[11px] font-medium text-slate-600 dark:text-slate-400 disabled:opacity-50"
          >
            Select All
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={clearAll}
            className="h-7 px-2 text-[11px] font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50"
          >
            Clear
          </Button>

          {isSuperAdmin && (
            <Button
              type="button"
              variant={isFullRootAccess ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={toggleFullAccess}
              className={`h-7 px-2 text-[11px] font-bold rounded-lg disabled:opacity-50 ${
                isFullRootAccess
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-amber-300 text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Crown className="w-3 h-3 mr-1" />
              Full Root (*)
            </Button>
          )}
        </div>
      </div>

      {/* Disabled / Locked Notice */}
      {disabled && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[11px]">Permissions Locked</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
              {disabledMessage || "Administrator authority restriction: Administrators cannot modify another Administrator's role or permissions. Only the Super Administrator can modify Administrator credentials."}
            </p>
          </div>
        </div>
      )}

      {/* Search Input for fast finding */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter permissions (e.g. registration, hospital, ledger)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#285b63]"
        />
      </div>

      {/* Root Access Banner if active */}
      {isFullRootAccess && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-[11px]">
              Full Root Authority Enabled: This account has wildcard (*) access to every action.
            </span>
          </div>
          <button
            type="button"
            onClick={applyRoleDefaults}
            className="text-[10px] underline font-bold hover:text-amber-700 shrink-0 ml-2"
          >
            Switch to Custom Permissions
          </button>
        </div>
      )}

      {/* Scrollable Permissions List */}
      <div className="max-h-60 overflow-y-auto space-y-3 p-2.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No permissions matched "{search}".
          </div>
        ) : (
          filteredGroups.map((group) => {
            const groupActiveCount = isFullRootAccess
              ? group.permissions.length
              : group.permissions.filter((p) => selectedPermissions.includes(p.key)).length;

            return (
              <div key={group.category} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {group.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {groupActiveCount}/{group.permissions.length} active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.permissions.map((perm) => {
                    const isChecked = isFullRootAccess || selectedPermissions.includes(perm.key);

                    return (
                      <div
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all select-none ${
                          disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                        } ${
                          isChecked
                            ? "bg-teal-50/70 dark:bg-teal-950/30 border-[#285b63]/50 dark:border-teal-700/60 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                              isChecked
                                ? "bg-[#285b63] text-white"
                                : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold leading-tight truncate ${
                                isChecked
                                  ? "text-[#285b63] dark:text-teal-300"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {perm.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
