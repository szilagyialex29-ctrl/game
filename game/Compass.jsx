const CARDINALS = ['É', 'ÉK', 'K', 'DK', 'D', 'DNy', 'Ny', 'ÉNy'];

export default function Compass({ heading, bearing, distance, hasTarget }) {
  const normalized = ((heading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const cardinal = CARDINALS[Math.round(normalized / (Math.PI / 4)) % 8];
  const rel = hasTarget ? (bearing - heading + Math.PI * 2) % (Math.PI * 2) : 0;
  const degrees = (rel * 180) / Math.PI;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-ember/25 bg-veil/70 backdrop-blur-sm">
        <span className="font-heading text-xs tracking-[0.15em] text-veil-foreground/70">{cardinal}</span>
        {hasTarget && (
          <div
            className="absolute inset-0 flex items-start justify-center transition-transform duration-150 ease-out"
            style={{ transform: `rotate(${degrees}deg)` }}
          >
            <span className="-mt-1.5 block h-3 w-3 rotate-45 border-l-2 border-t-2 border-ember" />
          </div>
        )}
      </div>
      {hasTarget && (
        <span className="text-[11px] tabular-nums tracking-[0.18em] text-veil-foreground/60">
          {Math.round(distance)} m
        </span>
      )}
    </div>
  );
}