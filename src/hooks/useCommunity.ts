import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { awardXp, useAuth } from "@/hooks/useAuth";
import { XP_REWARDS } from "@/lib/gamification";

export interface PostAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
}

export interface PostRow {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  media_type: "anime" | "manga" | "character" | null;
  media_id: number | null;
  media_title: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_hidden: boolean;
  author: PostAuthor | null;
}

const POST_SELECT = `
  id, user_id, content, image_url, media_type, media_id, media_title,
  likes_count, comments_count, created_at, is_hidden,
  author:profiles!posts_user_id_fkey ( id, username, display_name, avatar_url, xp )
`;

export const POSTS_PER_PAGE = 10;

export function usePosts(options: { userId?: string; page?: number } = {}) {
  const page = options.page ?? 0;
  return useQuery({
    queryKey: ["posts", options.userId ?? "all", page],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .order("created_at", { ascending: false })
        .range(page * POSTS_PER_PAGE, page * POSTS_PER_PAGE + POSTS_PER_PAGE - 1);
      if (options.userId) query = query.eq("user_id", options.userId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PostRow[];
    },
  });
}

export function useMyLikes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("target_type, target_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((l) => `${l.target_type}:${l.target_id}`));
    },
  });
}

export function useCreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; image_url?: string | null }) => {
      if (!user) throw new Error("Connectez-vous pour publier.");
      const content = input.content.trim();
      if (content.length < 1) throw new Error("Votre publication est vide.");
      if (content.length > 5000) throw new Error("Publication trop longue (5000 caractères max).");
      const { error } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content, image_url: input.image_url ?? null });
      if (error) throw error;
      await awardXp(XP_REWARDS.post);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["posts"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Publication envoyée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Publication supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      target_type: "post" | "comment";
      target_id: string;
      liked: boolean;
      owner_id?: string;
      link?: string;
    }) => {
      if (!user) throw new Error("Connectez-vous pour aimer une publication.");
      if (input.liked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", input.target_type)
          .eq("target_id", input.target_id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, target_type: input.target_type, target_id: input.target_id });
      if (error) throw error;
      if (input.owner_id && input.owner_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: input.owner_id,
          actor_id: user.id,
          type: "like",
          title: "Nouveau like",
          body: "Quelqu'un a aimé votre contenu.",
          link: input.link ?? "/community",
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["posts"] });
      void qc.invalidateQueries({ queryKey: ["my-likes"] });
      void qc.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  author: PostAuthor | null;
}

export function useComments(postId: string | null) {
  return useQuery({
    queryKey: ["comments", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `id, post_id, user_id, parent_id, content, likes_count, created_at,
           author:profiles!comments_user_id_fkey ( id, username, display_name, avatar_url, xp )`,
        )
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      post_id: string;
      content: string;
      parent_id?: string | null;
      post_owner_id?: string;
    }) => {
      if (!user) throw new Error("Connectez-vous pour commenter.");
      const content = input.content.trim();
      if (!content) throw new Error("Commentaire vide.");
      if (content.length > 2000) throw new Error("Commentaire trop long (2000 caractères max).");
      const { error } = await supabase.from("comments").insert({
        post_id: input.post_id,
        user_id: user.id,
        parent_id: input.parent_id ?? null,
        content,
      });
      if (error) throw error;
      await awardXp(XP_REWARDS.comment);
      if (input.post_owner_id && input.post_owner_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: input.post_owner_id,
          actor_id: user.id,
          type: input.parent_id ? "reply" : "comment",
          title: input.parent_id ? "Nouvelle réponse" : "Nouveau commentaire",
          body: content.slice(0, 140),
          link: "/community",
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments"] });
      void qc.invalidateQueries({ queryKey: ["posts"] });
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFollowCounts(userId?: string | null) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId!),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId!),
      ]);
      return { followers: followers.count ?? 0, following: following.count ?? 0 };
    },
  });
}

export function useIsFollowing(targetId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-following", user?.id, targetId],
    enabled: Boolean(user?.id && targetId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { targetId: string; following: boolean; username?: string }) => {
      if (!user) throw new Error("Connectez-vous pour suivre un membre.");
      if (user.id === input.targetId) throw new Error("Vous ne pouvez pas vous suivre vous-même.");
      if (input.following) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", input.targetId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: input.targetId });
      if (error) throw error;
      await awardXp(XP_REWARDS.follow);
      await supabase.from("notifications").insert({
        user_id: input.targetId,
        actor_id: user.id,
        type: "follow",
        title: "Nouvel abonné",
        body: "Un membre vous suit désormais.",
        link: "/community",
      });
      return true;
    },
    onSuccess: (followed) => {
      void qc.invalidateQueries({ queryKey: ["is-following"] });
      void qc.invalidateQueries({ queryKey: ["follow-counts"] });
      toast.success(followed ? "Abonnement ajouté" : "Abonnement retiré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications-unread", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id?: string) => {
      if (!user) return;
      let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
      if (id) q = q.eq("id", id);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useReportContent() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      target_type: "post" | "comment" | "profile" | "review";
      target_id: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Connectez-vous pour signaler.");
      const reason = input.reason.trim();
      if (reason.length < 3) throw new Error("Merci de préciser le motif.");
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        target_type: input.target_type,
        target_id: input.target_id,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Signalement transmis à la modération"),
    onError: (e: Error) => toast.error(e.message),
  });
}
