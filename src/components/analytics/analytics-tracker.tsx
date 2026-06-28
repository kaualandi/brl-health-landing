"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { pageView } from "@/services/analytics.service";

/**
 * Dispara um `pageView` (mock) a cada mudança de rota. Não renderiza nada —
 * é só um observador do `pathname`.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void pageView(pathname);
  }, [pathname]);

  return null;
}
