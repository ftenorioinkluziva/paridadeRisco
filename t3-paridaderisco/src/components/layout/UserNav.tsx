"use client";

import { Button } from "~/components/ui/button";
import { User, LogOut } from "lucide-react";
import { api } from "~/lib/api";
import { useRouter } from "next/navigation";

export function UserNav() {
  const router = useRouter();

  // Fetch real user data
  const { data: user } = api.user.getUserProfile.useQuery();

  // Logout mutation
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess: () => {
      // Clear localStorage tokens and user data
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      
      // Clear any cookies
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Redirect to home page and reload to clear all state
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if server logout fails, still clear client-side tokens
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:flex items-center space-x-2 text-sm">
        <User className="h-4 w-4" />
        <span>{user?.name || "Usuário"}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1 hidden md:block">
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </span>
      </Button>
    </div>
  );
}