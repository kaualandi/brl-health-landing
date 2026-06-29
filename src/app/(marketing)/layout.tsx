import type { ReactNode } from "react";

import { BackToTop } from "@/components/layout/back-to-top";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
