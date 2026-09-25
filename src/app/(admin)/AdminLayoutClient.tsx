"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard,
  Activity,
  FileText,
  Dna,
  ShieldCheck, 
  Building2,
  HeartHandshake,
  User2,
  ChevronsUpDown,
  Clock,
  Heart,
  Users,
  FileCheck,
  Award,
  MessageSquare,
  LogOut,
  Sliders,
  ExternalLink,
  Search,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SidebarLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission: string;
  badge?: string;
}

interface SidebarGroupSection {
  title: string;
  items: SidebarLinkItem[];
}

const sidebarNavigation: SidebarGroupSection[] = [
  {
    title: "Clinical Operations",
    items: [
      { href: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard, requiredPermission: "VIEW_DASHBOARD" },
      { href: "/donor-registrations/egg", label: "Egg Registrations", icon: Heart, requiredPermission: "VIEW_REGISTRATIONS" },
      { href: "/donor-registrations/sperm", label: "Sperm Registrations", icon: Dna, requiredPermission: "VIEW_REGISTRATIONS" },
      { href: "/manage-registrations", label: "Egg Donor Management", icon: ShieldCheck, requiredPermission: "VIEW_REG_CHECKS" },
      { href: "/manage-sperm-registrations", label: "Sperm Donor Management", icon: ShieldCheck, requiredPermission: "VIEW_REG_CHECKS" },
    ]
  },
  {
    title: "Completed Files",
    items: [
      { href: "/completed-files/egg", label: "Egg Donor Files", icon: FileCheck, requiredPermission: "VIEW_REGISTRATIONS" },
      { href: "/completed-files/sperm", label: "Sperm Donor Files", icon: FileCheck, requiredPermission: "VIEW_REGISTRATIONS" },
    ]
  },
  // {
  //   title: "Donor Directory",
  //   items: [
  //     { href: "/donors/egg", label: "Egg Donor Directory", icon: Users, requiredPermission: "VIEW_DONOR_REQUESTS" },
  //     { href: "/donors/sperm", label: "Sperm Donor Directory", icon: Dna, requiredPermission: "VIEW_DONOR_REQUESTS" },
  //   ]
  // },
  // {
  //   title: "Intended Parents & Orders",
  //   items: [
  //     { href: "/donor-requests", label: "Donor Allocation Requests", icon: HeartHandshake, requiredPermission: "VIEW_DONOR_REQUESTS" },
  //     { href: "/donor-requirements", label: "Parent Requirements", icon: Dna, requiredPermission: "VIEW_REQUIREMENTS" },
  //     { href: "/contact-messages", label: "Inquiries & Consultations", icon: MessageSquare, requiredPermission: "VIEW_INQUIRIES" },
  //   ]
  // },
  {
    title: "ART Clinic Network",
    items: [
      { href: "/hospitals", label: "Registered ART Clinics", icon: Building2, requiredPermission: "VIEW_HOSPITALS" },
      { href: "/hospitals/leaderboard", label: "Clinic Performance", icon: Award, requiredPermission: "VIEW_HOSPITALS" },
    ]
  },
  {
    title: "Affiliates & Partners",
    items: [
      { href: "/agents", label: "Referral Partners (Agents)", icon: Users, requiredPermission: "VIEW_REFERRALS" },
    ]
  },
  // {
  //   title: "Administration & System",
  //   items: [
  //     { href: "/employees", label: "Staff & Role Management", icon: Activity, requiredPermission: "MANAGE_STAFF" },
  //     { href: "/reports", label: "Clinical Analytics & Reports", icon: Sliders, requiredPermission: "VIEW_REPORTS" },
  //     { href: "/audit-logs", label: "Compliance & Activity Logs", icon: Clock, requiredPermission: "VIEW_REPORTS" },
  //     { href: "/blog", label: "CMS & Medical Blog", icon: FileText, requiredPermission: "MANAGE_BLOG" },
  //   ]
  // }
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: any;
  initialNotifications?: any[];
  initialUnreadCount?: number;
  defaultOpen?: boolean;
}

