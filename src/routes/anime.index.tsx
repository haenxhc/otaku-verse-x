import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MediaGrid } from "@/components/otaku/MediaGrid";
import { Button } from "@/components/ui/button";
import { ANIME_GENRES, browseMedia } from "@/lib/anilist";

export const Route = createFileRoute("/anime/")({
  head: () => ({
    meta: [
      { title: "Animes — OtakuVerse X" },
      { name: "description", content: "Catalogue complet des animes : genres, popularité, scores et nouveautés." },
      { property: "og:title", content: "Animes — OtakuVerse X" },
      { property: "og:description", content: "Catalogue complet des animes : genres, popularité, scores et nouveautés." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [genre, setGenre] = useState<string | null>(null);
  const [sort, setSort] = useState("POPULARITY_DESC");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["browse", "ANIME", genre, sort, page],
    staleTime: 1000 * 60 * 5,
    queryFn: () =>
      browseMedia({
        type: "ANIME",
        page,
        perPage: 24,
        genre,
        sort: [sort],
      }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Animes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Catalogue complet des animes : genres, popularité, scores et nouveautés.</p>

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
