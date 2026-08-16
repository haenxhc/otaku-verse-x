import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { awardXp, useAuth } from "@/hooks/useAuth";
import { XP_REWARDS } from "@/lib/gamification";

export type MediaKind = "anime" | "manga" | "character";
export type ListStatus = "planning" | "current" | "completed" | "dropped" | "paused";

export const LIST_STATUS_LABELS: Record<ListStatus, { anime: string; manga: string }> = {
  planning: { anime: "À regarder", manga: "À lire" },
  current: { anime: "En cours", manga: "En cours" },
  completed: { anime: "Terminés", manga: "Terminés" },
  paused: { anime: "En pause", manga: "En pause" },
  dropped: { anime: "Abandonnés", manga: "Abandonnés" },
};

export interface FavoriteRow {
  id: string;
  media_type: MediaKind;
  media_id: number;
  title: string | null;
  cover_image: string | null;
  created_at: string;
}

export function useFavorites(userId?: string | null) {
  return useQuery({
    queryKey: ["favorites", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FavoriteRow[];
    },
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      media_type: MediaKind;
      media_id: number;
      title?: string | null;
      cover_image?: string | null;
      isFavorite: boolean;
    }) => {
      if (!user) throw new Error("Connectez-vous pour utiliser les favoris.");
      if (input.isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("media_type", input.media_type)
          .eq("media_id", input.media_id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        media_type: input.media_type,
        media_id: input.media_id,
        title: input.title ?? null,
        cover_image: input.cover_image ?? null,
      });
      if (error) throw error;
      await awardXp(XP_REWARDS.favorite);
      return true;
    },
    onSuccess: (added) => {
      void qc.invalidateQueries({ queryKey: ["favorites"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface WatchlistRow {
  id: string;
  anime_id: number;
  title: string | null;
  cover_image: string | null;
  total_episodes: number | null;
  status: ListStatus;
  updated_at: string;
}

export interface ReadingListRow {
  id: string;
  manga_id: number;
  title: string | null;
  cover_image: string | null;
  total_chapters: number | null;
  status: ListStatus;
  updated_at: string;
}

export function useWatchlist(userId?: string | null) {
  return useQuery({
    queryKey: ["watchlist", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watchlists")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WatchlistRow[];
    },
  });
}

export function useReadingList(userId?: string | null) {
  return useQuery({
    queryKey: ["reading-list", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_lists")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReadingListRow[];
    },
  });
}

export function useSetListStatus(kind: "anime" | "manga") {
  const { user } = useAuth();
  const qc = useQueryClient();
  const table = kind === "anime" ? "watchlists" : "reading_lists";
  return useMutation({
    mutationFn: async (input: {
      media_id: number;
      status: ListStatus | null;
      title?: string | null;
      cover_image?: string | null;
      total?: number | null;
    }) => {
      if (!user) throw new Error("Connectez-vous pour gérer votre liste.");
      const idColumn = kind === "anime" ? "anime_id" : "manga_id";
      if (input.status === null) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", user.id)
          .eq(idColumn, input.media_id);
        if (error) throw error;
        return null;
      }
      const payload =
        kind === "anime"
          ? {
              user_id: user.id,
              anime_id: input.media_id,
              status: input.status,
              title: input.title ?? null,
              cover_image: input.cover_image ?? null,
              total_episodes: input.total ?? null,
            }
          : {
              user_id: user.id,
              manga_id: input.media_id,
              status: input.status,
              title: input.title ?? null,
              cover_image: input.cover_image ?? null,
              total_chapters: input.total ?? null,
            };
      const { error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: `user_id,${idColumn}` });
      if (error) throw error;
      await awardXp(
        input.status === "completed"
          ? kind === "anime"
            ? XP_REWARDS.completeAnime
            : XP_REWARDS.completeManga
          : XP_REWARDS.addToList,
      );
      return input.status;
    },
    onSuccess: (status) => {
      void qc.invalidateQueries({ queryKey: ["watchlist"] });
      void qc.invalidateQueries({ queryKey: ["reading-list"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(status === null ? "Retiré de la liste" : "Liste mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWatchProgress(userId?: string | null, animeId?: number) {
  return useQuery({
    queryKey: ["watch-progress", userId, animeId],
    enabled: Boolean(userId && animeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("watch_progress")
        .select("*")
        .eq("user_id", userId!)
        .eq("anime_id", animeId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveWatchProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { anime_id: number; episodes_watched: number; total?: number | null }) => {
      if (!user) throw new Error("Connectez-vous pour suivre votre progression.");
      const { error } = await supabase.from("watch_progress").upsert(
        {
          user_id: user.id,
          anime_id: input.anime_id,
          episodes_watched: Math.max(0, input.episodes_watched),
          total_episodes: input.total ?? null,
        },
        { onConflict: "user_id,anime_id" },
      );
      if (error) throw error;
      await awardXp(XP_REWARDS.watchEpisode);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["watch-progress"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Progression enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReadingProgress(userId?: string | null, mangaId?: number) {
  return useQuery({
    queryKey: ["reading-progress", userId, mangaId],
    enabled: Boolean(userId && mangaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", userId!)
        .eq("manga_id", mangaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveReadingProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      manga_id: number;
      last_chapter: number;
      total?: number | null;
      marked_read?: boolean;
    }) => {
      if (!user) throw new Error("Connectez-vous pour suivre votre lecture.");
      const { error } = await supabase.from("reading_progress").upsert(
        {
          user_id: user.id,
          manga_id: input.manga_id,
          last_chapter: Math.max(0, input.last_chapter),
          total_chapters: input.total ?? null,
          marked_read: input.marked_read ?? false,
        },
        { onConflict: "user_id,manga_id" },
      );
      if (error) throw error;
      await awardXp(XP_REWARDS.readChapter);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reading-progress"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Lecture enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMyRating(mediaType: MediaKind, mediaId: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["rating", user?.id, mediaType, mediaId],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("score")
        .eq("user_id", user!.id)
        .eq("media_type", mediaType)
        .eq("media_id", mediaId)
        .maybeSingle();
      if (error) throw error;
      return data?.score ?? null;
    },
  });
}

export function useRateMedia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { media_type: MediaKind; media_id: number; score: number }) => {
      if (!user) throw new Error("Connectez-vous pour noter.");
      if (input.score < 1 || input.score > 10) throw new Error("Note invalide (1-10).");
      const { error } = await supabase
        .from("ratings")
        .upsert(
          { user_id: user.id, media_type: input.media_type, media_id: input.media_id, score: input.score },
          { onConflict: "user_id,media_type,media_id" },
        );
      if (error) throw error;
      await awardXp(XP_REWARDS.rate);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rating"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Note enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Fire-and-forget analytics ping used for admin statistics. */
export async function trackMediaView(mediaType: MediaKind, mediaId: number, userId?: string | null) {
  await supabase
    .from("media_views")
    .insert({ media_type: mediaType, media_id: mediaId, user_id: userId ?? null });
}
