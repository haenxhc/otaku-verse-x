import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { MediaGrid } from "@/components/otaku/MediaGrid";
import { EmptyState } from "@/components/otaku/EmptyState";
import { searchEverything } from "@/lib/anilist";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Recherche — OtakuVerse X" },
      { name: "description", content: "Recherchez parmi des milliers d'animes, mangas, webtoons et personnages." },
      { property: "og:title", content: "Recherche — OtakuVerse X" },
      { property: "og:description", content: "Recherchez parmi des milliers d'animes, mangas, webtoons et personnages." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const term = q.trim();

  const query = useQuery({
    queryKey: ["search", term],
    enabled: term.length >= 2,
    staleTime: 1000 * 60 * 2,
    queryFn: () => searchEverything(term),
  });

  if (term.length < 2) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Recherchez un anime, un manga ou un personnage"
          description="Saisissez au moins 2 caractères dans la barre de recherche."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-extrabold md:text-2xl">Résultats pour « {term} »</h1>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold">Animes</h2>
        <MediaGrid
          media={query.data?.anime}
          loading={query.isLoading}
          error={query.error as Error | null}
          emptyTitle="Aucun anime trouvé"
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold">Mangas & webtoons</h2>
        <MediaGrid
          media={query.data?.manga}
          loading={query.isLoading}
          error={query.error as Error | null}
          emptyTitle="Aucun manga trouvé"
        />
      </section>

      {(query.data?.characters.length ?? 0) > 0 && (
        <section className="mt-8 pb-4">
          <h2 className="mb-3 text-base font-bold">Personnages</h2>
          <div className="hide-scrollbar-x flex gap-3 pb-1">
            {query.data?.characters.map((c) => (
              <div key={c.id} className="w-24 shrink-0 text-center">
                <img
                  src={c.image.large ?? ""}
                  alt={c.name.full}
                  loading="lazy"
                  className="aspect-2/3 w-full rounded-lg object-cover"
                />
                <p className="mt-1 line-clamp-2 text-[11px] font-medium">{c.name.full}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link to="/explore" className="mt-6 inline-block text-sm text-accent">
        Affiner avec les filtres avancés →
      </Link>
    </div>
  );
}
