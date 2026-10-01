"use client";

import { useSyncExternalStore } from "react";

import {
  getMenuServerSnapshot,
  getMenuSnapshot,
  subscribeMenu,
  swapMenuItem,
} from "@/lib/menu-store";

export function useMenu() {
  const overrides = useSyncExternalStore(
    subscribeMenu,
    getMenuSnapshot,
    getMenuServerSnapshot,
  );
  return { overrides, swap: swapMenuItem };
}
