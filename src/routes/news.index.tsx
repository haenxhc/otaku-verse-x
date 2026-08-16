import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState, ErrorState } from "@/components/otaku/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkup } from "@/lib/format";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "Actualités anime & manga — OtakuVerse X" },
      { name: "description", content: "Annonces d'adaptations, sorties, interviews et culture otaku, mises à jour régulièrement." },
      { property: "og:title", content: "Actualités anime & manga — OtakuVerse X" },
      { property: "og:description", content: "Annonces d'adaptations, sorties, interviews et culture otaku, mises à jour régulièrement." },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const query = useQuery({
    queryKey: ["news", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("slug, title, summary, category, published_at, reading_minutes, image_url, source_name")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Actualités otaku</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Annonces, sorties et culture japonaise — rédigé par la rédaction OtakuVerse X.
      </p>

      <div className="mt-6 space-y-3">
        {query.error && (
          <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
        )}
        {query.isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        {query.data?.length === 0 && (
          <EmptyState title="Aucun article" description="Les premières actualités arrivent bientôt." />
        )}
        {query.data?.map((a) => (
          <Link
            key={a.slug}
            to="/news/$slug"
            params={{ slug: a.slug }}
            className="block rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
          >
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
              {a.category}
            </span>
            <h2 className="mt-1 text-base font-semibold">{a.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{stripMarkup(a.summary)}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {new Date(a.published_at).toLocaleDateString("fr-FR")} · {a.reading_minutes} min
              {a.source_name ? ` · source : ${a.source_name}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
