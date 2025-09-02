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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Portfolio", href: "/portfolio", icon: Briefcase },
  { name: "Baskets", href: "/baskets", icon: ShoppingCart },
  { name: "Admin", href: "/admin", icon: Settings },
] as const;

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {navigation.map((item) => {
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