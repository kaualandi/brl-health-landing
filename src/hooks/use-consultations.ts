"use client";

import { useSyncExternalStore } from "react";

import {
  addConsultation,
  getConsultationsServerSnapshot,
  getConsultationsSnapshot,
  subscribeConsultations,
} from "@/lib/consultations-store";
import { cancelConsultation } from "@/services/consultations.service";

export function useConsultations() {
  const consultations = useSyncExternalStore(
    subscribeConsultations,
    getConsultationsSnapshot,
    getConsultationsServerSnapshot,
  );
  return {
    consultations,
    add: addConsultation,
    cancel: cancelConsultation,
  };
}
