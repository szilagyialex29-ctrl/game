export default function ObjectiveCard({ chapterTitle, objective }) {
  return (
    <div className="pointer-events-none max-w-[16rem] rounded-lg border border-ember/20 bg-veil/70 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.32em] text-ember/75">1. fejezet</p>
      <p className="mt-1 font-heading text-[11px] tracking-[0.14em] text-veil-foreground/70">
        {chapterTitle.toUpperCase()}
      </p>
      <div className="my-2 h-px w-full bg-ember/15" />
      <p className="font-body text-sm leading-snug text-veil-foreground/90">{objective?.text}</p>
      {objective?.counter && (
        <p className="mt-2 font-heading text-xs tracking-[0.2em] text-ember">
          {objective.counter}
        </p>
      )}
    </div>
  );
}