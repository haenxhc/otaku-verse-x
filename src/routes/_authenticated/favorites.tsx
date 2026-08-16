import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/otaku/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites, useToggleFavorite } from "@/hooks/useLibrary";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favoris — OtakuVerse X" }, { name: "robots", content: "noindex" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useFavorites(user?.id);
  const toggle = useToggleFavorite();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Mes favoris</h1>

      {isLoading && <div className="mt-6 h-24 animate-pulse rounded-2xl bg-surface-2" />}
      {data?.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Aucun favori"
            description="Touchez le cœur sur une fiche pour l'ajouter ici."
            action={<Link to="/explore" className="text-sm font-semibold text-accent">Explorer →</Link>}
          />
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {data?.map((f) => (
          <li key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <img src={f.cover_image ?? ""} alt="" className="h-16 w-11 rounded-lg object-cover" />
            <Link
              to={f.media_type === "anime" ? "/anime/$id" : "/manga/$id"}
              params={{ id: String(f.media_id) }}
              className="min-w-0 flex-1 text-sm font-semibold hover:text-accent"
            >
              {f.title ?? `#${f.media_id}`}
            </Link>
            <button
              className="min-h-10 rounded-lg border border-border px-3 text-xs"
              onClick={() =>
                toggle.mutate({
                  media_type: f.media_type,
                  media_id: f.media_id,
                  isFavorite: true,
                })
              }
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
