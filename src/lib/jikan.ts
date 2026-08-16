/**
 * Jikan (MyAnimeList unofficial API) — complementary / fallback source.
 * Used only for data AniList does not expose reliably (e.g. released manga
 * chapter listings, extra statistics). Public API, no credentials.
 * Never invents data: an empty result is returned as an empty list.
 */

import { ApiError } from "./anilist";

const JIKAN_BASE = "https://api.jikan.moe/v4";

async function jikanRequest<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${JIKAN_BASE}${path}`, { headers: { Accept: "application/json" } });
  } catch {
    return null; // complementary source: degrade silently
  }
  if (res.status === 404) return null;
  if (res.status === 429) throw new ApiError("Jikan est momentanément saturé.", 429);
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  return json?.data ?? null;
}

export interface JikanMalItem {
  mal_id: number;
  title: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  score?: number | null;
  synopsis?: string | null;
  url?: string;
}

/** Find the MAL entry matching a title, used to bridge AniList -> Jikan. */
export async function findMalEntry(
  title: string,
  kind: "anime" | "manga",
): Promise<JikanMalItem | null> {
  const data = await jikanRequest<JikanMalItem[]>(
    `/${kind}?q=${encodeURIComponent(title)}&limit=1&sfw=true`,
  );
  return data?.[0] ?? null;
}

export interface JikanStatistics {
  scores?: { score: number; votes: number; percentage: number }[];
  completed?: number;
  reading?: number;
  watching?: number;
  plan_to_watch?: number;
  plan_to_read?: number;
  dropped?: number;
  total?: number;
}

export async function getMalStatistics(
  malId: number,
  kind: "anime" | "manga",
): Promise<JikanStatistics | null> {
  return jikanRequest<JikanStatistics>(`/${kind}/${malId}/statistics`);
}

export interface JikanExternal {
  name: string;
  url: string;
}

export async function getMalExternalLinks(
  malId: number,
  kind: "anime" | "manga",
): Promise<JikanExternal[]> {
  const data = await jikanRequest<JikanExternal[]>(`/${kind}/${malId}/external`);
  return data ?? [];
}

/** Top upcoming anime — complementary "Prochainement" data for the calendar. */
export async function getUpcomingAnime(): Promise<JikanMalItem[]> {
  const data = await jikanRequest<JikanMalItem[]>("/seasons/upcoming?limit=12&sfw=true");
  return data ?? [];
}
