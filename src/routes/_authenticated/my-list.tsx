import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { EmptyState } from "@/components/otaku/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import {
  LIST_STATUS_LABELS,
  useReadingList,
  useSetListStatus,
  useWatchlist,
  type ListStatus,
} from "@/hooks/useLibrary";

export const Route = createFileRoute("/_authenticated/my-list")({
  head: () => ({ meta: [{ title: "Ma liste — OtakuVerse X" }, { name: "robots", content: "noindex" }] }),
  component: MyListPage,
});

const STATUSES: ListStatus[] = ["current", "planning", "completed", "paused", "dropped"];

function MyListPage() {
  const { user } = useAuth();
  const [kind, setKind] = useState<"anime" | "manga">("anime");
  const watchlist = useWatchlist(kind === "anime" ? user?.id : null);
  const readingList = useReadingList(kind === "manga" ? user?.id : null);
  const setStatus = useSetListStatus(kind);

  const rows =
    kind === "anime"
      ? (watchlist.data ?? []).map((w) => ({
          id: w.anime_id,
          title: w.title,
          cover: w.cover_image,
          status: w.status,
          total: w.total_episodes,
        }))
      : (readingList.data ?? []).map((r) => ({
          id: r.manga_id,
          title: r.title,
          cover: r.cover_image,
          status: r.status,
          total: r.total_chapters,
        }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Ma liste</h1>

      <div className="mt-4 flex gap-2">
        {(["anime", "manga"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold ${
              kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"
            }`}
          >
            {k === "anime" ? "Animes" : "Mangas"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {rows.length === 0 && (
          <EmptyState
            title="Votre liste est vide"
            description="Ajoutez des œuvres depuis leur fiche pour suivre votre progression."
            action={
              <Link to="/explore" className="text-sm font-semibold text-accent">
                Explorer le catalogue →
              </Link>
            }
          />
        )}
        {STATUSES.map((s) => {
          const group = rows.filter((r) => r.status === s);
          if (group.length === 0) return null;
          return (
            <section key={s}>
              <h2 className="text-sm font-bold text-accent">{LIST_STATUS_LABELS[s][kind]}</h2>
              <ul className="mt-2 space-y-2">
                {group.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <img src={r.cover ?? ""} alt="" className="h-16 w-11 rounded-lg object-cover" />
                    <Link
                      to={kind === "anime" ? "/anime/$id" : "/manga/$id"}
                      params={{ id: String(r.id) }}
                      className="min-w-0 flex-1 text-sm font-semibold hover:text-accent"
                    >
                      {r.title ?? `#${r.id}`}
                    </Link>
                    <select
                      aria-label="Changer le statut"
                      value={r.status}
                      onChange={(e) =>
                        setStatus.mutate({
                          media_id: r.id,
                          status: (e.target.value || null) as ListStatus | null,
                          title: r.title,
                          cover_image: r.cover,
                          total: r.total,
                        })
                      }
                      className="min-h-10 rounded-lg border border-border bg-surface-2 px-2 text-xs"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>{LIST_STATUS_LABELS[st][kind]}</option>
                      ))}
                      <option value="">Retirer</option>
                    </select>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
