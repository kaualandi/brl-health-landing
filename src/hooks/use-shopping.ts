"use client";

import { useSyncExternalStore } from "react";

import {
  clearShopping,
  getShoppingServerSnapshot,
  getShoppingSnapshot,
  subscribeShopping,
  toggleShoppingItem,
} from "@/lib/shopping-store";

export function useShopping() {
  const checked = useSyncExternalStore(
    subscribeShopping,
    getShoppingSnapshot,
    getShoppingServerSnapshot,
  );
  return {
    checked,
    toggle: toggleShoppingItem,
    clear: clearShopping,
  };
}