export default function AdminLayoutClient({
  children,
  session,
  initialNotifications = [],
  initialUnreadCount = 0,
  defaultOpen = true,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/admin" && pathname !== "/login") {
      if (!session) {
        router.push("/login");
      } else {
        const role = (session.user as any)?.role;
        const isAllowedRole = ["ADMIN", "SUPER_ADMIN"].includes(role);
        if (!isAllowedRole) {
          router.push("/login");
        }
      }
    }
  }, [session, pathname, router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (pathname === "/admin" || pathname === "/login") {
    return <>{children}</>;
  }

  const userRole = (session?.user as any)?.role || "ADMIN";
  const isAllowedRole = ["ADMIN", "SUPER_ADMIN"].includes(userRole);
  
  if (!session || !isAllowedRole) {
    return null;
  }

  const userPermissions = (session.user as any)?.permissions || [];
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  const filteredLinks = sidebarNavigation.map(group => ({
    ...group,
    items: group.items.filter(item => 
      isAdmin || item.requiredPermission === "VIEW_DASHBOARD" || userPermissions.includes(item.requiredPermission)
    )
  })).filter(group => group.items.length > 0);

  const basePath = pathname.startsWith("/admin") ? "/admin" : "";
  const activeLinkLabel = filteredLinks
    .flatMap(g => g.items)
    .find(i => (basePath + i.href) === pathname || i.href === pathname)?.label || "Overview";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar collapsible="icon" className="border-r border-slate-200/90 bg-white">
        
        {/* Official Brand Header */}
        <SidebarHeader className="border-b border-slate-200/80 px-3 py-3 h-16 shrink-0 flex items-center justify-between bg-white">
          <Link
            href={`${basePath}/dashboard`}
            className="flex items-center gap-2.5 group focus:outline-none w-full group-data-[collapsible=icon]:justify-center"
            aria-label="Mediyaz Admin Console"
          >
            {/* Crisp Brand Icon */}
            <div className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-teal-50/80 border border-teal-100/80 shadow-2xs">
              <Image
                src="/logo-icon.webp"
                alt="Mediyaz ART Bank Logo"
                width={36}
                height={36}
                className="w-7 h-7 object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </div>

            {/* Expanded Brand Name & Tag */}
            <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-black tracking-tight text-slate-900 leading-tight truncate">
                Mediyaz <span className="text-[#285b63]">ART Bank</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#285b63] font-mono leading-none truncate">
                  Admin Console
                </span>
              </div>
            </div>
          </Link>
        </SidebarHeader>
        
        {/* Navigation Content */}
        <SidebarContent className="px-3 group-data-[collapsible=icon]:px-1.5 py-3 space-y-4 group-data-[collapsible=icon]:space-y-2 overflow-x-hidden">
          {filteredLinks.map((group) => (
            <SidebarGroup key={group.title} className="p-0">
              <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1 truncate whitespace-nowrap group-data-[collapsible=icon]:hidden">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === (basePath + item.href) || pathname === item.href;
                    const IconComponent = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 ${
                            isActive
                              ? "bg-[#285b63] text-white font-bold shadow-xs hover:bg-[#204b52] hover:text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                          }`}
                          render={
                            <Link href={basePath + item.href} aria-label={item.label}>
                              <IconComponent
                                className={`w-4 h-4 shrink-0 transition-colors ${
                                  isActive ? "text-white" : "text-slate-500 group-hover:text-[#285b63]"
                                }`}
                              />
                              <span className="truncate whitespace-nowrap group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="bg-[#f8fafc] min-w-0 overflow-x-clip">
        
        {/* Sticky Executive Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 lg:px-6 z-30 sticky top-0 shadow-xs">
          
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg" />
            <Separator orientation="vertical" className="h-5 bg-slate-200 hidden sm:block" />
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList className="text-xs font-medium text-slate-500">
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${basePath}/dashboard`} className="hover:text-[#285b63]">
                    Mediyaz Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-300" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold text-slate-900">
                    {activeLinkLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-3">
            
            

            <Separator orientation="vertical" className="h-5 bg-slate-200 hidden md:block" />

            {/* Notification Bell */}
            <NotificationBell 
              initialNotifications={initialNotifications} 
              initialUnreadCount={initialUnreadCount} 
            />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="focus:outline-none"
                render={
                  <button
                    type="button"
                    aria-label={session.user?.name ? `${session.user.name}'s account menu` : "User account menu"}
                    className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#285b63]/30 transition-all cursor-pointer group"
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "Profile"}
                        className="w-9 h-9 rounded-full object-cover shadow-xs border border-slate-200 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#285b63] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                        {session.user?.name?.charAt(0).toUpperCase() || "M"}
                      </div>
                    )}
                  </button>
                }
              />
              <DropdownMenuContent side="bottom" align="end" className="w-64 rounded-2xl p-2 shadow-xl border-slate-200/90 bg-white">
                {/* Account Header */}
                <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-100 mb-1.5 flex items-center gap-3">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#285b63] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      {session.user?.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {session.user?.name || "Mediyaz Administrator"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      {session.user?.email || "admin@mediyaz.org"}
                    </p>
                    <div className="mt-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-teal-50 text-[#285b63] border border-teal-200/70">
                        {userRole === "SUPER_ADMIN" ? "Super Admin" : userRole === "ADMIN" ? "Admin" : userRole === "DOCTOR" ? "Doctor" : "Employee"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <DropdownMenuItem
                    onClick={() => router.push(`${basePath}/profile`)}
                    className="cursor-pointer text-xs rounded-xl flex items-center gap-2.5 p-2 font-medium hover:bg-slate-100/80 text-slate-700"
                  >
                    <User2 className="w-4 h-4 text-slate-500" />
                    <span>My Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push(`${basePath}/dashboard`)}
                    className="cursor-pointer text-xs rounded-xl flex items-center gap-2.5 p-2 font-medium hover:bg-slate-100/80 text-slate-700"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>Executive Dashboard</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push(`${basePath}/reports`)}
                    className="cursor-pointer text-xs rounded-xl flex items-center gap-2.5 p-2 font-medium hover:bg-slate-100/80 text-slate-700"
                  >
                    <Sliders className="w-4 h-4 text-slate-500" />
                    <span>System Analytics</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-xs rounded-xl flex items-center gap-2.5 p-2 font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 w-full min-w-0">
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
}
