import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { awardXp, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { MediaKind } from "@/hooks/useLibrary";
import { XP_REWARDS } from "@/lib/gamification";

export interface ReviewRow {
  id: string;
  user_id: string;
  media_type: MediaKind;
  media_id: number;
  title: string | null;
  body: string;
  score: number | null;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    xp: number;
  } | null;
}

const REVIEW_SELECT = `
  id, user_id, media_type, media_id, title, body, score, created_at,
  author:profiles!reviews_user_id_fkey ( id, username, display_name, avatar_url, xp )
`;

export function useReviews(mediaType: MediaKind, mediaId: number) {
  return useQuery({
    queryKey: ["reviews", mediaType, mediaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(REVIEW_SELECT)
        .eq("media_type", mediaType)
        .eq("media_id", mediaId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewRow[];
    },
  });
}

export function useUpsertReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      media_type: MediaKind;
      media_id: number;
      title?: string | null;
      body: string;
      score?: number | null;
    }) => {
      if (!user) throw new Error("Créez un compte pour publier un avis.");
      const body = input.body.trim();
      if (body.length < 20) throw new Error("Votre avis doit contenir au moins 20 caractères.");
      if (body.length > 5000) throw new Error("Avis trop long (5000 caractères max).");
      const title = input.title?.trim().slice(0, 120) || null;
      if (input.score != null && (input.score < 1 || input.score > 10)) {
        throw new Error("Note invalide (1-10).");
      }
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        media_type: input.media_type,
        media_id: input.media_id,
        title,
        body,
        score: input.score ?? null,
      });
      if (error) throw error;
      await awardXp(XP_REWARDS.review);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviews"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avis publié — +30 XP");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Avis supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface AchievementRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  xp_reward: number;
  target: number;
  category: string;
}

/** Catalogue of achievements plus the signed-in user's live progress. */
export function useAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["achievements", user?.id],
    queryFn: async () => {
      const { data: achievements, error } = await supabase
        .from("achievements")
        .select("id, code, name, description, xp_reward, target, category")
        .order("target", { ascending: true });
      if (error) throw error;

      const stats = {
        anime: 0,
        manga: 0,
        list: 0,
        rating: 0,
        community: 0,
        level: 0,
      };

      if (user) {
        const [watch, read, ratings, comments, profile] = await Promise.all([
          supabase.from("watchlists").select("status").eq("user_id", user.id),
          supabase.from("reading_lists").select("status").eq("user_id", user.id),
          supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle(),
        ]);
        const watchRows = watch.data ?? [];
        const readRows = read.data ?? [];
        stats.anime = watchRows.filter((r) => r.status === "completed").length;
        stats.manga = readRows.filter((r) => r.status === "completed").length;
        stats.list = watchRows.length + readRows.length;
        stats.rating = ratings.count ?? 0;
        stats.community = comments.count ?? 0;
        stats.level = profile.data?.xp ?? 0;
      }

      return (achievements ?? []).map((a) => {
        const progress = stats[a.category as keyof typeof stats] ?? 0;
        return {
          ...a,
          progress: Math.min(progress, a.target),
          unlocked: progress >= a.target,
        };
      });
    },
  });
}
