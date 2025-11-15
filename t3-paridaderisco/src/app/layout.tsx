import "~/app/globals.css";

import { GeistSans } from "geist/font/sans";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { Providers } from "~/components/providers";
import { Toaster } from "~/components/ui/toaster";
import { SidebarProvider } from "~/components/ui/sidebar";
import { DashboardSidebar } from "~/components/dashboard/sidebar";
import { V0Provider } from "~/lib/v0-context";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const rebelGrotesk = localFont({
  src: "../../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
});

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
  const isV0 = process.env.VERCEL_URL?.includes("vusercontent.net") ?? false;

  return (
    <html lang="pt-BR" className={`${GeistSans.variable} dark`}>
      <head>
        <link
          rel="preload"
          href="/fonts/Rebels-Fett.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`}>
        <Providers>
          <V0Provider isV0={isV0}>
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

              <Toaster />
            </SidebarProvider>
          </V0Provider>
        </Providers>
      </body>
    </html>
  );
}