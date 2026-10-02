"use client";

import Link from "next/link";
import { SparklesIcon, XIcon } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/use-auth";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => (listeners.add(cb), () => void listeners.delete(cb));

/** Convite discreto pro Pro; o "dispensar" fica salvo por usuário e por lugar. */
export function ProInvite({ place, children }: { place: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const key = `brl.pro-invite.${user?.id}.${place}`;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) === "1",
    () => true,
  );
  if (!user || dismissed) return null;
  const dismiss = () => {
    window.localStorage.setItem(key, "1");
    listeners.forEach((cb) => cb());
  };
  return (
    <div role="note" className="relative mt-4 flex items-start gap-2 rounded-xl border border-brl-purple/25 bg-brl-purple/10 py-3 pr-9 pl-3 text-sm">
      <SparklesIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-brl-purple" />
      <p className="text-foreground/90">
        {children}{" "}
        <Link href="/precos" className="font-semibold text-foreground underline underline-offset-2">
          Conhecer
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
