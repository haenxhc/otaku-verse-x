import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ErrorState } from "@/components/otaku/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { stripMarkup } from "@/lib/format";

export const Route = createFileRoute("/news/$slug")({
  head: () => ({
    meta: [
      { title: "Article — Actualités otaku — OtakuVerse X" },
      { name: "description", content: "Lisez l'article complet et retrouvez ses sources sur OtakuVerse X." },
      { property: "og:title", content: "Article — Actualités otaku — OtakuVerse X" },
      { property: "og:description", content: "Lisez l'article complet et retrouvez ses sources sur OtakuVerse X." },
    ],
  }),
  component: NewsArticle,
});

function NewsArticle() {
  const { slug } = Route.useParams();
  const query = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (query.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse px-4 py-10">
        <div className="h-8 w-2/3 rounded bg-surface-2" />
        <div className="mt-4 h-40 rounded bg-surface-2" />
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Article introuvable</h1>
        <Link to="/news" className="mt-4 inline-block text-sm text-accent">
          Retour aux actualités
        </Link>
      </div>
    );
  }

  const a = query.data;

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <span className="text-[10px] font-bold tracking-wider text-accent uppercase">{a.category}</span>
      <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{a.title}</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(a.published_at).toLocaleDateString("fr-FR")} · {a.reading_minutes} min de lecture
      </p>
      {a.image_url && (
        <img src={a.image_url} alt="" className="mt-4 w-full rounded-2xl object-cover" />
      )}
      <p className="mt-5 text-base leading-relaxed font-medium">{stripMarkup(a.summary)}</p>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {(a.body ?? "").split("\n\n").map((p, i) => (
          <p key={i}>{stripMarkup(p)}</p>
        ))}
      </div>
      {a.source_url && (
        <p className="mt-6 text-xs text-muted-foreground">
          Source :{" "}
          <a href={a.source_url} target="_blank" rel="noreferrer" className="text-accent underline">
            {a.source_name ?? a.source_url}
          </a>
        </p>
      )}
      <Link to="/news" className="mt-8 inline-block text-sm text-accent">
        ← Toutes les actualités
      </Link>
    </article>
  );
}
