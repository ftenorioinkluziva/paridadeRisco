"use client";

import { Button } from "~/components/ui/button";
import { User, LogOut } from "lucide-react";

export function UserNav() {
  // TODO: Replace with actual auth session
  const user = { name: "User", email: "user@example.com" };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log("Logout clicked");
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="hidden md:flex items-center space-x-2 text-sm">
        <User className="h-4 w-4" />
        <span>{user.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1 hidden md:block">Sair</span>
      </Button>
    </div>
  );
}