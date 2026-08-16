import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/otaku/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts, useIsFollowing, useToggleFollow, usePosts } from "@/hooks/useCommunity";
import { useFavorites } from "@/hooks/useLibrary";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";
import { levelFromXp, levelProgress } from "@/lib/gamification";

export const Route = createFileRoute("/profile/$username")({
  head: () => ({
    meta: [
      { title: "Profil otaku — OtakuVerse X" },
      { name: "description", content: "Profil public : niveau, XP, favoris, abonnés et publications." },
      { property: "og:title", content: "Profil otaku — OtakuVerse X" },
      { property: "og:description", content: "Profil public : niveau, XP, favoris, abonnés et publications." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["profile", "by-username", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const targetId = profile.data?.id ?? null;
  const counts = useFollowCounts(targetId);
  const isFollowing = useIsFollowing(targetId);
  const toggleFollow = useToggleFollow();
  const favorites = useFavorites(targetId);
  const posts = usePosts(targetId ? { userId: targetId } : {});

  if (profile.isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><div className="h-40 animate-pulse rounded-2xl bg-surface-2" /></div>;
  }

  if (!profile.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Profil introuvable" description={`Aucun otaku nommé « ${username} ».`} />
      </div>
    );
  }

  const p = profile.data;
  const lvl = levelFromXp(p.xp);
  const isMe = user?.id === p.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-28 bg-surface-2">
          {p.banner_url && <img src={p.banner_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="p-4">
          <div className="-mt-12 flex items-end gap-3">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="size-20 rounded-2xl border-2 border-background object-cover" />
            ) : (
              <div className="size-20 rounded-2xl border-2 border-background bg-surface-2" />
            )}
            <div className="flex-1 pb-1">
              <h1 className="text-lg font-extrabold">{p.display_name ?? p.username}</h1>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
            </div>
            {!isMe && user && (
              <Button
                className="min-h-11"
                variant={isFollowing.data ? "secondary" : "default"}
                onClick={() =>
                  targetId && toggleFollow.mutate({ targetId, following: Boolean(isFollowing.data) })
                }
              >
                {isFollowing.data ? "Abonné" : "S'abonner"}
              </Button>
            )}
            {isMe && (
              <Button asChild variant="secondary" className="min-h-11">
                <Link to="/settings">Modifier</Link>
              </Button>
            )}
          </div>

          {p.bio && <p className="mt-3 text-sm text-muted-foreground">{p.bio}</p>}

          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{counts.data?.followers ?? 0}</strong> abonnés</span>
            <span><strong className="text-foreground">{counts.data?.following ?? 0}</strong> abonnements</span>
            <span><strong className="text-foreground">{favorites.data?.length ?? 0}</strong> favoris</span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="font-semibold">{lvl.name}</span>
              <span className="text-muted-foreground">{p.xp} XP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-primary" style={{ width: `${levelProgress(p.xp)}%` }} />
            </div>
          </div>

          {p.favorite_genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.favorite_genres.map((g) => (
                <span key={g} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px]">{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-base font-bold">Publications</h2>
      <div className="mt-3 space-y-3">
        {posts.data?.length === 0 && <EmptyState title="Aucune publication" />}
        {posts.data?.map((post) => (
          <article key={post.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm whitespace-pre-line">{post.content}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{timeAgo(post.created_at)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
