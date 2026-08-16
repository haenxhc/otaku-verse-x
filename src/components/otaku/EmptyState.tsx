import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-6 text-center">
      <p className="text-sm font-medium text-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
