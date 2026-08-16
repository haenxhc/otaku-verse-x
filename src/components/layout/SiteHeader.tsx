import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogIn, Menu, Search, Shield, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, useIsAdmin, useMyProfile } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useCommunity";
import { levelFromXp } from "@/lib/gamification";
import { OtakuLogo } from "@/components/layout/OtakuLogo";

const NAV_LINKS = [
  { to: "/explore", label: "Explorer" },
  { to: "/anime", label: "Anime" },
  { to: "/manga", label: "Manga" },
  { to: "/calendar", label: "Calendrier" },
  { to: "/news", label: "Actualités" },
  { to: "/community", label: "Communauté" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const { data: roles } = useIsAdmin();
  const { data: unread } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors ${
        scrolled ? "surface-panel border-b" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 md:h-16 md:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-surface">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mt-2 px-4">
              <OtakuLogo />
            </div>
            <nav className="mt-6 flex flex-col gap-1 px-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-base font-medium hover:bg-surface-2"
                  activeProps={{ className: "bg-surface-2 text-primary" }}
                >
                  {l.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link
                to="/my-list"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium hover:bg-surface-2"
              >
                Ma liste
              </Link>
              <Link
                to="/favorites"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium hover:bg-surface-2"
              >
                Favoris
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium hover:bg-surface-2"
              >
                Paramètres
              </Link>
              {roles?.isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-accent hover:bg-surface-2"
                >
                  <Shield className="size-4" /> Administration
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="mr-1 shrink-0">
          <OtakuLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form
          className="ml-auto hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            if (term.trim().length > 0) void navigate({ to: "/search", search: { q: term.trim() } });
          }}
        >
          <Search className="size-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher un anime, manga…"
            aria-label="Rechercher"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label="Recherche">
            <Link to="/search">
              <Search className="size-5" />
            </Link>
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative" aria-label="Notifications">
                <Link to="/notifications">
                  <Bell className="size-5" />
                  {(unread ?? 0) > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                  )}
                </Link>
              </Button>
              <Link
                to="/profile/$username"
                params={{ username: profile?.username ?? "" }}
                className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="size-7 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-surface-2">
                    <User className="size-4" />
                  </span>
                )}
                <span className="hidden text-xs sm:block">
                  <span className="block leading-tight font-semibold">{profile?.username ?? "…"}</span>
                  <span className="block text-[10px] leading-tight text-accent">
                    {levelFromXp(profile?.xp ?? 0).name}
                  </span>
                </span>
              </Link>
            </>
          ) : (
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/login">
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
      <span className="sr-only">
        <Sparkles className="size-3" />
      </span>
    </header>
  );
}
