import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CHAPTERS } from '@/game/content';

export default function IntroSequence({ paragraphs, onDone }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        setIndex((i) => (i < paragraphs.length - 1 ? i + 1 : i));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paragraphs.length]);

  useEffect(() => {
    if (index === paragraphs.length - 1) return undefined;
    return undefined;
  }, [index, paragraphs.length]);

  const advance = () => {
    if (index < paragraphs.length - 1) setIndex(index + 1);
    else onDone();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-veil/95 px-8">
      <p className="text-[11px] uppercase tracking-[0.5em] text-ember/70">1. fejezet</p>
      <h2 className="mt-4 text-center font-heading text-2xl tracking-[0.2em] text-veil-foreground/90 sm:text-3xl">
        {CHAPTERS[1].title.toUpperCase()}
      </h2>

      <div className="mt-14 flex min-h-[9rem] max-w-2xl items-start justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-body text-base leading-relaxed text-veil-foreground/85 sm:text-lg"
          >
            {paragraphs[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex items-center gap-2">
        {paragraphs.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? 'w-6 bg-ember' : 'w-1.5 bg-veil-foreground/25'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={advance}
        className="mt-10 font-heading text-xs uppercase tracking-[0.3em] text-veil-foreground/70 transition hover:text-ember"
      >
        {index < paragraphs.length - 1 ? 'Tovább' : 'Belépés a völgybe'}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="mt-4 text-[11px] tracking-[0.2em] text-veil-foreground/35 transition hover:text-veil-foreground/70"
      >
        Bevezető kihagyása
      </button>
    </div>
  );
}