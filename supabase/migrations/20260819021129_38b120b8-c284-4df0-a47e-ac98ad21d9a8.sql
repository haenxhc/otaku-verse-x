-- profiles: honour is_public
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT
  USING (is_public OR auth.uid() = id);

-- owner or public-profile visibility for user library data
DROP POLICY IF EXISTS favorites_read ON public.favorites;
CREATE POLICY favorites_read ON public.favorites FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = favorites.user_id AND p.is_public));

DROP POLICY IF EXISTS watchlists_read ON public.watchlists;
CREATE POLICY watchlists_read ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = watchlists.user_id AND p.is_public));

DROP POLICY IF EXISTS reading_lists_read ON public.reading_lists;
CREATE POLICY reading_lists_read ON public.reading_lists FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = reading_lists.user_id AND p.is_public));

DROP POLICY IF EXISTS ratings_read ON public.ratings;
CREATE POLICY ratings_read ON public.ratings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = ratings.user_id AND p.is_public));

DROP POLICY IF EXISTS user_achievements_read ON public.user_achievements;
CREATE POLICY user_achievements_read ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_achievements.user_id AND p.is_public));

-- social graph: signed-in users only
DROP POLICY IF EXISTS follows_read ON public.follows;
CREATE POLICY follows_read ON public.follows FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.follows FROM anon;

DROP POLICY IF EXISTS likes_read ON public.likes;
CREATE POLICY likes_read ON public.likes FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.likes FROM anon;

-- SECURITY DEFINER functions: no direct public/API execution beyond what is needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.sync_comment_counts() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.sync_like_counts() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.award_xp(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.award_xp(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;