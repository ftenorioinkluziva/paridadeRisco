"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import DotsVerticalIcon from "~/components/icons/dots-vertical";
import { User, Settings, LogOut } from "lucide-react";
import { api } from "~/lib/api";
import { useRouter } from "next/navigation";

export function UserAdmin() {
  const router = useRouter();

  // Fetch user data
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

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0]![0]}${nameParts[1]![0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header with label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          USER
        </span>
      </div>

      {/* User info section */}
      <div className="flex items-center justify-between gap-3">
        {/* Avatar and info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {getUserInitials(user?.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm uppercase tracking-wide truncate">
              {user?.name ?? "USUÁRIO"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email ?? "user@paridaderisco.com"}
            </p>
          </div>
        </div>

        {/* Options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <DotsVerticalIcon className="h-5 w-5" />
              <span className="sr-only">Menu de opções</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{logoutMutation.isPending ? "Saindo..." : "Sair"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
