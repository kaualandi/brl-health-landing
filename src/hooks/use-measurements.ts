"use client";

import { useSyncExternalStore } from "react";

import {
  getMeasurementsServerSnapshot,
  getMeasurementsSnapshot,
  recordMeasurements,
  subscribeMeasurements,
} from "@/lib/measurements-store";

export function useMeasurements() {
  const entries = useSyncExternalStore(
    subscribeMeasurements,
    getMeasurementsSnapshot,
    getMeasurementsServerSnapshot,
  );
  return { entries, record: recordMeasurements };
}
