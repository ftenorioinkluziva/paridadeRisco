"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Home,
  Briefcase,
  TrendingUp,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  BarChart3,
  Calculator,
  MessageSquare,
} from "lucide-react";
import { api } from "~/lib/api";

const navigation = [
  { name: "Portfólio", href: "/portfolio", icon: Briefcase, requireAdmin: false },
  { name: "Gráficos", href: "/charts", icon: BarChart3, requireAdmin: false },
  { name: "Cestas", href: "/baskets", icon: ShoppingCart, requireAdmin: false },
  { name: "Fundos", href: "/funds", icon: TrendingUp, requireAdmin: false },
  { name: "Aposentadoria", href: "/retirement", icon: Calculator, requireAdmin: false },
  { name: "Chat", href: "/chat", icon: MessageSquare, requireAdmin: false },
  { name: "Admin", href: "/admin", icon: Settings, requireAdmin: true },
] as const;

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();
  const { data: user } = api.user.getUserProfile.useQuery();

  // Filter navigation items based on user role
  const visibleNavigation = navigation.filter((item) => {
    if (item.requireAdmin) {
      return user?.role === "ADMIN";
    }
    return true;
  });

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {visibleNavigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden md:block">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}