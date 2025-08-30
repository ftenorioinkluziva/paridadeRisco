"use client";

import { MainNav } from "./MainNav";
import { UserNav } from "./UserNav";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-xl">
            <span className="text-primary">Paridade</span>
            <span className="text-foreground">Risco</span>
          </div>
          <MainNav className="ml-6" />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  );
}