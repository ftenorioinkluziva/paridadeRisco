"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink, httpLink } from "@trpc/client";
import superjson from "superjson";
import { useState, useEffect } from "react";
import { api } from "~/lib/api";

function getAuthHeaders() {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    : null;
  
  return token ? {
    authorization: `Bearer ${token}`,
  } : {};
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpLink({
          url: "/api/trpc",
          headers: getAuthHeaders,
        }),
      ],
      transformer: superjson,
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </api.Provider>
  );
}