import { Link } from "@tanstack/react-router";
import { Flame, Star } from "lucide-react";

import type { MediaListItem } from "@/lib/anilist";
import { mediaKindLabel, pickTitle, translateStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: MediaListItem;
  className?: string;
  eager?: boolean;
}

export function MediaCard({ media, className, eager = false }: MediaCardProps) {
  const isAnime = media.type === "ANIME";
  const cover = media.coverImage?.extraLarge || media.coverImage?.large;

  return (
    <Link
      to={isAnime ? "/anime/$id" : "/manga/$id"}
      params={{ id: String(media.id) }}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-surface shadow-card transition-transform duration-200 active:scale-[0.97]",
        className,
      )}
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-surface-2">
        {cover ? (
          <img
            src={cover}
            alt={`Affiche de ${pickTitle(media.title)}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            Aucune image fournie
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/25 to-transparent opacity-90" />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-foreground/90 backdrop-blur">
            {mediaKindLabel(media)}
          </span>
        </div>

        {typeof media.averageScore === "number" && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold text-gold backdrop-blur">
            <Star className="size-3 fill-current" />
            {(media.averageScore / 10).toFixed(1)}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <h3 className="line-clamp-2 text-sm leading-tight font-semibold text-foreground">
            {pickTitle(media.title)}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{media.seasonYear ?? "—"}</span>
            <span aria-hidden>•</span>
            <span>{translateStatus(media.status)}</span>
            {typeof media.popularity === "number" && media.popularity > 50000 && (
              <Flame className="size-3 text-primary" aria-label="Très populaire" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MediaCardSkeleton() {
  return <div className="aspect-2/3 w-full animate-pulse rounded-xl bg-surface-2" />;
}
