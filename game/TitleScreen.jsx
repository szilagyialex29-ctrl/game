import { motion } from 'framer-motion';
import { CHAPTERS } from '@/game/content';
import { cn } from '@/lib/utils';

export default function TitleScreen({ onNew, onContinue, saveLabel }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-veil via-veil/45 to-veil/70" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className="relative w-full max-w-xl text-center"
      >
        <p className="text-[11px] uppercase tracking-[0.55em] text-ember/80">Isekai krónika</p>
        <h1 className="mt-6 font-heading text-5xl tracking-[0.14em] text-veil-foreground sm:text-6xl">
          VILÁGOK KÖZE
        </h1>
        <div className="mx-auto mt-7 h-px w-24 bg-ember/60" />
        <p className="mt-7 font-heading text-sm tracking-[0.28em] text-veil-foreground/75">
          1. FEJEZET · {CHAPTERS[1].title.toUpperCase()}
        </p>

        <div className="mt-14 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onNew}
            className={cn(
              'w-56 rounded-full bg-ember px-8 py-3.5 font-heading text-xs uppercase tracking-[0.3em]',
              'text-ember-foreground shadow-[0_0_40px_-10px_rgba(230,170,80,0.7)]',
              'transition-all duration-300 hover:bg-ember/90 hover:tracking-[0.34em]'
            )}
          >
            Új játék
          </button>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className={cn(
                'w-56 rounded-full border border-ember/40 px-8 py-3.5 font-heading text-xs uppercase tracking-[0.3em]',
                'text-veil-foreground/90 transition-all duration-300 hover:border-ember hover:text-ember'
              )}
            >
              Folytatás
            </button>
          )}
        </div>

        {saveLabel && (
          <p className="mt-5 text-[11px] tracking-[0.2em] text-veil-foreground/40">{saveLabel}</p>
        )}

        <p className="mt-14 text-[11px] leading-relaxed tracking-[0.15em] text-veil-foreground/45">
          WASD — mozgás · Egér — kamera · E — interakció · J — napló · Esc — szünet
        </p>
      </motion.div>
    </div>
  );
}