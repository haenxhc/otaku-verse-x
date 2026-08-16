import { Link } from "@tanstack/react-router";
import { Compass, Home, ListVideo, Newspaper, Users } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/explore", label: "Explorer", icon: Compass },
  { to: "/calendar", label: "Calendrier", icon: Newspaper },
  { to: "/community", label: "Communauté", icon: Users },
  { to: "/my-list", label: "Ma liste", icon: ListVideo },
] as const;

export function MobileNav() {
  return (
    <nav
      className="surface-panel fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navigation principale"
    >
      <ul className="flex items-stretch justify-between px-1">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
