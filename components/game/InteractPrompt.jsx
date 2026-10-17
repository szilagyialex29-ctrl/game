export default function InteractPrompt({ prompt }) {
  if (!prompt) return null;
  return (
    <div className="pointer-events-none flex items-center gap-3 rounded-full border border-ember/25 bg-veil/75 px-5 py-2 backdrop-blur-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded border border-ember/50 font-heading text-[11px] text-ember">
        E
      </span>
      <span className="font-body text-sm text-veil-foreground/90">
        {prompt.label}
        <span className="text-veil-foreground/50"> — {prompt.name}</span>
      </span>
    </div>
  );
}