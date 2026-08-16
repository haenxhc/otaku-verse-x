
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.media_kind AS ENUM ('anime','manga','character');
CREATE TYPE public.list_status AS ENUM ('planning','current','completed','dropped','paused');

-- helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  favorite_genres TEXT[] NOT NULL DEFAULT '{}',
  xp INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base TEXT; final TEXT; n INT := 0;
BEGIN
  base := lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'otaku'), '[^a-z0-9_]', '', 'g'));
  IF base = '' THEN base := 'otaku'; END IF;
  final := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final) LOOP
    n := n + 1; final := base || n::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (NEW.id, final, COALESCE(NEW.raw_user_meta_data->>'display_name', final), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  media_type public.media_kind NOT NULL,
  media_id INTEGER NOT NULL,
  title TEXT,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_type, media_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT SELECT ON public.favorites TO anon;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_read" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "favorites_write_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- WATCHLISTS (anime)
CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  title TEXT,
  cover_image TEXT,
  total_episodes INTEGER,
  status public.list_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, anime_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT SELECT ON public.watchlists TO anon;
GRANT ALL ON public.watchlists TO service_role;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlists_read" ON public.watchlists FOR SELECT USING (true);
CREATE POLICY "watchlists_write_own" ON public.watchlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_watchlists_updated BEFORE UPDATE ON public.watchlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_watchlists_user_status ON public.watchlists(user_id, status);

-- READING LISTS (manga)
CREATE TABLE public.reading_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  manga_id INTEGER NOT NULL,
  title TEXT,
  cover_image TEXT,
  total_chapters INTEGER,
  status public.list_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, manga_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_lists TO authenticated;
GRANT SELECT ON public.reading_lists TO anon;
GRANT ALL ON public.reading_lists TO service_role;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_lists_read" ON public.reading_lists FOR SELECT USING (true);
CREATE POLICY "reading_lists_write_own" ON public.reading_lists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_reading_lists_updated BEFORE UPDATE ON public.reading_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_reading_lists_user_status ON public.reading_lists(user_id, status);

-- PROGRESS
CREATE TABLE public.watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  episodes_watched INTEGER NOT NULL DEFAULT 0,
  total_episodes INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, anime_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_progress TO authenticated;
GRANT ALL ON public.watch_progress TO service_role;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_progress_own" ON public.watch_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_wp_updated BEFORE UPDATE ON public.watch_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  manga_id INTEGER NOT NULL,
  last_chapter INTEGER NOT NULL DEFAULT 0,
  total_chapters INTEGER,
  marked_read BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, manga_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reading_progress_own" ON public.reading_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_rp_updated BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RATINGS
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  media_type public.media_kind NOT NULL,
  media_id INTEGER NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_type, media_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT SELECT ON public.ratings TO anon;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_read" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "ratings_write_own" ON public.ratings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ratings_updated BEFORE UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  media_type public.media_kind NOT NULL,
  media_id INTEGER NOT NULL,
  title TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 10 AND 8000),
  score SMALLINT CHECK (score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_write_own" ON public.reviews FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reviews_media ON public.reviews(media_type, media_id);

-- POSTS
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  image_url TEXT,
  media_type public.media_kind,
  media_id INTEGER,
  media_title TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) WITH CHECK (true);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON public.comments FOR SELECT USING (is_hidden = false OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_mod" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) WITH CHECK (true);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE INDEX idx_comments_post ON public.comments(post_id, created_at);

-- LIKES
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO anon;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_write_own" ON public.likes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_likes_target ON public.likes(target_type, target_id);

-- FOLLOWS
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_write_own" ON public.follows FOR ALL TO authenticated USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- BADGES / ACHIEVEMENTS
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges_admin" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'general',
  badge_id UUID REFERENCES public.badges ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_read" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "achievements_admin" ON public.achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO authenticated;
GRANT SELECT ON public.user_achievements TO anon;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_read" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "user_achievements_write_own" ON public.user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','profile','review')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_read" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_update_mod" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')) WITH CHECK (true);

-- NEWS
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Anime',
  source_name TEXT,
  source_url TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 2,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read" ON public.news_articles FOR SELECT USING (true);
CREATE POLICY "news_admin" ON public.news_articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MEDIA VIEWS (stats)
CREATE TABLE public.media_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type public.media_kind NOT NULL,
  media_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.media_views TO anon, authenticated;
GRANT SELECT ON public.media_views TO authenticated;
GRANT ALL ON public.media_views TO service_role;
ALTER TABLE public.media_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_views_insert" ON public.media_views FOR INSERT WITH CHECK (true);
CREATE POLICY "media_views_admin_read" ON public.media_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_media_views_type ON public.media_views(media_type, viewed_at DESC);

-- XP function
CREATE OR REPLACE FUNCTION public.award_xp(_amount INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_xp INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount < 0 OR _amount > 500 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  UPDATE public.profiles SET xp = xp + _amount WHERE id = auth.uid() RETURNING xp INTO new_xp;
  RETURN new_xp;
END; $$;
GRANT EXECUTE ON FUNCTION public.award_xp(INTEGER) TO authenticated;

-- counters
CREATE OR REPLACE FUNCTION public.sync_like_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta INT; t TEXT; tid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN delta := 1; t := NEW.target_type; tid := NEW.target_id;
  ELSE delta := -1; t := OLD.target_type; tid := OLD.target_id; END IF;
  IF t = 'post' THEN UPDATE public.posts SET likes_count = GREATEST(0, likes_count + delta) WHERE id = tid;
  ELSE UPDATE public.comments SET likes_count = GREATEST(0, likes_count + delta) WHERE id = tid; END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.sync_like_counts();

CREATE OR REPLACE FUNCTION public.sync_comment_counts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSE UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id; END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.sync_comment_counts();

-- SEED badges / achievements / news
INSERT INTO public.badges (code, name, description, icon, tier) VALUES
('first_steps','Premiers pas','Bienvenue dans OtakuVerse X','sparkles','bronze'),
('binge_watcher','Binge Watcher','10 animes terminés','tv','silver'),
('bookworm','Rat de bibliothèque','10 mangas lus','book-open','silver'),
('social_butterfly','Âme sociale','25 commentaires publiés','message-circle','gold'),
('critic','Critique','10 notes attribuées','star','gold'),
('legend','Légende','Atteindre le niveau Legendary Otaku','crown','platinum');

INSERT INTO public.achievements (code, name, description, xp_reward, target, category, badge_id) VALUES
('add_first_anime','Première fiche','Ajouter un anime à sa liste',25,1,'list',(SELECT id FROM public.badges WHERE code='first_steps')),
('complete_10_anime','10 animes terminés','Terminer 10 animes',150,10,'anime',(SELECT id FROM public.badges WHERE code='binge_watcher')),
('read_10_manga','10 mangas lus','Terminer 10 mangas',150,10,'manga',(SELECT id FROM public.badges WHERE code='bookworm')),
('comment_25','25 commentaires','Publier 25 commentaires',120,25,'community',(SELECT id FROM public.badges WHERE code='social_butterfly')),
('rate_10','10 notes','Noter 10 œuvres',80,10,'rating',(SELECT id FROM public.badges WHERE code='critic')),
('reach_legend','Legendary Otaku','Atteindre 10000 XP',500,10000,'level',(SELECT id FROM public.badges WHERE code='legend'));

INSERT INTO public.news_articles (slug, title, summary, body, category, source_name, source_url, reading_minutes, image_url) VALUES
('saison-anime-nouveautes','Les nouveautés de la saison animée','Tour d''horizon des séries les plus attendues de la saison, avec leurs studios et dates de diffusion.','Cette sélection éditoriale rassemble les titres de la saison en cours. Les métadonnées détaillées (studios, épisodes, diffusion) proviennent d''AniList et de Jikan, consultables directement depuis les fiches anime de la plateforme.','Anime','AniList','https://anilist.co',3,null),
('industrie-studios-japon','Industrie : ce que préparent les studios japonais','Point sur les annonces officielles des studios d''animation et leurs projets à venir.','Résumé éditorial rédigé par l''équipe OtakuVerse X. Aucune reproduction de contenu protégé : seuls des résumés originaux et des liens vers les sources officielles sont proposés.','Studios','OtakuVerse X',null,4,null),
('manga-webtoon-tendances','Manga & Webtoon : les tendances du moment','Les séries qui montent côté manga, manhwa et webtoon, et pourquoi elles séduisent.','Analyse originale basée sur les scores de popularité publics d''AniList. Retrouvez chaque titre cité dans la section Manga.','Manga','AniList','https://anilist.co',3,null),
('jeux-video-adaptations','Jeux vidéo : les adaptations anime à suivre','Les adaptations de jeux en anime et les jeux tirés de licences populaires.','Sélection éditoriale. Les liens renvoient uniquement vers des sources officielles et légales.','Jeux vidéo','OtakuVerse X',null,2,null),
('evenements-conventions','Événements & conventions otaku','Le calendrier des conventions et événements majeurs de la culture otaku.','Informations pratiques compilées à partir des communications officielles des organisateurs.','Événements','OtakuVerse X',null,2,null),
('japon-culture','Japon : culture pop et société','Ce que la pop culture japonaise dit de la société contemporaine.','Chronique originale de la rédaction OtakuVerse X.','Japon','OtakuVerse X',null,5,null);
