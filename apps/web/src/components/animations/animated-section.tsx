"use client";

import { useRef, type ReactNode } from "react";

import {
  useScrollAnimation,
  type ScrollAnimationOptions,
} from "@/hooks/use-scroll-animation";

type AnimatedSectionProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul" | "section";
} & ScrollAnimationOptions;

export function AnimatedSection({
  children,
  className,
  as = "div",
  ...options
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  useScrollAnimation(ref, options);

  const Tag = as;

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLOListElement & HTMLUListElement>}
      className={className}
    >
      {children}
    </Tag>
  );
}
