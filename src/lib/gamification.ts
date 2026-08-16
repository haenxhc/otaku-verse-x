/**
 * XP & level system. Levels are derived from XP; XP is stored on profiles and
 * only ever incremented through the `award_xp` database function.
 */

export interface OtakuLevel {
  index: number;
  name: string;
  minXp: number;
  nextXp: number | null;
}

const LEVELS: { name: string; minXp: number }[] = [
  { name: "Otaku Novice", minXp: 0 },
  { name: "Otaku", minXp: 300 },
  { name: "Otaku Confirmé", minXp: 900 },
  { name: "Otaku Expert", minXp: 2200 },
  { name: "Otaku Elite", minXp: 5000 },
  { name: "Legendary Otaku", minXp: 10000 },
];

export function levelFromXp(xp: number): OtakuLevel {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (xp >= LEVELS[i]!.minXp) idx = i;
  }
  const current = LEVELS[idx]!;
  const next = LEVELS[idx + 1];
  return {
    index: idx,
    name: current.name,
    minXp: current.minXp,
    nextXp: next ? next.minXp : null,
  };
}

export function levelProgress(xp: number): number {
  const lvl = levelFromXp(xp);
  if (lvl.nextXp === null) return 100;
  const span = lvl.nextXp - lvl.minXp;
  return Math.min(100, Math.round(((xp - lvl.minXp) / span) * 100));
}

export const XP_REWARDS = {
  addToList: 10,
  completeAnime: 40,
  completeManga: 40,
  readChapter: 2,
  watchEpisode: 3,
  rate: 8,
  review: 30,
  post: 15,
  comment: 6,
  follow: 4,
  favorite: 5,
} as const;

export type XpAction = keyof typeof XP_REWARDS;

export const ALL_LEVELS = LEVELS.map((l) => l.name);
