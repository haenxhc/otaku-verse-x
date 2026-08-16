import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Play, Sparkles, TrendingUp } from "lucide-react";

import { MediaRail } from "@/components/otaku/MediaRail";
import { Button } from "@/components/ui/button";
import { useAuth, useMyProfile } from "@/hooks/useAuth";
import { useFavorites, useWatchlist } from "@/hooks/useLibrary";
import {
  browseMedia,
  currentSeason,
  getRecommendationsFromGenres,
  type MediaListItem,
} from "@/lib/anilist";
import { pickTitle, stripMarkup } from "@/lib/format";
import { levelFromXp, levelProgress } from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OtakuVerse X — Votre univers anime & manga" },
      {
        name: "description",
        content:
          "Tendances anime, mangas et webtoons, calendrier de diffusion, actualités et communauté otaku. Suivez vos listes et progressez en XP.",
      },
      { property: "og:title", content: "OtakuVerse X — Votre univers anime & manga" },
      {
        property: "og:description",
        content: "Tendances anime, manga, webtoon, calendrier, actualités et communauté otaku.",
      },
    ],
  }),
  component: HomePage,
});

const STALE = 1000 * 60 * 10;

function HomePage() {
  const { season, year } = currentSeason();
  const { user } = useAuth();
  const { data: profile } = useMyProfile();

  const trending = useQuery({
    queryKey: ["home", "trending"],
    staleTime: STALE,
    queryFn: () => browseMedia({ type: "ANIME", perPage: 12, sort: ["TRENDING_DESC"] }),
  });

  const seasonal = useQuery({
    queryKey: ["home", "seasonal", season, year],
    staleTime: STALE,
    queryFn: () =>
      browseMedia({ type: "ANIME", perPage: 12, season, seasonYear: year, sort: ["POPULARITY_DESC"] }),
  });

  const topAnime = useQuery({
    queryKey: ["home", "top-anime"],
    staleTime: STALE,
    queryFn: () => browseMedia({ type: "ANIME", perPage: 12, sort: ["SCORE_DESC"] }),
  });

  const popularManga = useQuery({
    queryKey: ["home", "manga"],
    staleTime: STALE,
    queryFn: () => browseMedia({ type: "MANGA", perPage: 12, sort: ["POPULARITY_DESC"] }),
  });

  const webtoons = useQuery({
    queryKey: ["home", "webtoon"],
    staleTime: STALE,
    queryFn: () =>
      browseMedia({ type: "MANGA", perPage: 12, countryOfOrigin: "KR", sort: ["POPULARITY_DESC"] }),
  });

  const news = useQuery({
    queryKey: ["home", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("slug, title, summary, category, published_at, reading_minutes")
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: favorites } = useFavorites(user?.id);
  const { data: watchlist } = useWatchlist(user?.id);

  const recoGenres = profile?.favorite_genres ?? [];
  const reco = useQuery({
    queryKey: ["home", "reco", recoGenres.join(","), watchlist?.length ?? 0],
    enabled: Boolean(user) && recoGenres.length > 0,
    staleTime: STALE,
    queryFn: () =>
      getRecommendationsFromGenres(
        recoGenres,
        "ANIME",
        (watchlist ?? []).map((w) => w.anime_id),
      ),
  });

  const hero: MediaListItem | undefined = trending.data?.media[0];
  const lastFavorite = favorites?.[0];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {hero?.bannerImage ? (
            <img
              src={hero.bannerImage}
              alt=""
              className="h-full w-full object-cover opacity-35"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full bg-surface" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/85 to-background/40" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 md:px-6 md:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-semibold text-accent">
            <Sparkles className="size-3.5" /> Saison {season.toLowerCase()} {year}
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl leading-tight font-extrabold sm:text-4xl md:text-5xl">
            Toute la culture <span className="text-gradient-otaku">Otaku</span> en un seul endroit
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Fiches détaillées, calendrier des sorties, listes synchronisées, actualités et
            communauté. {hero ? `En tendance : ${pickTitle(hero.title)}.` : ""}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-h-12 gap-2">
              <Link to="/explore">
                <Play className="size-4" /> Explorer maintenant
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="min-h-12 gap-2">
              <Link to="/calendar">
                <CalendarDays className="size-4" /> Sorties de la semaine
              </Link>
            </Button>
          </div>

          {profile && (
            <div className="mt-8 max-w-md rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">{levelFromXp(profile.xp).name}</span>
                <span className="text-muted-foreground">{profile.xp} XP</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${levelProgress(profile.xp)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {levelFromXp(profile.xp).nextXp
                  ? `${levelFromXp(profile.xp).nextXp! - profile.xp} XP avant le niveau suivant`
                  : "Niveau maximum atteint — Legendary Otaku"}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl">
        <MediaRail
          title="En tendance"
          subtitle="Ce que la communauté regarde en ce moment"
          media={trending.data?.media}
          loading={trending.isLoading}
          error={trending.error as Error | null}
          moreTo="/anime"
        />

        <MediaRail
          title={`Saison ${season.toLowerCase()} ${year}`}
          subtitle="Les animes diffusés actuellement"
          media={seasonal.data?.media}
          loading={seasonal.isLoading}
          error={seasonal.error as Error | null}
          moreTo="/anime"
        />

        {user && recoGenres.length > 0 && (
          <MediaRail
            title="Parce que vous avez aimé…"
            subtitle={`D'après vos genres préférés : ${recoGenres.slice(0, 3).join(", ")}`}
            media={reco.data}
            loading={reco.isLoading}
            error={reco.error as Error | null}
            emptyLabel="Ajoutez des genres préférés dans vos paramètres pour affiner les suggestions."
          />
        )}

        {user && recoGenres.length === 0 && (
          <section className="px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold">Personnalisez vos recommandations</h2>
                <p className="text-xs text-muted-foreground">
                  Choisissez vos genres préférés pour débloquer la section « Parce que vous avez
                  aimé… ».
                  {lastFavorite?.title ? ` Dernier favori : ${lastFavorite.title}.` : ""}
                </p>
              </div>
              <Button asChild className="min-h-11">
                <Link to="/settings">Configurer</Link>
              </Button>
            </div>
          </section>
        )}

        <MediaRail
          title="Top animes"
          subtitle="Les mieux notés de tous les temps"
          media={topAnime.data?.media}
          loading={topAnime.isLoading}
          error={topAnime.error as Error | null}
          moreTo="/anime"
        />

        <MediaRail
          title="Mangas populaires"
          media={popularManga.data?.media}
          loading={popularManga.isLoading}
          error={popularManga.error as Error | null}
          moreTo="/manga"
        />

        <MediaRail
          title="Manhwa & Webtoons"
          subtitle="La vague coréenne"
          media={webtoons.data?.media}
          loading={webtoons.isLoading}
          error={webtoons.error as Error | null}
          moreTo="/manga"
        />

        <section className="px-4 py-6 md:px-6">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold md:text-xl">
              <TrendingUp className="size-5 text-primary" /> Actualités otaku
            </h2>
            <Link to="/news" className="text-xs font-semibold text-accent">
              Tout voir
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {news.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
              ))}
            {news.data?.map((a) => (
              <Link
                key={a.slug}
                to="/news/$slug"
                params={{ slug: a.slug }}
                className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
              >
                <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
                  {a.category}
                </span>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {stripMarkup(a.summary)}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString("fr-FR")} · {a.reading_minutes} min de
                  lecture
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
