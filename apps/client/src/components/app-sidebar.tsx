import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  IconArchive,
  IconQrcode,
  IconLayoutDashboard,
  IconHelp,
  IconPackage,
  IconFileImport,
  IconSettings,
  IconUsers,
  IconChartPie,
  IconLibrary,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bookie/ui/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { librarian } = useAuth();
  const { permissions, isAdmin, isStaff } = useRole();
  const location = useLocation();

  // Build navigation based on permissions
  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboard,
      isActive: location.pathname === "/dashboard",
    },
    {
      title: "Circulation",
      url: "/circulation",
      icon: IconQrcode,
      isActive: location.pathname.startsWith("/circulation"),
    },
    ...(permissions.canViewCatalog
      ? [
        {
          title: "Catalog",
          url: "/catalog",
          icon: IconArchive,
          isActive: location.pathname.startsWith("/catalog"),
        },
      ]
      : []),
    ...(isStaff
      ? [
        {
          title: "Inventory",
          url: "/inventory",
          icon: IconPackage,
          isActive: location.pathname.startsWith("/inventory"),
        },
      ]
      : []),
    ...(permissions.canViewStudents
      ? [
        {
          title: "Students",
          url: "/students",
          icon: IconUsers,
          isActive: location.pathname.startsWith("/students"),
        },
      ]
      : []),
    ...(permissions.canViewReports
      ? [
        {
          title: "Reports",
          url: "/reports",
          icon: IconChartPie,
          isActive: location.pathname.startsWith("/reports"),
        },
      ]
      : []),
  ];

  const navSecondary = [
    ...(isAdmin
      ? [
        {
          title: "Settings",
          url: "/settings",
          icon: IconSettings,
        },
        {
          title: "Team Members",
          url: "/settings/members",
          icon: IconUsers,
        },
        {
          title: "Data Import",
          url: "/settings/import",
          icon: IconFileImport,
        },
      ]
      : []),
    {
      title: "Help",
      url: "/help",
      icon: IconHelp,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/dashboard">
                <IconLibrary className="!size-5 text-primary" />
                <span className="text-base font-semibold text-foreground">Bookie</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {librarian && (
          <NavUser
            user={{
              name: librarian.name,
              email: librarian.role,
              avatar: "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
