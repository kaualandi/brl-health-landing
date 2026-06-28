"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { LogOutIcon, MenuIcon, SaladIcon } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/#produtos", label: "Produtos" },
  { href: "/precos", label: "Planos" },
  { href: "/calculadora", label: "Calculadora" },
  { href: "/conteudos", label: "Conteúdos" },
  { href: "/receitas", label: "Receitas" },
  { href: "/fit", label: "BRL Fit" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

// Altura do header fixo, descontada no scroll suave pra a seção não ficar atrás.
const HEADER_OFFSET = 80;

// Ids das seções da home referenciadas por itens de nav âncora (ex.: /#produtos).
const anchorId = (href: string) => href.match(/^\/?#(.+)$/)?.[1] ?? null;
const ANCHOR_IDS = navItems
  .map((item) => anchorId(item.href))
  .filter((id): id is string => id !== null);

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="BRL Health — página inicial"
      className={cn(
        "font-display text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="text-brl-purple">BRL</span>
      <span className="text-foreground"> Health</span>
    </Link>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: só na home, marca a seção visível pra refletir no menu.
  useEffect(() => {
    if (!isHome || ANCHOR_IDS.length === 0) return;

    const sections = ANCHOR_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const tops = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            tops.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            tops.delete(entry.target.id);
          }
        }
        // A seção ativa é a que está mais ao topo entre as visíveis; nenhuma
        // visível (topo do hero, rodapé) limpa a marcação.
        if (tops.size === 0) {
          setActiveSection(null);
          return;
        }
        const topmost = [...tops.entries()].sort((a, b) => a[1] - b[1])[0][0];
        setActiveSection(topmost);
      },
      { rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`, threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [isHome]);

  const isLinkActive = (href: string) =>
    isHome && activeSection !== null && anchorId(href) === activeSection;

  // Scroll suave para âncoras da própria home; fora dela deixa o Link navegar.
  const handleAnchorClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!isHome) return;
    const id = anchorId(href);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;

    event.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    window.history.replaceState(null, "", href);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-200",
        scrolled
          ? "border-b border-foreground/5 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex lg:gap-8"
        >
          {navItems.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "true" : undefined}
                onClick={(event) => handleAnchorClick(event, item.href)}
                className={cn(
                  "rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "text-brl-purple"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="lg"
                nativeButton={false}
                render={<Link href="/login">Entrar</Link>}
              />
              <Button
                size="lg"
                nativeButton={false}
                className="bg-brl-purple text-white hover:bg-brl-purple/90"
                render={<Link href="/cadastro">Começar grátis</Link>}
              />
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menu"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="gap-0 p-6">
              <SheetHeader className="p-0 pb-6">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Navegação principal"
                className="flex flex-col gap-4"
              >
                {navItems.map((item) => {
                  const active = isLinkActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "true" : undefined}
                      onClick={(event) => {
                        handleAnchorClick(event, item.href);
                        setOpen(false);
                      }}
                      className={cn(
                        "rounded-md text-base font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "text-brl-purple"
                          : "text-foreground/90 hover:text-brl-purple",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Tema
                </span>
                <ThemeToggle />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {isAuthenticated && user ? (
                  <>
                    <div className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      nativeButton={false}
                      className="bg-brl-purple text-white hover:bg-brl-purple/90"
                      render={
                        <Link href="/nutri" onClick={() => setOpen(false)}>
                          <SaladIcon />
                          Meu Nutri
                        </Link>
                      }
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                    >
                      <LogOutIcon />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      nativeButton={false}
                      render={
                        <Link href="/login" onClick={() => setOpen(false)}>
                          Entrar
                        </Link>
                      }
                    />
                    <Button
                      size="lg"
                      nativeButton={false}
                      className="bg-brl-purple text-white hover:bg-brl-purple/90"
                      render={
                        <Link href="/cadastro" onClick={() => setOpen(false)}>
                          Começar grátis
                        </Link>
                      }
                    />
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
