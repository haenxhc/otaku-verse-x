/**
 * AniList GraphQL service — primary metadata source for anime & manga.
 * Public API, no credentials required. All requests go through one client so
 * caching, error handling and rate-limit backoff live in a single place.
 */

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type MediaType = "ANIME" | "MANGA";

export interface MediaTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred?: string | null;
}

export interface MediaListItem {
  id: number;
  type: MediaType;
  title: MediaTitle;
  coverImage: { extraLarge: string | null; large: string | null; color: string | null };
  bannerImage: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  chapters: number | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  seasonYear: number | null;
  season: string | null;
  countryOfOrigin: string | null;
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
}

export interface MediaDetail extends MediaListItem {
  description: string | null;
  synonyms: string[];
  duration: number | null;
  volumes: number | null;
  favourites: number | null;
  meanScore: number | null;
  isAdult: boolean;
  siteUrl: string | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  source: string | null;
  studios: { edges: { isMain: boolean; node: { id: number; name: string } }[] };
  staff: {
    edges: { role: string | null; node: { id: number; name: { full: string }; image: { large: string | null } } }[];
  };
  characters: {
    edges: {
      role: string | null;
      node: { id: number; name: { full: string }; image: { large: string | null } };
      voiceActors: { id: number; name: { full: string }; image: { large: string | null } }[];
    }[];
  };
  relations: {
    edges: { relationType: string | null; node: MediaListItem }[];
  };
  recommendations: {
    nodes: { mediaRecommendation: MediaListItem | null }[];
  };
  tags: { name: string; rank: number | null }[];
  externalLinks: { id: number; site: string; url: string | null }[];
}

const MEDIA_CARD_FIELDS = `
  id
  type
  title { romaji english native userPreferred }
  coverImage { extraLarge large color }
  bannerImage
  format
  status
  episodes
  chapters
  averageScore
  popularity
  genres
  season
  seasonYear
  countryOfOrigin
  nextAiringEpisode { episode airingAt }
`;

async function anilistRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new ApiError("Impossible de joindre AniList. Vérifiez votre connexion.", 0);
  }

  if (res.status === 429) {
    throw new ApiError("Trop de requêtes vers AniList. Merci de réessayer dans quelques secondes.", 429);
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: T; errors?: { message: string; status?: number }[] }
    | null;

  if (!res.ok || !json) {
    throw new ApiError("AniList a renvoyé une réponse invalide.", res.status);
  }
  if (json.errors?.length) {
    const first = json.errors[0]!;
    throw new ApiError(first.message || "Erreur AniList", first.status ?? res.status);
  }
  if (!json.data) throw new ApiError("Aucune donnée renvoyée par AniList.", 404);
  return json.data;
}

export interface PagedMedia {
  pageInfo: { currentPage: number; hasNextPage: boolean; lastPage: number; total: number };
  media: MediaListItem[];
}

export interface BrowseParams {
  type: MediaType;
  page?: number;
  perPage?: number;
  search?: string | null;
  genre?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  format?: string | null;
  status?: string | null;
  countryOfOrigin?: string | null;
  sort?: string[];
}

