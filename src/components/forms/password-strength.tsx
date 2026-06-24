"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Pontua a senha sem obrigar nada — quanto mais variedade e tamanho, maior o
 * nível. É só incentivo lúdico; a regra de verdade (mín. 6) fica no schema.
 */
export function scorePassword(password: string): StrengthLevel {
  if (!password) return 0;

  let raw = 0;
  if (password.length >= 6) raw++;
  if (password.length >= 10) raw++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) raw++;
  if (/\d/.test(password)) raw++;
  if (/[^A-Za-z0-9]/.test(password)) raw++;

  if (raw <= 1) return 1;
  if (raw === 2) return 2;
  if (raw === 3) return 3;
  return 4;
}

const LEVELS = [
  null,
  {
    label: "Fraca",
    message: "Tá magrinha essa senha. Bora puxar mais. 🐣",
    bar: "bg-destructive",
    text: "text-destructive",
  },
  {
    label: "Na média",
    message: "Tá aquecendo... não para agora. 🔥",
    bar: "bg-brl-orange",
    text: "text-brl-orange",
  },
  {
    label: "Forte",
    message: "Isso! Já levanta um bom peso. 💪",
    bar: "bg-brl-purple",
    text: "text-brl-purple",
  },
  {
    label: "Monstra",
    message: "Tão forte quanto você. 🏆",
    bar: "bg-emerald-400",
    text: "text-emerald-400",
  },
] as const;

export function PasswordStrength({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const level = useMemo(() => scorePassword(value), [value]);
  if (level === 0) return null;

  const info = LEVELS[level]!;

  return (
    <div className={cn("mt-2.5", className)}>
      <div className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              segment <= level ? info.bar : "bg-white/10",
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="mt-1.5 text-xs font-medium">
        <span className={info.text}>{info.label}.</span>{" "}
        <span className="text-muted-foreground">{info.message}</span>
      </p>
    </div>
  );
}
