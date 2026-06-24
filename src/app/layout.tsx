import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BRL Health — do objetivo à conquista",
  description:
    "Ecossistema BRL: treinos adaptativos com o BRL Fit e nutrição contextualizada ao treino com o BRL Nutri. Comece grátis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${syne.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
