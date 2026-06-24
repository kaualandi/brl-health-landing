import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <Loader2Icon
        aria-label="Carregando"
        className="size-7 animate-spin text-brl-purple"
      />
    </div>
  );
}
