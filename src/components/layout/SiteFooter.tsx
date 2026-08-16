import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { OtakuLogo } from "@/components/layout/OtakuLogo";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border bg-surface/60 pb-24 lg:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <OtakuLogo />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              La plateforme otaku qui rassemble fiches anime, manga, calendrier de diffusion,
              actualités et communauté — sans jamais héberger de contenu protégé.
            </p>
          </div>

          <nav aria-label="Découvrir">
            <h3 className="text-sm font-semibold">Découvrir</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/explore" className="hover:text-foreground">Explorer</Link></li>
              <li><Link to="/anime" className="hover:text-foreground">Anime</Link></li>
              <li><Link to="/manga" className="hover:text-foreground">Manga & Webtoon</Link></li>
              <li><Link to="/calendar" className="hover:text-foreground">Calendrier</Link></li>
            </ul>
          </nav>

          <nav aria-label="Communauté">
            <h3 className="text-sm font-semibold">Communauté</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><Link to="/community" className="hover:text-foreground">Feed</Link></li>
              <li><Link to="/news" className="hover:text-foreground">Actualités</Link></li>
              <li><Link to="/my-list" className="hover:text-foreground">Ma liste</Link></li>
              <li><Link to="/favorites" className="hover:text-foreground">Favoris</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldCheck className="size-4 text-accent" /> Droits d&apos;auteur
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              OtakuVerse X n&apos;héberge, ne diffuse et ne distribue aucun épisode, scan, chapitre,
              film ou série. Seules des métadonnées publiques (AniList, Jikan) et des résumés
              originaux sont affichés, avec attribution des sources. Toute future fonctionnalité de
              visionnage utilisera exclusivement des sources légales et licenciées.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OtakuVerse X — Métadonnées : AniList & Jikan.</p>
          <p>
            Créé par <span className="font-semibold tracking-wide text-foreground">HAEN</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
