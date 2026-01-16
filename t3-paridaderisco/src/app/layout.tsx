import "~/app/globals.css";

import { GeistSans } from "geist/font/sans";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { Providers } from "~/components/providers";
import { Toaster } from "~/components/ui/toaster";
import { AuthenticatedLayout } from "~/components/layout/AuthenticatedLayout";
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
            <AuthenticatedLayout>
              {children}
            </AuthenticatedLayout>
            <Toaster />
          </V0Provider>
        </Providers>
      </body>
    </html>
  );
}