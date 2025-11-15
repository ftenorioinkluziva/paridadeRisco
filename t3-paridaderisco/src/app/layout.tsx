import "~/app/globals.css";

import { GeistSans } from "geist/font/sans";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { Metadata } from "next";
import { Providers } from "~/components/providers";
import { Header } from "~/components/layout/Header";
import { Toaster } from "~/components/ui/toaster";

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
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} min-h-screen bg-background font-sans antialiased`}>
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