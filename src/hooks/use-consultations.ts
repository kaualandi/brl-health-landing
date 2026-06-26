"use client";

import { useSyncExternalStore } from "react";

import {
  addConsultation,
  getConsultationsServerSnapshot,
  getConsultationsSnapshot,
  removeConsultation,
  subscribeConsultations,
} from "@/lib/consultations-store";

export function useConsultations() {
  const consultations = useSyncExternalStore(
    subscribeConsultations,
    getConsultationsSnapshot,
    getConsultationsServerSnapshot,
  );
  return {
    consultations,
    add: addConsultation,
    cancel: removeConsultation,
  };
}
