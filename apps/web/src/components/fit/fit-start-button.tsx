"use client";

import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { loadActive } from "@/services/fit-sessions.service";

/** Começa (ou continua, se há treino em andamento salvo) a execução do treino de hoje. */
export function StartWorkoutButton() {
  const { user } = useAuth();
  const [resume] = useState(() => !!user && !!loadActive(user.id));
  return (
    <Button render={<Link href="/fit/app/treino" />} nativeButton={false} className="mt-5 h-12 w-full">
      <PlayIcon aria-hidden /> {resume ? "Continuar treino" : "Começar treino"}
    </Button>
  );
}
