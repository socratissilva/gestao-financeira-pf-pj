import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Sidebar from "@/components/Sidebar/Sidebar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão Financeira",
  description: "Sistema de Gestão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">

        <Providers>

          <div className="flex h-screen w-full overflow-hidden bg-slate-50">

            {/* Sidebar */}
            <aside className="h-full flex-shrink-0">
              <Sidebar />
            </aside>

            {/* Conteúdo */}
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>

          </div>

        </Providers>

      </body>
    </html>
  );
}