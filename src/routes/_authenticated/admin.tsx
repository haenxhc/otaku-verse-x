import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/otaku/EmptyState";
import { useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administration — OtakuVerse X" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsAdmin();

  const stats = useQuery({
    queryKey: ["admin", "stats"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const [profiles, posts, views, reports] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("media_views").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      return {
        profiles: profiles.count ?? 0,
        posts: posts.count ?? 0,
        views: views.count ?? 0,
        reports: reports.data ?? [],
      };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="h-32 animate-pulse rounded-2xl bg-surface-2" /></div>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Accès réservé" description="Cette section est réservée aux administrateurs." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Administration</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Membres", value: stats.data?.profiles },
          { label: "Publications", value: stats.data?.posts },
          { label: "Vues fiches", value: stats.data?.views },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-extrabold">{s.value ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-base font-bold">Signalements récents</h2>
      <ul className="mt-3 space-y-2">
        {stats.data?.reports.length === 0 && (
          <li className="text-sm text-muted-foreground">Aucun signalement.</li>
        )}
        {stats.data?.reports.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
            <p className="font-semibold">
              {r.target_type} · {r.status}
            </p>
            <p className="text-xs text-muted-foreground">{r.reason}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
