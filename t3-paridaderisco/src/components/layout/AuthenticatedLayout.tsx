"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider } from "~/components/ui/sidebar";
import { DashboardSidebar } from "~/components/dashboard/sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only redirect if not on auth pages
      if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't show sidebar on auth pages
  if (!isAuthenticated || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      {/* Desktop Layout with Sidebar */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
        {/* Sidebar - 2 colunas no desktop */}
        <div className="hidden lg:block col-span-2 top-0 relative">
          <DashboardSidebar />
        </div>

        {/* Conteúdo Principal - 10 colunas no desktop */}
        <div className="col-span-1 lg:col-span-10">
          <div className="py-sides min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}