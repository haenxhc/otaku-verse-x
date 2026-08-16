import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { MediaCard, MediaCardSkeleton } from "@/components/otaku/MediaCard";
import type { MediaListItem } from "@/lib/anilist";

interface MediaRailProps {
  title: string;
  subtitle?: string;
  media: MediaListItem[] | undefined;
  loading?: boolean;
  error?: Error | null;
  moreTo?: "/anime" | "/manga" | "/explore";
  emptyLabel?: string;
  action?: ReactNode;
}

export function MediaRail({
  title,
  subtitle,
  media,
  loading,
  error,
  moreTo,
  emptyLabel = "Aucun résultat pour le moment.",
  action,
}: MediaRailProps) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-6">
        <div>
          <h2 className="text-lg font-bold md:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
        {!action && moreTo && (
          <Link
            to={moreTo}
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-accent"
          >
            Tout voir <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>

      {error ? (
        <p className="px-4 text-sm text-destructive md:px-6">{error.message}</p>
      ) : (
        <div className="hide-scrollbar-x flex snap-x snap-mandatory gap-3 px-4 pb-1 md:px-6">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-32 shrink-0 snap-start sm:w-36 md:w-40">
                <MediaCardSkeleton />
              </div>
            ))}

          {!loading && (media?.length ?? 0) === 0 && (
            <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p>
          )}

          {!loading &&
            media?.map((m, i) => (
              <MediaCard
                key={`${m.id}-${i}`}
                media={m}
                eager={i < 4}
                className="w-32 shrink-0 snap-start sm:w-36 md:w-40"
              />
            ))}
        </div>
      )}
    </section>
  );
}
