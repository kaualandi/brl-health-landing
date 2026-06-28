import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-32 md:px-6">
      <p role="status" className="sr-only">
        Carregando conteúdo…
      </p>
      <div className="flex flex-col items-center gap-4 text-center">
        <Skeleton width={150} height={28} rounded="full" />
        <Skeleton width="100%" height={48} rounded="lg" className="max-w-2xl" />
        <Skeleton width="80%" height={20} rounded="md" className="max-w-md" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={200} rounded="2xl" />
        ))}
      </div>
    </div>
  );
}
