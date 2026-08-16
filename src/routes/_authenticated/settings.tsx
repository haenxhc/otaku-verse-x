import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAuth, useMyProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ANIME_GENRES } from "@/lib/anilist";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Paramètres — OtakuVerse X" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[] | null>(null);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile) return <div className="mx-auto max-w-2xl px-4 py-10"><div className="h-40 animate-pulse rounded-2xl bg-surface-2" /></div>;

  const currentGenres = genres ?? profile.favorite_genres;

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName ?? profile!.display_name,
        bio: bio ?? profile!.bio,
        avatar_url: avatar ?? profile!.avatar_url,
        favorite_genres: currentGenres,
        is_public: isPublic ?? profile!.is_public,
      })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profil mis à jour");
  }

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear();
    window.location.href = "/";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      <h1 className="text-2xl font-extrabold md:text-3xl">Paramètres</h1>

      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div>
          <label htmlFor="dn" className="text-sm font-medium">Nom affiché</label>
          <input
            id="dn"
            value={displayName ?? profile.display_name ?? ""}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="bio" className="text-sm font-medium">Bio</label>
          <textarea
            id="bio"
            rows={3}
            value={bio ?? profile.bio ?? ""}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            className="mt-1 w-full resize-none rounded-xl border border-border bg-surface-2 p-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="avatar" className="text-sm font-medium">URL de l&apos;avatar</label>
          <input
            id="avatar"
            type="url"
            value={avatar ?? profile.avatar_url ?? ""}
            onChange={(e) => setAvatar(e.target.value)}
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Genres préférés (recommandations)</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ANIME_GENRES.map((g) => {
              const on = currentGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setGenres(on ? currentGenres.filter((x) => x !== g) : [...currentGenres, g])
                  }
                  className={`min-h-10 rounded-full border px-3 text-xs font-semibold ${
                    on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface-2"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic ?? profile.is_public}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="size-4"
          />
          Profil public
        </label>

        <Button className="min-h-12 w-full" disabled={busy} onClick={() => void save()}>
          Enregistrer
        </Button>
      </div>

      <Button variant="secondary" className="mt-4 min-h-12 w-full" onClick={() => void signOut()}>
        Se déconnecter
      </Button>
    </div>
  );
}
