import { motion } from 'framer-motion';

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m} perc ${String(s % 60).padStart(2, '0')} másodperc`;
}

export default function PauseMenu({ saving, savedAt, playtime, onResume, onSave, onQuit }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-veil/75 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md rounded-xl border border-ember/25 bg-veil/95 p-8 text-center shadow-2xl"
      >
        <p className="text-[10px] uppercase tracking-[0.45em] text-ember/75">Szünet</p>
        <h2 className="mt-3 font-heading text-2xl tracking-[0.14em] text-veil-foreground/90">VILÁGOK KÖZE</h2>
        <p className="mt-4 font-body text-xs text-veil-foreground/50">Eljátszott idő: {formatTime(playtime)}</p>

        <div className="mt-9 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="rounded-full bg-ember px-8 py-3 font-heading text-xs uppercase tracking-[0.3em] text-ember-foreground transition hover:bg-ember/90"
          >
            Folytatás
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-full border border-ember/35 px-8 py-3 font-heading text-xs uppercase tracking-[0.3em] text-veil-foreground/85 transition hover:border-ember hover:text-ember disabled:opacity-50"
          >
            {saving ? 'Mentés…' : 'Mentés'}
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="rounded-full px-8 py-3 font-heading text-[11px] uppercase tracking-[0.28em] text-veil-foreground/45 transition hover:text-veil-foreground/80"
          >
            Vissza a főmenübe
          </button>
        </div>

        <p className="mt-7 text-[11px] tracking-[0.16em] text-veil-foreground/40">
          {savedAt
            ? `Utolsó mentés: ${savedAt.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`
            : 'A haladásod automatikusan mentődik.'}
        </p>
      </motion.div>
    </div>
  );
}