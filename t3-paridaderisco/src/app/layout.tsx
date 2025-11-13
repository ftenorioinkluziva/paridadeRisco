import "~/app/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Providers } from "~/components/providers";
import { Header } from "~/components/layout/Header";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "ParidadeRisco",
  description: "Financial risk parity dashboard",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              {children}
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}