export function OtakuLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
        <span className="font-display text-base leading-none font-extrabold">O</span>
        <span className="absolute -right-0.5 -bottom-0.5 rounded bg-accent px-1 text-[8px] leading-tight font-black text-accent-foreground">
          X
        </span>
      </span>
      {!compact && (
        <span className="font-display text-base leading-none font-extrabold tracking-tight">
          <span className="text-gradient-otaku">OtakuVerse</span>
          <span className="text-accent"> X</span>
        </span>
      )}
    </span>
  );
}
