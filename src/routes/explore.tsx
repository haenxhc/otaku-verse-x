import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MediaGrid } from "@/components/otaku/MediaGrid";
import { Button } from "@/components/ui/button";
import { ANIME_GENRES, browseMedia, currentSeason, type MediaType } from "@/lib/anilist";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explorer — OtakuVerse X" },
      {
        name: "description",
        content:
          "Explorez des milliers d'animes, mangas, manhwas et webtoons par genre, saison, format et statut.",
      },
      { property: "og:title", content: "Explorer animes et mangas — OtakuVerse X" },
      {
        property: "og:description",
        content: "Filtrez par genre, année, saison, format et statut pour trouver votre prochaine œuvre.",
      },
    ],
  }),
  component: ExplorePage,
});

const SORTS = [
  { value: "POPULARITY_DESC", label: "Popularité" },
  { value: "TRENDING_DESC", label: "Tendance" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "START_DATE_DESC", label: "Nouveautés" },
] as const;

const YEARS = Array.from({ length: 26 }, (_, i) => new Date().getFullYear() + 1 - i);

function ExplorePage() {
  const [type, setType] = useState<MediaType>("ANIME");
  const [genre, setGenre] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [season, setSeason] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("POPULARITY_DESC");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["explore", type, genre, year, season, status, sort, page],
    staleTime: 1000 * 60 * 5,
    queryFn: () =>
      browseMedia({
        type,
        page,
        perPage: 24,
        genre,
        seasonYear: year,
        season,
        status,
        sort: [sort],
      }),
  });

  const reset = () => {
    setGenre(null);
    setYear(null);
    setSeason(null);
    setStatus(null);
    setSort("POPULARITY_DESC");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Explorer</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Métadonnées fournies par AniList. {query.data?.pageInfo.total ?? 0} résultats.
      </p>

      <div className="mt-5 space-y-4">
        <div className="flex gap-2">
          {(["ANIME", "MANGA"] as MediaType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setPage(1);
                setSeason(null);
              }}
              className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-semibold transition-colors ${
                type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {t === "ANIME" ? "Anime" : "Manga / Webtoon"}
            </button>
          ))}
        </div>

        <div className="hide-scrollbar-x flex gap-2 pb-1">
          <button
            onClick={() => {
              setGenre(null);
              setPage(1);
            }}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
              genre === null ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface"
            }`}
          >
            Tous les genres
          </button>
          {ANIME_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => {
                setGenre(g);
                setPage(1);
              }}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
                genre === g ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            aria-label="Trier"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Année"
            value={year ?? ""}
            onChange={(e) => {
              setYear(e.target.value ? Number(e.target.value) : null);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          >
            <option value="">Toutes années</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {type === "ANIME" ? (
            <select
              aria-label="Saison"
              value={season ?? ""}
              onChange={(e) => {
                setSeason(e.target.value || null);
                setPage(1);
              }}
              className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            >
              <option value="">Toutes saisons</option>
              <option value="WINTER">Hiver</option>
              <option value="SPRING">Printemps</option>
              <option value="SUMMER">Été</option>
              <option value="FALL">Automne</option>
            </select>
          ) : (
            <div className="hidden sm:block" />
          )}

          <select
            aria-label="Statut"
            value={status ?? ""}
            onChange={(e) => {
              setStatus(e.target.value || null);
              setPage(1);
            }}
            className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          >
            <option value="">Tous statuts</option>
            <option value="RELEASING">En cours</option>
            <option value="FINISHED">Terminé</option>
            <option value="NOT_YET_RELEASED">À venir</option>
            <option value="HIATUS">En pause</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            Réinitialiser les filtres
          </Button>
          <span className="text-xs text-muted-foreground">
            Saison actuelle : {currentSeason().season.toLowerCase()} {currentSeason().year}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <MediaGrid
          media={query.data?.media}
          loading={query.isLoading}
          error={query.error as Error | null}
          onRetry={() => void query.refetch()}
        />
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          className="min-h-11"
          disabled={page <= 1 || query.isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {query.data?.pageInfo.currentPage ?? page}
        </span>
        <Button
          className="min-h-11"
          disabled={!query.data?.pageInfo.hasNextPage || query.isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
