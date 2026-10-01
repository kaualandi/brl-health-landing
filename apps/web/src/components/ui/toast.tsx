"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms até sumir (0 = não some sozinho). */
  duration?: number;
};

type Toast = Required<Omit<ToastInput, "duration">> & { id: number };

const ToastContext = createContext<((input: ToastInput) => void) | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; icon: ReactNode }
> = {
  success: {
    border: "border-emerald-400/30",
    icon: <CheckCircle2Icon className="size-5 text-emerald-400" />,
  },
  error: {
    border: "border-destructive/40",
    icon: <AlertCircleIcon className="size-5 text-destructive" />,
  },
  info: {
    border: "border-brl-purple/40",
    icon: <InfoIcon className="size-5 text-brl-purple" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      const next: Toast = {
        id,
        title: input.title,
        description: input.description ?? "",
        variant: input.variant ?? "info",
      };
      setToasts((prev) => [...prev, next]);

      const duration = input.duration ?? 4500;
      if (duration > 0) {
        window.setTimeout(() => remove(id), duration);
      }
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((item) => {
          const styles = VARIANT_STYLES[item.variant];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-brl-card/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm",
                "animate-in fade-in slide-in-from-bottom-4 duration-300",
                styles.border,
              )}
            >
              <span aria-hidden className="mt-0.5 shrink-0">
                {styles.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Fechar notificação"
                className="-mt-1 -mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Dispara toasts de qualquer Client Component sob o ToastProvider. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  }
  return ctx;
}
