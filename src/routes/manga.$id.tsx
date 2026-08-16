import { createFileRoute } from "@tanstack/react-router";

import { MediaDetailView } from "@/components/otaku/MediaDetailView";

export const Route = createFileRoute("/manga/$id")({
  head: () => ({
    meta: [
      { title: "Fiche manga — OtakuVerse X" },
      { name: "description", content: "Résumé, auteurs, chapitres, notes et titres similaires." },
      { property: "og:title", content: "Fiche manga — OtakuVerse X" },
      { property: "og:description", content: "Résumé, auteurs, chapitres, notes et titres similaires." },
    ],
  }),
  component: MangaDetail,
});

function MangaDetail() {
  const { id } = Route.useParams();
  return <MediaDetailView id={Number(id)} type="MANGA" />;
}
