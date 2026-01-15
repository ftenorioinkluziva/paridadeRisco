"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";
import AtomIcon from "~/components/icons/atom";
import BracketsIcon from "~/components/icons/brackets";
import ProcessorIcon from "~/components/icons/proccesor";
import CuteRobotIcon from "~/components/icons/cute-robot";
import EmailIcon from "~/components/icons/email";
import GearIcon from "~/components/icons/gear";
import MonkeyIcon from "~/components/icons/monkey";
import DotsVerticalIcon from "~/components/icons/dots-vertical";
import ChartIcon from "~/components/icons/chart";
import WalletIcon from "~/components/icons/wallet";
import PiggyBankIcon from "~/components/icons/piggy-bank";
import BasketIcon from "~/components/icons/basket";
import LayoutIcon from "~/components/icons/layout";
import { Bullet } from "~/components/ui/bullet";
import LockIcon from "~/components/icons/lock";
import Image from "next/image";
import { useIsV0 } from "~/lib/v0-context";
import { api } from "~/lib/api";
import { useRouter, usePathname } from "next/navigation";

// This is sample data for the sidebar
const navItems = [
  {
    title: "Ferramentas",
    items: [
      {
        title: "Visão Geral",
        url: "/overview",
        icon: BracketsIcon,
        locked: false,
      },
      {
        title: "Portfólio",
        url: "/portfolio",
        icon: LayoutIcon,
        locked: false,
      },
      {
        title: "Gráficos",
        url: "/charts",
        icon: ChartIcon,
        locked: false,
      },
      {
        title: "Cestas",
        url: "/baskets",
        icon: BasketIcon,
        locked: false,
      },
      {
        title: "Aposentadoria",
        url: "/retirement",
        icon: PiggyBankIcon,
        locked: false,
      },
      {
        title: "Admin",
        url: "/admin",
        icon: GearIcon,
        locked: false,
      },
    ],
  },
];

// Helper function to get user initials
const getUserInitials = (name?: string) => {
  if (!name) return "U";
  const nameParts = name.split(" ");
  if (nameParts.length >= 2) {
    return `${nameParts[0]![0]}${nameParts[1]![0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const isV0 = useIsV0();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch real user data
  const { data: user } = api.user.getUserProfile.useQuery();

  // Logout mutation
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleProfileClick = () => {
    router.push("/perfil");
  };

  const handleSettingsClick = () => {
    router.push("/admin");
  };

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none">
        <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
          <MonkeyIcon className="size-10 group-hover:scale-[1.7] origin-top-left transition-transform" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-display">Paridade</span>
          <span className="text-xs uppercase">Risk Parity Dashboard</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group, i) => (
          <SidebarGroup
            className={cn(i === 0 && "rounded-t-none")}
            key={group.title}
          >
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Check if current pathname matches this item's URL
                  const isActive = pathname === item.url;

                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        item.locked && "pointer-events-none opacity-50",
                        isV0 && "pointer-events-none"
                      )}
                      data-disabled={item.locked}
                    >
                      <SidebarMenuButton
                        asChild={!item.locked}
                        isActive={isActive}
                        disabled={item.locked}
                        className={cn(
                          "disabled:cursor-not-allowed",
                          item.locked && "pointer-events-none"
                        )}
                      >
                        {item.locked ? (
                          <div className="flex items-center gap-3 w-full">
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <a href={item.url}>
                            <item.icon className="size-5" />
                            <span>{item.title}</span>
                          </a>
                        )}
                      </SidebarMenuButton>
                      {item.locked && (
                        <SidebarMenuBadge>
                          <LockIcon className="size-5 block" />
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            Usuário
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                      <Avatar className="h-14 w-14 rounded-lg">
                        <AvatarImage
                          src={user?.image ?? undefined}
                          alt={user?.name ?? "User"}
                          className="rounded-lg object-cover"
                        />
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg rounded-lg">
                          {getUserInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate text-xl font-display">
                          {user?.name ?? "Usuário"}
                        </span>
                        <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100">
                          {user?.email ?? "user@paridaderisco.com"}
                        </span>
                      </div>
                      <DotsVerticalIcon className="ml-auto size-4" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-56 p-0"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <div className="flex flex-col">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                      >
                        <MonkeyIcon className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent"
                      >
                        <GearIcon className="mr-2 h-4 w-4" />
                        Configurações
                      </button>
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="flex items-center px-4 py-2 text-sm hover:bg-accent text-destructive disabled:opacity-50"
                      >
                        <MonkeyIcon className="mr-2 h-4 w-4" />
                        {logoutMutation.isPending ? "Saindo..." : "Sair"}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
