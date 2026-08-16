import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { ErrorState, EmptyState } from "@/components/otaku/EmptyState";
import { getAiringSchedule } from "@/lib/anilist";
import { formatAiringCountdown, pickTitle } from "@/lib/format";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendrier des sorties anime — OtakuVerse X" },
      { name: "description", content: "Suivez jour par jour les épisodes d'anime diffusés, avec compte à rebours et heure locale." },
      { property: "og:title", content: "Calendrier des sorties anime — OtakuVerse X" },
      { property: "og:description", content: "Suivez jour par jour les épisodes d'anime diffusés, avec compte à rebours et heure locale." },
    ],
  }),
  component: CalendarPage,
});

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function startOfDay(offset: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return Math.floor(d.getTime() / 1000);
}

function CalendarPage() {
  const [offset, setOffset] = useState(0);
  const start = startOfDay(offset);
  const end = startOfDay(offset + 1);

  const query = useQuery({
    queryKey: ["calendar", start],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getAiringSchedule(start, end),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Calendrier de diffusion</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Épisodes diffusés jour par jour, heure locale de votre appareil.
      </p>

      <div className="hide-scrollbar-x mt-5 flex gap-2 pb-1">
        {Array.from({ length: 8 }, (_, i) => i).map((i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const active = offset === i;
          return (
            <button
              key={i}
              onClick={() => setOffset(i)}
              className={`min-h-16 min-w-16 shrink-0 rounded-xl border px-3 text-center text-xs font-semibold ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"
              }`}
            >
              <span className="block">{i === 0 ? "Auj." : DAYS[d.getDay()]}</span>
              <span className="block text-lg">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {query.error && (
          <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        )}
        {query.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        )}
        {query.data && query.data.airingSchedules.length === 0 && (
          <EmptyState title="Aucune diffusion prévue" description="Essayez un autre jour." />
        )}
        <ul className="space-y-2">
          {query.data?.airingSchedules.map((entry) => (
            <li key={entry.id}>
              <Link
                to="/anime/$id"
                params={{ id: String(entry.media.id) }}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/50"
              >
                <img
                  src={entry.media.coverImage?.large ?? ""}
                  alt=""
                  loading="lazy"
                  className="h-20 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{pickTitle(entry.media.title)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Épisode {entry.episode} ·{" "}
                    {new Date(entry.airingAt * 1000).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] text-accent">{formatAiringCountdown(entry.airingAt)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
