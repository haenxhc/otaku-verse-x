import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { EmptyState } from "@/components/otaku/EmptyState";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/useCommunity";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — OtakuVerse X" }, { name: "robots", content: "noindex" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (data && data.some((n) => !n.is_read)) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Notifications</h1>
      {isLoading && <div className="mt-6 h-20 animate-pulse rounded-2xl bg-surface-2" />}
      {data?.length === 0 && (
        <div className="mt-6">
          <EmptyState title="Aucune notification" description="Vos alertes apparaîtront ici." />
        </div>
      )}
      <ul className="mt-6 space-y-2">
        {data?.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-3 text-sm ${
              n.is_read ? "border-border bg-surface" : "border-primary/40 bg-primary/5"
            }`}
          >
            <p className="font-semibold">{n.title}</p>
            {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
