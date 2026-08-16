import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MediaGrid } from "@/components/otaku/MediaGrid";
import { Button } from "@/components/ui/button";
import { ANIME_GENRES, browseMedia } from "@/lib/anilist";

export const Route = createFileRoute("/manga/")({
  head: () => ({
    meta: [
      { title: "Manga, Manhwa & Webtoons — OtakuVerse X" },
      { name: "description", content: "Catalogue de mangas, manhwas et manhuas, filtrable par genre et origine." },
      { property: "og:title", content: "Manga, Manhwa & Webtoons — OtakuVerse X" },
      { property: "og:description", content: "Catalogue de mangas, manhwas et manhuas, filtrable par genre et origine." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState("POPULARITY_DESC");
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["browse", "MANGA", genre, sort, page, country],
    staleTime: 1000 * 60 * 5,
    queryFn: () =>
      browseMedia({
        type: "MANGA",
        page,
        perPage: 24,
        genre,
        sort: [sort],
        countryOfOrigin: country,
      }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Manga, Manhwa & Webtoons</h1>
      <p className="mt-1 text-sm text-muted-foreground">Catalogue de mangas, manhwas et manhuas, filtrable par genre et origine.</p>

      <div className="hide-scrollbar-x mt-4 flex gap-2 pb-1">
        <button
          onClick={() => {
            setGenre(null);
            setPage(1);
          }}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold ${
            genre === null ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface"
          }`}
        >
          Tous
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

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          aria-label="Trier"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="POPULARITY_DESC">Popularité</option>
          <option value="TRENDING_DESC">Tendance</option>
          <option value="SCORE_DESC">Score</option>
          <option value="START_DATE_DESC">Nouveautés</option>
        </select>
        <select
          aria-label="Origine"
          value={country ?? ""}
          onChange={(e) => {
            setCountry(e.target.value || null);
            setPage(1);
          }}
          className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm"
        >
          <option value="">Toutes origines</option>
          <option value="JP">Manga (Japon)</option>
          <option value="KR">Manhwa (Corée)</option>
          <option value="CN">Manhua (Chine)</option>
        </select>
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
        <span className="text-sm text-muted-foreground">Page {page}</span>
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
