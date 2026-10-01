"use client";

import { animate } from "animejs";
import { useCallback, useMemo } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useButtonAnimation() {
  const reduced = useMemo(
    () => (typeof window === "undefined" ? false : prefersReducedMotion()),
    [],
  );

  const tween = useCallback(
    (target: HTMLElement, scale: number, duration: number) => {
      if (reduced) return;
      animate(target, {
        scale,
        duration,
        ease: "outQuad",
      });
    },
    [reduced],
  );

  return {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) =>
      tween(event.currentTarget, 1.04, 200),
    onMouseLeave: (event: React.MouseEvent<HTMLElement>) =>
      tween(event.currentTarget, 1, 200),
    onMouseDown: (event: React.MouseEvent<HTMLElement>) =>
      tween(event.currentTarget, 0.97, 100),
    onMouseUp: (event: React.MouseEvent<HTMLElement>) =>
      tween(event.currentTarget, 1.04, 100),
  };
}
