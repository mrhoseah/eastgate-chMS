"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { appConfig } from "@/lib/app-config";
import {
  Building,
  Calendar,
  Church,
  ClipboardCheck,
  Crown,
  FileText,
  Image,
  LayoutDashboard,
  Layers,
  Mail,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ChurchSelector } from "@/components/church-selector";

const roleGroups = {
  everyone: [
    "SUPERADMIN",
    "ADMIN",
    "PASTOR",
    "LEADER",
    "MEMBER",
    "GUEST",
    "FINANCE",
    "USHER",
    "PROTOCOL",
    "ACCOUNT_MANAGER",
  ] as const,
  ministry: ["SUPERADMIN", "ADMIN", "PASTOR", "LEADER", "ACCOUNT_MANAGER"] as const,
  leadership: ["SUPERADMIN", "ADMIN", "PASTOR", "LEADER", "ACCOUNT_MANAGER"] as const,
  finance: ["SUPERADMIN", "ADMIN", "FINANCE", "ACCOUNT_MANAGER"] as const,
  adminOnly: ["SUPERADMIN", "ADMIN"] as const,
};

type UserRole = typeof roleGroups.everyone[number];

const isKnownRole = (value?: string): value is UserRole => {
  if (!value) {
    return false;
  }
  return roleGroups.everyone.includes(value as UserRole);
};

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: readonly UserRole[];
}

interface NavSection {
  title: string;
  description?: string;
  items: NavItem[];
  roles?: readonly UserRole[];
}

const overviewNav: NavItem = {
  title: "Overview",
  url: "/dashboard",
  icon: LayoutDashboard,
};

const navSections: NavSection[] = [
  {
    title: "People & Engagement",
    description: "Care for every person",
    roles: roleGroups.ministry,
    items: [
      { title: "People", url: "/dashboard/people", icon: Users },
      { title: "Groups", url: "/dashboard/groups", icon: Users },
      { title: "Departments", url: "/dashboard/departments", icon: Building },
      { title: "Communications", url: "/dashboard/communications", icon: Mail },
    ],
  },
  {
    title: "Ministry & Events",
    description: "Plan the rhythm of ministry",
    roles: roleGroups.ministry,
    items: [
      { title: "Events & Calendar", url: "/dashboard/events", icon: Calendar },
      { title: "Attendance", url: "/dashboard/attendance", icon: ClipboardCheck },
      { title: "Media Library", url: "/dashboard/media", icon: Image },
      { title: "Documents", url: "/dashboard/documents", icon: FileText },
    ],
  },
  {
    title: "Giving & Financials",
    description: "Steward generosity with clarity",
    roles: roleGroups.finance,
    items: [{ title: "Giving & Finance", url: "/dashboard/donations", icon: Wallet }],
  },
  {
    title: "Analytics & Insights",
    description: "See how the story is unfolding",
    roles: roleGroups.leadership,
    items: [
      { title: "Analytics", url: "/dashboard/analytics", icon: TrendingUp },
      { title: "Reports", url: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    title: "System Administration",
    description: "Keep operations tight",
    roles: roleGroups.leadership,
    items: [
      { title: "Workflows", url: "/dashboard/workflows", icon: Workflow },
      { title: "Bulk Operations", url: "/dashboard/bulk-operations", icon: Layers },
      { title: "Audit Logs", url: "/dashboard/audit-logs", icon: Shield, roles: roleGroups.adminOnly },
      { title: "Premium Features", url: "/dashboard/features", icon: Crown, badge: "Pro", roles: roleGroups.adminOnly },
      { title: "Settings", url: "/dashboard/settings", icon: Settings, roles: roleGroups.adminOnly },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const OverviewIcon = overviewNav.icon;

  const normalizedRole = session?.user?.role?.toUpperCase();
  const viewerRole: UserRole = isKnownRole(normalizedRole) ? normalizedRole : "GUEST";

  const canAccess = (allowed?: readonly UserRole[]) => {
    if (!allowed || allowed.length === 0) {
      return true;
    }
    return allowed.includes(viewerRole);
  };

  // Pre-filter sections so we never render empty containers
  const filteredSections = navSections
    .map((section) => {
      const permittedItems = section.items.filter((item) =>
        canAccess(item.roles ?? section.roles ?? roleGroups.everyone),
      );

      if (!canAccess(section.roles ?? roleGroups.everyone) || permittedItems.length === 0) {
        return null;
      }

      return { ...section, items: permittedItems };
    })
    .filter((section): section is NavSection => Boolean(section));

  // Check if a path is active (handles query params and nested routes)
  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="space-y-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground">
              <Link href="/dashboard">
                <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                  <Church className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">{appConfig.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{appConfig.tagline}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ChurchSelector />
      </SidebarHeader>

      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(overviewNav.url)}
                  className="group relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
                >
                  <Link href={overviewNav.url}>
                    <OverviewIcon className="size-4 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{overviewNav.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {filteredSections.map((section, sectionIndex) => (
          <Fragment key={section.title}>
            <SidebarGroup>
              <div className="px-2 pb-2">
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
                  {section.title}
                </SidebarGroupLabel>
                {section.description && (
                  <p className="text-[11px] text-sidebar-foreground/70 leading-snug">
                    {section.description}
                  </p>
                )}
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={`${item.url}-${index}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="group relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200"
                        >
                          <Link href={item.url}>
                            <Icon className="size-4 transition-transform group-hover:scale-110" />
                            <span className="font-medium">{item.title}</span>
                            {item.badge && (
                              <Badge className="ml-auto bg-white/20 text-[10px] uppercase tracking-wide">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {sectionIndex < filteredSections.length - 1 && <SidebarSeparator />}
          </Fragment>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
