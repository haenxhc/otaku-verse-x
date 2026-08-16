import type { MediaListItem, MediaTitle } from "./anilist";

/** Strips HTML/BBCode from API descriptions — never render API HTML directly (XSS). */
export function stripMarkup(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\[\/?[a-z=#0-9"']+\]/gi, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function pickTitle(title: MediaTitle | null | undefined): string {
  if (!title) return "Sans titre";
  return title.english || title.romaji || title.native || "Sans titre";
}

export function altTitles(title: MediaTitle | null | undefined, synonyms: string[] = []): string[] {
  const main = pickTitle(title);
  const list = [title?.romaji, title?.english, title?.native, ...synonyms];
  return Array.from(new Set(list.filter((t): t is string => Boolean(t) && t !== main)));
}

const STATUS_FR: Record<string, string> = {
  FINISHED: "Terminé",
  RELEASING: "En cours",
  NOT_YET_RELEASED: "À venir",
  CANCELLED: "Annulé",
  HIATUS: "En pause",
};

const SEASON_FR: Record<string, string> = {
  WINTER: "Hiver",
  SPRING: "Printemps",
  SUMMER: "Été",
  FALL: "Automne",
};

export const translateStatus = (s: string | null | undefined) => (s ? (STATUS_FR[s] ?? s) : "—");
export const translateSeason = (s: string | null | undefined) => (s ? (SEASON_FR[s] ?? s) : "—");

export function formatFuzzyDate(
  d: { year: number | null; month: number | null; day: number | null } | null | undefined,
): string {
  if (!d?.year) return "—";
  const parts = [d.day, d.month, d.year].filter((v): v is number => typeof v === "number");
  if (parts.length === 3) return `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}`;
  if (d.month) return `${String(d.month).padStart(2, "0")}/${d.year}`;
  return String(d.year);
}

export function formatCount(n: number | null | undefined): string {
  if (typeof n !== "number") return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatAiringCountdown(airingAt: number): string {
  const diff = airingAt * 1000 - Date.now();
  if (diff <= 0) return "Diffusé";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

export function mediaKindLabel(media: Pick<MediaListItem, "type" | "format" | "countryOfOrigin">): string {
  if (media.type === "ANIME") return media.format ?? "Anime";
  if (media.countryOfOrigin === "KR") return "Manhwa / Webtoon";
  if (media.countryOfOrigin === "CN") return "Manhua";
  const map: Record<string, string> = { MANGA: "Manga", NOVEL: "Light Novel", ONE_SHOT: "One-shot" };
  return media.format ? (map[media.format] ?? media.format) : "Manga";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function progressPercent(done: number, total: number | null | undefined): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}