export async function browseMedia(params: BrowseParams): Promise<PagedMedia> {
  const query = `
    query Browse($page: Int, $perPage: Int, $type: MediaType, $search: String, $genre: String,
                 $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus,
                 $country: CountryCode, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage lastPage total }
        media(type: $type, search: $search, genre: $genre, season: $season, seasonYear: $seasonYear,
              format: $format, status: $status, countryOfOrigin: $country, sort: $sort, isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: PagedMedia }>(query, {
    page: params.page ?? 1,
    perPage: params.perPage ?? 24,
    type: params.type,
    search: params.search || undefined,
    genre: params.genre || undefined,
    season: params.season || undefined,
    seasonYear: params.seasonYear || undefined,
    format: params.format || undefined,
    status: params.status || undefined,
    country: params.countryOfOrigin || undefined,
    sort: params.sort ?? (params.search ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"]),
  });
  return data.Page;
}

export async function getMediaById(id: number, type: MediaType): Promise<MediaDetail> {
  const query = `
    query Detail($id: Int, $type: MediaType) {
      Media(id: $id, type: $type) {
        ${MEDIA_CARD_FIELDS}
        description(asHtml: false)
        synonyms
        duration
        volumes
        favourites
        meanScore
        isAdult
        siteUrl
        source
        startDate { year month day }
        endDate { year month day }
        tags { name rank }
        externalLinks { id site url }
        studios { edges { isMain node { id name } } }
        staff(perPage: 12) { edges { role node { id name { full } image { large } } } }
        characters(sort: [ROLE, RELEVANCE], perPage: 18) {
          edges {
            role
            node { id name { full } image { large } }
            voiceActors(language: JAPANESE) { id name { full } image { large } }
          }
        }
        relations { edges { relationType node { ${MEDIA_CARD_FIELDS} } } }
        recommendations(sort: RATING_DESC, perPage: 12) {
          nodes { mediaRecommendation { ${MEDIA_CARD_FIELDS} } }
        }
      }
    }
  `;
  const data = await anilistRequest<{ Media: MediaDetail }>(query, { id, type });
  return data.Media;
}

/** Airing schedule between two unix timestamps (seconds). */
export interface AiringEntry {
  id: number;
  episode: number;
  airingAt: number;
  media: MediaListItem;
}

export async function getAiringSchedule(
  airingAtGreater: number,
  airingAtLesser: number,
  page = 1,
): Promise<{ pageInfo: { hasNextPage: boolean }; airingSchedules: AiringEntry[] }> {
  const query = `
    query Schedule($start: Int, $end: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          media { ${MEDIA_CARD_FIELDS} }
        }
      }
    }
  `;
  const data = await anilistRequest<{
    Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AiringEntry[] };
  }>(query, { start: airingAtGreater, end: airingAtLesser, page });
  return data.Page;
}

export interface CharacterDetail {
  id: number;
  name: { full: string; native: string | null; alternative: string[] };
  image: { large: string | null };
  description: string | null;
  favourites: number | null;
  media: { nodes: MediaListItem[] };
}

export async function getCharacterById(id: number): Promise<CharacterDetail> {
  const query = `
    query Char($id: Int) {
      Character(id: $id) {
        id
        name { full native alternative }
        image { large }
        description(asHtml: false)
        favourites
        media(sort: POPULARITY_DESC, perPage: 12) { nodes { ${MEDIA_CARD_FIELDS} } }
      }
    }
  `;
  const data = await anilistRequest<{ Character: CharacterDetail }>(query, { id });
  return data.Character;
}

export interface SearchAllResult {
  anime: MediaListItem[];
  manga: MediaListItem[];
  characters: { id: number; name: { full: string }; image: { large: string | null } }[];
}

export async function searchEverything(term: string): Promise<SearchAllResult> {
  const query = `
    query SearchAll($search: String) {
      anime: Page(perPage: 12) {
        media(type: ANIME, search: $search, sort: SEARCH_MATCH, isAdult: false) { ${MEDIA_CARD_FIELDS} }
      }
      manga: Page(perPage: 12) {
        media(type: MANGA, search: $search, sort: SEARCH_MATCH, isAdult: false) { ${MEDIA_CARD_FIELDS} }
      }
      chars: Page(perPage: 12) {
        characters(search: $search, sort: SEARCH_MATCH) { id name { full } image { large } }
      }
    }
  `;
  const data = await anilistRequest<{
    anime: { media: MediaListItem[] };
    manga: { media: MediaListItem[] };
    chars: { characters: SearchAllResult["characters"] };
  }>(query, { search: term });
  return { anime: data.anime.media, manga: data.manga.media, characters: data.chars.characters };
}

export async function getMediaByIds(ids: number[], type: MediaType): Promise<MediaListItem[]> {
  if (ids.length === 0) return [];
  const query = `
    query ByIds($ids: [Int], $type: MediaType) {
      Page(perPage: 50) {
        media(id_in: $ids, type: $type) { ${MEDIA_CARD_FIELDS} }
      }
    }
  `;
  const data = await anilistRequest<{ Page: { media: MediaListItem[] } }>(query, {
    ids: ids.slice(0, 50),
    type,
  });
  return data.Page.media;
}

export async function getRecommendationsFromGenres(
  genres: string[],
  type: MediaType,
  excludeIds: number[] = [],
): Promise<MediaListItem[]> {
  if (genres.length === 0) return [];
  const query = `
    query Reco($genres: [String], $type: MediaType, $exclude: [Int]) {
      Page(perPage: 20) {
        media(genre_in: $genres, type: $type, id_not_in: $exclude, sort: [SCORE_DESC, POPULARITY_DESC], isAdult: false) {
          ${MEDIA_CARD_FIELDS}
        }
      }
    }
  `;
  const data = await anilistRequest<{ Page: { media: MediaListItem[] } }>(query, {
    genres: genres.slice(0, 5),
    type,
    exclude: excludeIds.slice(0, 50),
  });
  return data.Page.media;
}

export const ANIME_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;

export function currentSeason(date = new Date()): { season: string; year: number } {
  const m = date.getUTCMonth();
  const season = m <= 1 || m === 11 ? "WINTER" : m <= 4 ? "SPRING" : m <= 7 ? "SUMMER" : "FALL";
  const year = m === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  return { season, year };
}
