import { createFileRoute } from "@tanstack/react-router";

import { MediaDetailView } from "@/components/otaku/MediaDetailView";

export const Route = createFileRoute("/anime/$id")({
  head: () => ({
    meta: [
      { title: "Fiche anime — OtakuVerse X" },
      { name: "description", content: "Synopsis, personnages, studios, notes et œuvres liées." },
      { property: "og:title", content: "Fiche anime — OtakuVerse X" },
      { property: "og:description", content: "Synopsis, personnages, studios, notes et œuvres liées." },
    ],
  }),
  component: AnimeDetail,
});

function AnimeDetail() {
  const { id } = Route.useParams();
  return <MediaDetailView id={Number(id)} type="ANIME" />;
}
