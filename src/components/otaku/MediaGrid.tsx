import { MediaCard, MediaCardSkeleton } from "@/components/otaku/MediaCard";
import { EmptyState, ErrorState } from "@/components/otaku/EmptyState";
import type { MediaListItem } from "@/lib/anilist";

export function MediaGrid({
  media,
  loading,
  error,
  emptyTitle = "Aucun résultat",
  emptyDescription = "Essayez d'ajuster vos filtres ou votre recherche.",
  onRetry,
}: {
  media: MediaListItem[] | undefined;
  loading?: boolean;
  error?: Error | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
}) {
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!media || media.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {media.map((m, i) => (
        <MediaCard key={`${m.id}-${i}`} media={m} eager={i < 6} />
      ))}
    </div>
  );
}
