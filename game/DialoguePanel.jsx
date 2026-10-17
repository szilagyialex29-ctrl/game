import { motion } from 'framer-motion';

export default function DialoguePanel({ npc, node, onChoose }) {
  const choices = node?.choices?.length ? node.choices : [{ label: 'Rendben.', end: true }];

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-2xl rounded-xl border border-ember/25 bg-veil/90 p-6 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-baseline gap-3">
          <p className="font-heading text-sm tracking-[0.18em] text-ember">{npc?.name}</p>
          <p className="text-[11px] tracking-[0.14em] text-veil-foreground/45">{npc?.title}</p>
        </div>
        <p className="mt-4 font-body text-[15px] leading-relaxed text-veil-foreground/90">{node?.text}</p>
        <div className="mt-6 flex flex-col gap-2">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => onChoose(choice)}
              className="rounded-lg border border-ember/20 bg-veil/60 px-4 py-2.5 text-left font-body text-sm text-veil-foreground/85 transition hover:border-ember/60 hover:bg-ember/10 hover:text-veil-foreground"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}