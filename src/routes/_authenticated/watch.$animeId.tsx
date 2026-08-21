import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Crown, Loader2, Lock, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { getWatchInfo } from "@/lib/watch.functions";

export const Route = createFileRoute("/_authenticated/watch/$animeId")({
  head: () => ({
    meta: [
      { title: "Lecture — OtakuVerse X" },
      { name: "description", content: "Regarde tes anime préférés en streaming sur OtakuVerse X Premium." },
      { property: "og:title", content: "Lecture — OtakuVerse X" },
      { property: "og:description", content: "Regarde tes anime préférés en streaming sur OtakuVerse X Premium." },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { animeId } = useParams({ from: "/watch/$animeId" }) as { animeId: string };
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [episode, setEpisode] = useState(1);
  const getInfo = useServerFn(getWatchInfo);

  const info = useQuery({
    queryKey: ["watch-info", animeId, episode],
    queryFn: () => getInfo({ data: { animeId: Number(animeId), episode } }),
  });

  useEffect(() => {
    if (videoRef.current && info.data?.sourceUrl) {
      videoRef.current.load();
    }
  }, [info.data?.sourceUrl]);

  if (info.isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!info.data?.hasPremium) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Lock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Premium requis</h1>
        <p className="text-muted-foreground mb-6">Passe Premium pour regarder cet anime en streaming.</p>
        <Button onClick={() => navigate({ to: "/premium" })}>
          <Crown className="mr-2 h-4 w-4" /> Devenir Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">{info.data.title}</h1>

      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        {info.data.sourceUrl ? (
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            poster={info.data.coverImage ?? undefined}
          >
            <source src={info.data.sourceUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-6">
            <div>
              <Play className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Lecteur prêt — source non disponible dans cette démo.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-2">Épisodes</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(info.data.totalEpisodes ?? 12, 24) }, (_, i) => i + 1).map((ep) => (
                <Button
                  key={ep}
                  variant={ep === episode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEpisode(ep)}
                >
                  Ép. {ep}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">Sources officielles</h2>
            {info.data.externalLinks?.length ? (
              info.data.externalLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">
                  {link.site}
                </a>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune source officielle listée.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
