"use client";

import { animate } from "animejs";
import { useCallback, useMemo } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useCardAnimation() {
  const reduced = useMemo(
    () => (typeof window === "undefined" ? false : prefersReducedMotion()),
    [],
  );

  const onMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduced) return;
      animate(event.currentTarget, {
        translateY: -6,
        duration: 300,
        ease: "outQuad",
      });
    },
    [reduced],
  );

  const onMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduced) return;
      animate(event.currentTarget, {
        translateY: 0,
        duration: 250,
        ease: "outQuad",
      });
    },
    [reduced],
  );

  return { onMouseEnter, onMouseLeave };
}
