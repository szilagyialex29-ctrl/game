import { motion } from 'framer-motion';

export default function QuestJournal({ chapterTitle, objective, journal, shardsTotal, onClose }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-veil/70 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl border border-ember/25 bg-veil/95 p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-ember/75">Napló</p>
            <h2 className="mt-2 font-heading text-xl tracking-[0.16em] text-veil-foreground/90">
              1. FEJEZET · {chapterTitle.toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ember/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-veil-foreground/60 transition hover:border-ember hover:text-ember"
          >
            Bezár
          </button>
        </div>

        <div className="mt-7">
          <p className="text-[10px] uppercase tracking-[0.3em] text-veil-foreground/45">Most</p>
          <p className="mt-2 font-body text-sm text-veil-foreground/90">{objective?.text}</p>
        </div>

        <div className="mt-7 space-y-3">
          {journal.steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  step.done ? 'bg-ember' : 'bg-veil-foreground/20'
                }`}
              />
              <p
                className={`font-body text-sm ${
                  step.done ? 'text-veil-foreground/85' : 'text-veil-foreground/45'
                }`}
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-ember/15 pt-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-veil-foreground/45">
            Fénytöredékek · {journal.lore.length}/{shardsTotal}
          </p>
          {journal.lore.length === 0 ? (
            <p className="mt-3 font-body text-sm text-veil-foreground/40">
              Még nem találtál emléket a völgyben. Ahol a fű világosabb, ott érdemes körülnézni.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {journal.lore.map((entry) => (
                <div key={entry.id}>
                  <p className="font-heading text-[11px] tracking-[0.2em] text-ember/85">{entry.title}</p>
                  <p className="mt-1 font-body text-sm italic leading-relaxed text-veil-foreground/75">
                    „{entry.text}”
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}