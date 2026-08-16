import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — OtakuVerse X" },
      { name: "description", content: "Connectez-vous à OtakuVerse X pour synchroniser vos listes, favoris et votre progression." },
      { property: "og:title", content: "Connexion — OtakuVerse X" },
      { property: "og:description", content: "Connectez-vous à OtakuVerse X pour synchroniser vos listes, favoris et votre progression." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bon retour parmi nous !");
        void navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim().toLowerCase() },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre boîte mail si une confirmation est requise.");
        void navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'authentification");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Google impossible pour le moment.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-6">
      <h1 className="text-2xl font-extrabold">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Synchronisez vos listes, favoris, notes et votre progression XP.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <div>
            <label htmlFor="username" className="text-sm font-medium">Pseudo</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_]+"
              className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-sm font-medium">E-mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </div>
        <Button type="submit" className="min-h-12 w-full" disabled={busy}>
          {mode === "login" ? "Se connecter" : "Créer mon compte"}
        </Button>
      </form>

      <Button variant="secondary" className="mt-3 min-h-12 w-full" onClick={() => void google()}>
        Continuer avec Google
      </Button>

      <button
        className="mt-5 w-full text-sm text-accent"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Pas encore de compte ? Inscrivez-vous" : "Déjà membre ? Connectez-vous"}
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        En continuant, vous acceptez de respecter la charte communautaire.{" "}
        <Link to="/" className="text-accent">Retour à l&apos;accueil</Link>
      </p>
    </div>
  );
}
