import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";

import { ThemeWatcher } from "@/components/theme/theme-watcher";
import { ToastProvider } from "@/components/ui/toast";
import { QueryProvider } from "@/providers/query-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

import "./globals.css";

// Script bloqueante de primeiro paint: define a classe `dark` no <html> ANTES
// de qualquer pintura, lendo a escolha em localStorage (`brl.theme`) e caindo
// pro matchMedia / escuro quando ausente. Evita o flash de tema na carga.
const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('brl.theme');var d;if(c==='light')d=false;else if(c==='dark')d=true;else d=!window.matchMedia||window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

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
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <script
          id="brl-theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeWatcher />
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
