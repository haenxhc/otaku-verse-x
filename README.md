# OtakuVerse Hub

Construis OtakuVerse X — plateforme Otaku complète, moderne, mobile-first, créée par HAEN. Prends en charge toute l'implémentation réelle, pas une maquette : pages, navigation, données, états, formulaires, auth, Supabase, APIs publiques autorisées, sécurité et responsive. Utilise le stack Lovable par défaut (TypeScript + Tailwind + shadcn/ui). Identité visuelle premium anime/Otaku, sombre, élégante, rapide et tactile.

À implémenter immédiatement :
1. Fiches Anime : poster, bannière, titres alternatifs, synopsis, genres, score, popularité, épisodes, durée, studio, producteurs, saison, année, statut, personnages, staff, relations, similaires, recommandations ; actions favoris, ma liste, regardé, note.
2. Fiches Manga/Manhwa/Webtoon : couverture, titres, synopsis, auteur, artiste, genres, statut, chapitres si l'API les fournit, score, popularité, date, similaires ; progression dernier chapitre, pourcentage, marqué lu.
3. Calendrier dynamique Lundi-Dimanche avec Aujourd'hui/Demain/Cette semaine/Prochainement et sorties API.
4. Actualités Otaku : Anime, Manga, Japon, Jeux vidéo, Industrie, Studios, Événements ; cartes avec image, titre, résumé, date, catégorie, source, temps de lecture. Ne jamais copier automatiquement du contenu protégé ; afficher seulement des données/résumés autorisés et attribution des sources.
5. Supabase Auth : inscription, connexion, déconnexion, mot de passe oublié, profil, préparation Google OAuth.
6. Supabase pour les données propres à la plateforme : profiles, favorites, watchlists, reading_lists, watch_progress, reading_progress, ratings, reviews, posts, comments, likes, follows, notifications, badges, achievements, user_achievements, reports. Relations, index, RLS et policies correctes. Ne pas répliquer inutilement tout AniList.
7. Favoris Anime/Manga/Personnages + page Favoris.
8. Ma liste : Anime à regarder/en cours/terminés/abandonnés ; Manga à lire/en cours/terminés/abandonnés ; synchronisation Supabase.
9. Communauté : feed moderne, publications, likes, commentaires/réponses, follow, profils, notifications, signalements.
10. Gamification : XP, niveaux, badges, achievements. Niveaux : Otaku Novice, Otaku, Otaku Confirmé, Otaku Expert, Otaku Elite, Legendary Otaku. XP pour ajouts, complétions, lectures, commentaires, publications, notes, participation.
11. Recommandations basées sur genres préférés, notes, historique, favoris, listes, anime terminés et manga lus. Section « Parce que vous avez aimé... » et architecture prête pour une IA future.
12. Notifications : nouveau contenu, nouvel épisode, nouveau chapitre si disponible, likes, commentaires, réponses, abonnés, actualités importantes.
13. /admin protégé : utilisateurs, publications, commentaires, signalements, articles, badges, notifications, modération, statistiques utilisateurs/actifs/publications/commentaires/anime consultés/manga consultés avec graphiques.
14. Sécurité : Auth, RLS, validation, protection XSS, routes protégées, admin, secrets uniquement côté serveur/env. Crée .env.example avec placeholders seulement.
15. Copyright : aucun hébergement/distribution illégale d'épisodes, scans, mangas, chapitres, films ou séries ; aucune source illégale. Toute future fonctionnalité streaming doit utiliser du contenu légal/licencié ou liens officiellement autorisés.
16. Routes fonctionnelles : /, /explore, /anime, /anime/[id], /manga, /manga/[id], /calendar, /news, /news/[id], /community, /profile/[username], /my-list, /favorites, /search, /login, /register, /settings, /admin. Aucun bouton important décoratif.
17. Mobile-first prioritaire : gros contrôles tactiles, navigation mobile, admin responsive, formulaires mobiles, aucun débordement, images optimisées.
18. Performance : lazy loading, optimisation images, cache, pagination, code splitting, requêtes API optimisées, éviter requêtes inutiles.
19. APIs : intégrer proprement AniList comme source principale des métadonnées anime/manga et Jikan comme source complémentaire/fallback lorsque pertinent. Centraliser les services API, gérer loading/error/empty states et ne pas exposer de secrets. Ne pas inventer de données lorsque l'API ne les fournit pas.
20. Tests/qualité : TypeScript sans erreurs, routes vérifiées, API, Auth, RLS, formulaires, responsive mobile/desktop et build. Corrige les erreurs trouvées. Pas de TODO pour les fonctionnalités importantes.
21. GitHub : README.md, .gitignore, .env.example avec présentation, installation, technologies, AniList, Jikan, Supabase, variables, lancement, build, déploiement. Aucun secret committé.
22. ZIP : créer scripts/create-zip.js ou équivalent et npm run zip générant OTAKUVERSE-X-HAEN.zip, incluant source, composants, pages, services API, hooks, migrations Supabase, README, package.json, .env.example, mais excluant node_modules, vrais .env, clés API, mots de passe et secrets.
23. Déploiement préparé pour Lovable, GitHub, Vercel, Netlify et Vibe Host.

Important : construis réellement le projet et son backend. Utilise Supabase si nécessaire. Si la configuration OAuth/variables externes nécessite une action manuelle, prépare toute l'architecture et indique clairement les valeurs à renseigner sans jamais inventer de secrets. Priorité à une expérience réellement utilisable sur téléphone. Ajoute le nom de créateur HAEN dans le branding/footer de manière sobre. Commence par l'architecture complète puis implémente tout ce qui est possible dans ce projet, en corrigeant les erreurs avant de terminer.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eba03a14-7e1a-4c03-9f5b-9aff1af037cb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
