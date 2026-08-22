/**
 * Server functions for the Premium watch page. Premium status is always
 * verified server-side before any playback information is returned.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getMediaById } from "@/lib/anilist";
import { pickTitle } from "@/lib/format";

export const getWatchInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { animeId: number; episode: number }) => {
    if (!Number.isFinite(input.animeId) || input.animeId <= 0) throw new Error("Anime invalide");
    const episode = Math.min(Math.max(Math.trunc(input.episode) || 1, 1), 2000);
    return { animeId: Math.trunc(input.animeId), episode };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: hasPremium } = await supabase.rpc("has_active_premium", { _user_id: userId });

    const media = await getMediaById(data.animeId, "ANIME");
    const title = pickTitle(media.title);
    const coverImage = media.coverImage.extraLarge ?? media.coverImage.large ?? null;
    const externalLinks = (media.externalLinks ?? [])
      .filter((l): l is { id: number; site: string; url: string } => Boolean(l.url))
      .map((l) => ({ site: l.site, url: l.url }));

    if (!hasPremium) {
      return {
        hasPremium: false as const,
        title,
        coverImage,
        totalEpisodes: media.episodes ?? null,
        episode: data.episode,
        sourceUrl: null as string | null,
        externalLinks: [] as { site: string; url: string }[],
        position: 0,
      };
    }

    const { data: history } = await supabase
      .from("watch_history")
      .select("position_seconds")
      .eq("user_id", userId)
      .eq("anime_id", data.animeId)
      .eq("episode", data.episode)
      .maybeSingle();

    // No licensed stream is bundled with the app: playback sources come from
    // official partners only, so the player stays empty until one is configured.
    return {
      hasPremium: true as const,
      title,
      coverImage,
      totalEpisodes: media.episodes ?? null,
      episode: data.episode,
      sourceUrl: null as string | null,
      externalLinks,
      position: history?.position_seconds ?? 0,
    };
  });

export const saveWatchProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      animeId: number;
      episode: number;
      positionSeconds: number;
      durationSeconds?: number | null;
      title?: string | null;
      coverImage?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: hasPremium } = await supabase.rpc("has_active_premium", { _user_id: userId });
    if (!hasPremium) throw new Error("Premium requis");

    const position = Math.max(0, Math.trunc(data.positionSeconds) || 0);
    const duration = data.durationSeconds ? Math.trunc(data.durationSeconds) : null;

    const { error } = await supabase.from("watch_history").upsert(
      {
        user_id: userId,
        anime_id: Math.trunc(data.animeId),
        episode: Math.max(1, Math.trunc(data.episode) || 1),
        position_seconds: position,
        duration_seconds: duration,
        completed: duration ? position >= duration * 0.9 : false,
        title: data.title ?? null,
        cover_image: data.coverImage ?? null,
      },
      { onConflict: "user_id,anime_id,episode" },
    );
    if (error) throw error;
    return { ok: true };
  });
