import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/providers/query-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

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

const TITLE = "BRL Health — do objetivo à conquista";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Sem `template`: as páginas internas já definem o título completo com sufixo.
  title: TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "nutrição",
    "plano alimentar",
    "dieta",
    "treino",
    "BRL Nutri",
    "BRL Fit",
    "calorias",
    "macros",
    "emagrecimento",
    "ganho de massa",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
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
