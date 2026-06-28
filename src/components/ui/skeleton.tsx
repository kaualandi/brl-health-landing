import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type SkeletonRounded = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

type SkeletonProps = {
  /** Largura: número vira px; string vai direto (ex.: "100%"). */
  width?: number | string;
  /** Altura: número vira px; string vai direto. */
  height?: number | string;
  rounded?: SkeletonRounded;
  className?: string;
  style?: CSSProperties;
};

const ROUNDED: Record<SkeletonRounded, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

/**
 * Placeholder de carregamento. O shimmer (`animate-pulse`) é desligado quando o
 * usuário pede menos movimento (`prefers-reduced-motion`). Cor theme-aware.
 */
export function Skeleton({
  width,
  height,
  rounded = "md",
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-foreground/10 motion-reduce:animate-none",
        ROUNDED[rounded],
        className,
      )}
      style={{ width, height, ...style }}
    />
  );
}
