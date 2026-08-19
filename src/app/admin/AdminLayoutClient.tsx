"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Calendar, Briefcase, Heart, MessageSquare, 
  Activity, Settings, LogOut, FileText, Gift, Dna, ShieldCheck, 
  Building2, HeartHandshake, ChevronUp, User2, ChevronsUpDown
} from "lucide-react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const sidebarLinks = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiredPermission: "VIEW_DASHBOARD" },
      { href: "/reports", label: "Analytics & Reports", icon: Settings, requiredPermission: "VIEW_REPORTS" },
    ]
  },
  {
    title: "Donors & Recipients",
    items: [
      { href: "/donor-requests", label: "Donor Requests", icon: HeartHandshake, requiredPermission: "VIEW_DONOR_REQUESTS" },
      { href: "/inquiries", label: "Inquiries", icon: FileText, requiredPermission: "VIEW_INQUIRIES" },
      { href: "/donor-registrations", label: "Registrations", icon: Heart, requiredPermission: "VIEW_REGISTRATIONS" },
      { href: "/donor-requirements", label: "Requirements", icon: Dna, requiredPermission: "VIEW_REQUIREMENTS" },
    ]
  },
  {
    title: "Management",
    items: [
      { href: "/hospitals", label: "Hospitals", icon: Building2, requiredPermission: "VIEW_HOSPITALS" },
      { href: "/manage-registrations", label: "Registration Checks", icon: ShieldCheck, requiredPermission: "VIEW_REG_CHECKS" },
      { href: "/referrals", label: "Referrals", icon: Gift, requiredPermission: "VIEW_REFERRALS" },
      { href: "/services", label: "Services", icon: Briefcase, requiredPermission: "VIEW_SERVICES" },
      { href: "/appointments", label: "Appointments", icon: Calendar, requiredPermission: "VIEW_BOOKINGS" },
      { href: "/reviews", label: "Reviews", icon: MessageSquare, requiredPermission: "VIEW_FEEDBACK" },
      { href: "/blog", label: "CMS Manager", icon: FileText, requiredPermission: "MANAGE_BLOG" },
      { href: "/employees", label: "Staff", icon: Activity, requiredPermission: "MANAGE_STAFF" },
    ]
  }
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  session: any;
  initialNotifications: any[];
  initialUnreadCount: number;
}

export default function AdminLayoutClient({
  children,
  session,
  initialNotifications,
  initialUnreadCount,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/admin") {
      if (!session) {
        router.push("/admin");
      } else {
        const role = (session.user as any).role;
        const isAllowedRole = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(role);
        if (!isAllowedRole) {
          router.push("/admin");
        }
      }
    }
  }, [session, pathname, router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/admin");
  };

  // Root admin page is the login form, so skip layout entirely
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  const userRole = (session?.user as any)?.role;
  const isAllowedRole = ["ADMIN", "SUPER_ADMIN", "STAFF", "DOCTOR", "RECEPTIONIST"].includes(userRole);
  
  if (!session || !isAllowedRole) {
    return null;
  }

  const userPermissions = (session.user as any)?.permissions || [];
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  const filteredLinks = sidebarLinks.map(group => ({
    ...group,
    items: group.items.filter(item => 
      isAdmin || item.requiredPermission === "VIEW_DASHBOARD" || userPermissions.includes(item.requiredPermission)
    )
  })).filter(group => group.items.length > 0);

  const basePath = pathname.startsWith("/employee") ? "/employee" : "/admin";
  const portalName = basePath === "/employee" ? "Mediyaz Employee" : "Mediyaz Admin";

  const activeLinkLabel = filteredLinks.flatMap(g => g.items).find(i => (basePath + i.href) === pathname)?.label || "Page";

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r shadow-sm">
        <SidebarHeader className="border-b px-6 py-4 flex items-center h-16 shrink-0">
          <Link href={`${basePath}/dashboard`} className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <Heart className="h-6 w-6 text-brand-500 fill-brand-500" />
            {portalName}
          </Link>
        </SidebarHeader>
        
        <SidebarContent className="px-2">
          {filteredLinks.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        isActive={pathname === (basePath + item.href)} 
                        tooltip={item.label}
                        className={pathname === (basePath + item.href) ? "bg-brand-500/10 text-brand-600 font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"}
                        render={
                          <Link href={basePath + item.href}>
                            <item.icon className={pathname === (basePath + item.href) ? "text-brand-600" : ""} />
                            <span>{item.label}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`${basePath}/dashboard`}>{portalName} Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">{activeLinkLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell 
              initialNotifications={initialNotifications} 
              initialUnreadCount={initialUnreadCount} 
            />
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none"
                render={
                  <button className="flex items-center gap-3 p-1 rounded-full hover:bg-muted transition-colors">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 font-bold border border-brand-500/20">
                      {session.user?.name?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className="hidden md:grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-foreground">{session.user?.name || "Admin User"}</span>
                      <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider">{session.user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-1 size-3 text-muted-foreground hidden md:block" />
                  </button>
                }
              />
              <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-56"
              >
                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`${basePath}/profile`)}>
                  <User2 className="mr-2 size-4" />
                  <span>Account Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Secure Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 bg-muted/20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
