import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Flag } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/otaku/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreatePost,
  useMyLikes,
  usePosts,
  useReportContent,
  useToggleLike,
} from "@/hooks/useCommunity";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Communauté otaku — OtakuVerse X" },
      { name: "description", content: "Feed communautaire : publications, likes, commentaires et abonnements entre passionnés." },
      { property: "og:title", content: "Communauté otaku — OtakuVerse X" },
      { property: "og:description", content: "Feed communautaire : publications, likes, commentaires et abonnements entre passionnés." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const posts = usePosts({ page });
  const { data: likes } = useMyLikes();
  const createPost = useCreatePost();
  const toggleLike = useToggleLike();
  const report = useReportContent();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Communauté</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Partagez vos avis, débattez et suivez d&apos;autres otakus. Respectez la charte : aucun lien
        de streaming ou de scan illégal.
      </p>

      {user ? (
        <form
          className="mt-5 rounded-2xl border border-border bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim().length < 2) return;
            createPost.mutate(
              { content: content.trim() },
              { onSuccess: () => setContent("") },
            );
          }}
        >
          <label htmlFor="post" className="text-sm font-semibold">
            Publier un message
          </label>
          <textarea
            id="post"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={3}
            required
            placeholder="Votre avis sur le dernier épisode…"
            className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-2 p-3 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{content.length}/2000</span>
            <Button type="submit" className="min-h-11" disabled={createPost.isPending}>
              Publier
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4 text-sm">
          <p className="text-muted-foreground">Connectez-vous pour publier et réagir.</p>
          <Button asChild className="mt-3 min-h-11">
            <Link to="/login">Se connecter</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {posts.error && (
          <ErrorState message={(posts.error as Error).message} onRetry={() => void posts.refetch()} />
        )}
        {posts.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        {posts.data?.length === 0 && (
          <EmptyState title="Aucune publication" description="Soyez le premier à lancer la discussion." />
        )}
        {posts.data?.map((p) => {
          const liked = Boolean(likes?.has(p.id));
          return (
            <article key={p.id} className="rounded-2xl border border-border bg-surface p-4">
              <header className="flex items-center gap-2">
                {p.author?.avatar_url ? (
                  <img src={p.author.avatar_url} alt="" className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="size-8 rounded-full bg-surface-2" />
                )}
                <div className="min-w-0">
                  {p.author?.username ? (
                    <Link
                      to="/profile/$username"
                      params={{ username: p.author.username }}
                      className="text-sm font-semibold hover:text-accent"
                    >
                      {p.author.display_name ?? p.author.username}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold">Otaku</span>
                  )}
                  <p className="text-[11px] text-muted-foreground">{timeAgo(p.created_at)}</p>
                </div>
              </header>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{p.content}</p>
              <footer className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <button
                  className="inline-flex min-h-9 items-center gap-1.5"
                  onClick={() => toggleLike.mutate({ target_type: "post", target_id: p.id, liked, owner_id: p.user_id })}
                >
                  <Heart className={liked ? "size-4 fill-primary text-primary" : "size-4"} />
                  {p.likes_count}
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="size-4" /> {p.comments_count}
                </span>
                {user && (
                  <button
                    className="ml-auto inline-flex min-h-9 items-center gap-1.5"
                    onClick={() =>
                      report.mutate({ target_type: "post", target_id: p.id, reason: "Signalé par un membre" })
                    }
                  >
                    <Flag className="size-4" /> Signaler
                  </button>
                )}
              </footer>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="secondary" className="min-h-11" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          className="min-h-11"
          disabled={(posts.data?.length ?? 0) < 10}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
