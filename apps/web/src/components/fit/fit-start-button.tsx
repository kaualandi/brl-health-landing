"use client";

import Link from "next/link";
import { PlayIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { loadActive } from "@/services/fit-sessions.service";

/** Começa o treino `day` do plano (ou continua o que está em andamento salvo). */
export function StartWorkoutButton({ day }: { day: number }) {
  const { user } = useAuth();
  const [resume] = useState(() => !!user && !!loadActive(user.id));
  return (
    <Button render={<Link href={`/fit/app/treino?dia=${day}`} />} nativeButton={false} className="mt-5 h-12 w-full">
      <PlayIcon aria-hidden /> {resume ? "Continuar treino" : "Começar treino"}
    </Button>
  );
}
