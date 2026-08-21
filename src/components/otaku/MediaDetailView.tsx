import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, Play, Star } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";


import { MediaRail } from "@/components/otaku/MediaRail";
import { ErrorState } from "@/components/otaku/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  LIST_STATUS_LABELS,
  trackMediaView,
  useFavorites,
  useMyRating,
  useRateMedia,
  useReadingList,
  useSetListStatus,
  useToggleFavorite,
  useWatchlist,
  type ListStatus,
} from "@/hooks/useLibrary";
import { getMediaById, type MediaType } from "@/lib/anilist";
import {
  altTitles,
  formatCount,
  formatFuzzyDate,
  pickTitle,
  stripMarkup,
  translateSeason,
  translateStatus,
} from "@/lib/format";

const STATUSES: ListStatus[] = ["planning", "current", "completed", "paused", "dropped"];

export function MediaDetailView({ id, type }: { id: number; type: MediaType }) {
  const kind = type === "ANIME" ? "anime" : "manga";
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["media", type, id],
    staleTime: 1000 * 60 * 10,
    queryFn: () => getMediaById(id, type),
  });

  const { data: favorites } = useFavorites(user?.id);
  const { data: watchlist } = useWatchlist(type === "ANIME" ? user?.id : null);
  const { data: readingList } = useReadingList(type === "MANGA" ? user?.id : null);
  const toggleFavorite = useToggleFavorite();
  const setStatus = useSetListStatus(kind);
  const rate = useRateMedia();
  const { data: myRating } = useMyRating(kind, id);
  const [pendingScore, setPendingScore] = useState<number | "">("");

  useEffect(() => {
    void trackMediaView(kind, id, user?.id ?? null);
  }, [kind, id, user?.id]);

  const media = query.data;
  const isFavorite = Boolean(favorites?.some((f) => f.media_type === kind && f.media_id === id));
  const currentStatus =
    type === "ANIME"
      ? (watchlist?.find((w) => w.anime_id === id)?.status ?? null)
      : (readingList?.find((r) => r.manga_id === id)?.status ?? null);

  if (query.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 md:px-6">
        <div className="h-48 rounded-2xl bg-surface-2" />
        <div className="mt-4 h-6 w-2/3 rounded bg-surface-2" />
        <div className="mt-2 h-24 rounded bg-surface-2" />
      </div>
    );
  }

  const title = pickTitle(media.title);
  const total = type === "ANIME" ? media.episodes : media.chapters;

  return (
    <article>
      <div className="relative h-40 w-full overflow-hidden sm:h-56 md:h-72">
        {media.bannerImage ? (
          <img src={media.bannerImage} alt="" className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="h-full w-full bg-surface-2" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto -mt-16 max-w-7xl px-4 md:px-6">
        <div className="flex gap-4">
          <img
            src={media.coverImage?.extraLarge || media.coverImage?.large || ""}
            alt={`Affiche de ${title}`}
            className="w-28 shrink-0 rounded-xl shadow-card sm:w-40"
          />
          <div className="min-w-0 pt-16">
            <h1 className="text-xl leading-tight font-extrabold sm:text-3xl">{title}</h1>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {altTitles(media.title, media.synonyms).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {media.averageScore != null && (
                <span className="inline-flex items-center gap-1 font-semibold text-accent">
                  <Star className="size-3.5" /> {media.averageScore}%
                </span>
              )}
              <span>{translateStatus(media.status)}</span>
              {media.seasonYear && (
                <span>
                  {translateSeason(media.season)} {media.seasonYear}
                </span>
              )}
              {total != null && <span>{total} {type === "ANIME" ? "épisodes" : "chapitres"}</span>}
              {media.favourites != null && <span>{formatCount(media.favourites)} favoris</span>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant={isFavorite ? "default" : "secondary"}
            className="min-h-11 gap-2"
            disabled={toggleFavorite.isPending}
            onClick={() =>
              toggleFavorite.mutate({
                media_type: kind,
                media_id: id,
                title,
                cover_image: media.coverImage?.large ?? null,
                isFavorite,
              })
            }
          >
            <Heart className={isFavorite ? "size-4 fill-current" : "size-4"} />
            {isFavorite ? "Dans mes favoris" : "Ajouter aux favoris"}
          </Button>

          <select
            aria-label="Statut dans ma liste"
            value={currentStatus ?? ""}
            onChange={(e) =>
              setStatus.mutate({
                media_id: id,
                status: (e.target.value || null) as ListStatus | null,
                title,
                cover_image: media.coverImage?.large ?? null,
                total,
              })
            }
            className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          >
            <option value="">Ajouter à ma liste…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {LIST_STATUS_LABELS[s][kind]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Ma note"
              value={pendingScore === "" ? (myRating ?? "") : pendingScore}
              onChange={(e) => setPendingScore(e.target.value ? Number(e.target.value) : "")}
              className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            >
              <option value="">Noter /10</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}/10
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              className="min-h-11"
              disabled={pendingScore === "" || rate.isPending}
              onClick={() =>
                pendingScore !== "" &&
                rate.mutate({ media_type: kind, media_id: id, score: Number(pendingScore) })
              }
            >
              Valider
            </Button>
          </div>
        </div>

        {!user && (
          <p className="mt-3 text-xs text-muted-foreground">
            Connectez-vous pour gérer vos favoris, vos listes et vos notes.
          </p>
        )}

        <section className="mt-6">
          <h2 className="text-base font-bold">Synopsis</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {stripMarkup(media.description) || "Aucun synopsis disponible pour cette œuvre."}
          </p>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <dl className="rounded-2xl border border-border bg-surface p-4 text-sm">
            <Info label="Format" value={media.format} />
            <Info label="Source" value={media.source} />
            <Info label="Début" value={formatFuzzyDate(media.startDate)} />
            <Info label="Fin" value={formatFuzzyDate(media.endDate)} />
            {type === "ANIME" && <Info label="Durée" value={media.duration ? `${media.duration} min` : null} />}
            {type === "MANGA" && <Info label="Volumes" value={media.volumes?.toString() ?? null} />}
            <Info
              label="Studios"
              value={media.studios.edges.filter((e) => e.isMain).map((e) => e.node.name).join(", ")}
            />
          </dl>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold">Genres & thèmes</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {media.genres.map((g) => (
                <span key={g} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px]">
                  {g}
                </span>
              ))}
              {media.tags.slice(0, 8).map((t) => (
                <span key={t.name} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {media.characters.edges.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-bold">Personnages</h2>
            <div className="hide-scrollbar-x mt-3 flex gap-3 pb-1">
              {media.characters.edges.slice(0, 20).map((e) => (
                <div key={e.node.id} className="w-24 shrink-0 text-center">
                  <img
                    src={e.node.image.large ?? ""}
                    alt={e.node.name.full}
                    loading="lazy"
                    className="aspect-2/3 w-full rounded-lg object-cover"
                  />
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium">{e.node.name.full}</p>
                  {e.voiceActors[0] && (
                    <p className="line-clamp-1 text-[10px] text-muted-foreground">
                      {e.voiceActors[0].name.full}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {media.relations.edges.length > 0 && (
          <MediaRail
            title="Œuvres liées"
            media={media.relations.edges.map((e) => e.node).filter(Boolean)}
          />
        )}

        <MediaRail
          title="Recommandations similaires"
          media={media.recommendations.nodes
            .map((n) => n.mediaRecommendation)
            .filter((m): m is NonNullable<typeof m> => Boolean(m))}
        />

        {media.siteUrl && (
          <p className="pb-6 text-xs text-muted-foreground">
            Source des métadonnées :{" "}
            <a href={media.siteUrl} target="_blank" rel="noreferrer" className="text-accent underline">
              AniList
            </a>
          </p>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
