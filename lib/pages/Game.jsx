const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef, useState } from 'react';

import GameEngine from '@/game/engine';
import {
  BEACONS,
  CHAPTERS,
  NPCS,
  PLAYER_NAME,
  SHARDS,
  SPAWN,
  getDialogueNode,
  getDialogueStart,
  getJournal,
  getObjective,
} from '@/game/content';
import TitleScreen from '@/components/game/TitleScreen';
import IntroSequence from '@/components/game/IntroSequence';
import Hud from '@/components/game/Hud';
import DialoguePanel from '@/components/game/DialoguePanel';
import QuestJournal from '@/components/game/QuestJournal';
import PauseMenu from '@/components/game/PauseMenu';
import NoticeToast from '@/components/game/NoticeToast';

const EMPTY_PROGRESS = { flags: [], beacons: [], shards: [] };
const CHAPTER = CHAPTERS[1];

export default function Game() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const progressRef = useRef(EMPTY_PROGRESS);
  const saveRef = useRef(null);
  const startedRef = useRef(false);
  const playtimeRef = useRef(0);
  const noticeTimer = useRef(null);

  const [phase, setPhase] = useState('title');
  const [hasSave, setHasSave] = useState(false);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [dialogue, setDialogue] = useState(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [playtime, setPlaytime] = useState(0);

  const overlayOpen = Boolean(dialogue) || journalOpen || paused;

  const showNotice = (text, ms = 6000) => {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), ms);
  };

  const updateProgress = (fn) => {
    const next = fn(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    return next;
  };

  const applyEffects = (effects) => {
    if (!effects?.length) return;
    updateProgress((p) => {
      const flags = [...p.flags];
      effects.forEach((f) => {
        if (!flags.includes(f)) flags.push(f);
      });
      return { ...p, flags };
    });
  };

  const handleInteract = ({ kind, id }) => {
    const engine = engineRef.current;
    const state = progressRef.current;

    if (kind === 'npc') {
      const startId = getDialogueStart(id, state.flags, state.beacons);
      const node = startId ? getDialogueNode(id, startId) : null;
      if (!node) return;
      setDialogue({ npcId: id, nodeId: startId, node });
      applyEffects(node.effects);
      return;
    }

    if (kind === 'beacon') {
      if (state.beacons.includes(id)) return;
      if (!state.flags.includes('met_fatyol')) {
        showNotice('A kőtál hideg. Előbb beszélned kell valakivel, aki ismeri a régi fényt.');
        return;
      }
      const def = BEACONS.find((b) => b.id === id);
      updateProgress((p) => ({ ...p, beacons: [...p.beacons, id] }));
      engine?.setBeaconLit(id, true);
      showNotice(`Meggyúlt a ${def?.name || 'jelzőtűz'}. A fény végigfut a völgy peremén.`);
      return;
    }

    if (kind === 'shard') {
      if (state.shards.includes(id)) return;
      const def = SHARDS.find((s) => s.id === id);
      updateProgress((p) => ({ ...p, shards: [...p.shards, id] }));
      engine?.collectShard(id);
      showNotice(`${def.title} — „${def.text}”`, 11000);
    }
  };

  // ---- indítás: mentés betöltése ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await db.auth.me();
        const page = await db.entities.SaveGame.filter(
          { created_by_id: me.id },
          { sort: '-updated_date', limit: 1 }
        );
        const found = page?.items?.[0] || null;
        if (!cancelled && found) {
          saveRef.current = found;
          setHasSave(true);
        }
      } catch (error) {
        // nincs még mentés – új játékkal indulunk
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- motor ----
  useEffect(() => {
    if (!containerRef.current || engineRef.current) return undefined;
    const engine = new GameEngine(containerRef.current, { onInteract: handleInteract });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setMode(phase === 'title' ? 'title' : 'play');
    engine.setPaused(phase !== 'play' || overlayOpen);
  }, [phase, overlayOpen]);

  // ---- képkocka-adatok ----
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const id = setInterval(() => {
      const snap = engineRef.current?.getSnapshot();
      if (snap) setSnapshot(snap);
    }, 120);
    return () => clearInterval(id);
  }, [phase]);

  // ---- játékidő ----
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const id = setInterval(() => {
      if (document.hidden) return;
      playtimeRef.current += 1;
      setPlaytime(playtimeRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ---- küldetés-jelölés ----
  useEffect(() => {
    if (phase !== 'play') return;
    const engine = engineRef.current;
    const snap = engine?.getSnapshot();
    const objective = getObjective(
      { flags: progress.flags, beacons: progress.beacons },
      snap ? { x: snap.x, z: snap.z } : null
    );
    engine?.setObjectiveTarget(objective.target ? { x: objective.target.x, z: objective.target.z } : null);
  }, [phase, progress]);

  // ---- mentés ----
  const persist = async (state) => {
    const snap = engineRef.current?.getSnapshot();
    const data = {
      player_name: PLAYER_NAME,
      chapter: 1,
      flags: state.flags,
      beacons: state.beacons,
      shards: state.shards,
      pos_x: snap?.x ?? SPAWN.x,
      pos_y: 0,
      pos_z: snap?.z ?? SPAWN.z,
      rot_y: snap?.yaw ?? 0,
      playtime: Math.round(playtimeRef.current),
    };
    setSaving(true);
    try {
      if (saveRef.current?.id) {
        const updated = await db.entities.SaveGame.update(saveRef.current.id, data);
        saveRef.current = updated || saveRef.current;
      } else {
        saveRef.current = await db.entities.SaveGame.create(data);
      }
      setHasSave(true);
      setSavedAt(new Date());
    } catch (error) {
      showNotice('Most nem sikerült menteni — próbáld újra a szünet menüből.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!startedRef.current) return undefined;
    const id = setTimeout(() => persist(progressRef.current), 500);
    return () => clearTimeout(id);
  }, [progress]);

  // ---- játékmenet ----
  const startNew = () => {
    progressRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    playtimeRef.current = 0;
    setPlaytime(0);
    startedRef.current = false;
    engineRef.current?.setPlayerPosition(SPAWN.x, SPAWN.z, 0);
    setPhase('intro');
  };

  const finishIntro = () => {
    startedRef.current = true;
    setSnapshot(engineRef.current?.getSnapshot() || null);
    setPhase('play');
  };

  const continueGame = () => {
    const saved = saveRef.current;
    if (!saved) return;
    const restored = {
      flags: saved.flags || [],
      beacons: saved.beacons || [],
      shards: saved.shards || [],
    };
    progressRef.current = restored;
    setProgress(restored);
    playtimeRef.current = saved.playtime || 0;
    setPlaytime(playtimeRef.current);
    startedRef.current = true;
    const engine = engineRef.current;
    engine?.setPlayerPosition(saved.pos_x ?? SPAWN.x, saved.pos_z ?? SPAWN.z, saved.rot_y ?? 0);
    engine?.syncProgress(restored);
    engine?.setMode('play');
    setSnapshot(engine?.getSnapshot() || null);
    setPhase('play');
  };

  const quitToTitle = () => {
    setPaused(false);
    setDialogue(null);
    setJournalOpen(false);
    startedRef.current = false;
    engineRef.current?.setMode('title');
    setPhase('title');
  };

  const chooseDialogue = (choice) => {
    if (choice.end || !choice.goto) {
      setDialogue(null);
      return;
    }
    const node = getDialogueNode(dialogue.npcId, choice.goto);
    if (!node) {
      setDialogue(null);
      return;
    }
    applyEffects(node.effects);
    setDialogue({ ...dialogue, nodeId: choice.goto, node });
  };

  // ---- UI billentyűk ----
  useEffect(() => {
    const onKey = (event) => {
      if (phase !== 'play') return;
      if (event.code === 'Escape') {
        event.preventDefault();
        if (dialogue) setDialogue(null);
        else if (journalOpen) setJournalOpen(false);
        else setPaused((v) => !v);
        return;
      }
      if (event.code === 'KeyJ' && !dialogue && !paused) {
        event.preventDefault();
        setJournalOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dialogue, journalOpen, paused]);

  const objective = getObjective(
    { flags: progress.flags, beacons: progress.beacons },
    snapshot ? { x: snapshot.x, z: snapshot.z } : null
  );
  const saveLabel = hasSave
    ? `Mentett haladás · ${(saveRef.current?.beacons || []).length}/${BEACONS.length} jelzőtűz`
    : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-veil">
      <div ref={containerRef} className="absolute inset-0" />

      {phase === 'title' && (
        <TitleScreen onNew={startNew} onContinue={hasSave ? continueGame : null} saveLabel={saveLabel} />
      )}

      {phase === 'intro' && <IntroSequence paragraphs={CHAPTER.intro} onDone={finishIntro} />}

      {phase === 'play' && (
        <Hud
          chapterTitle={CHAPTER.title}
          objective={objective}
          prompt={overlayOpen ? null : snapshot?.prompt}
          snapshot={snapshot}
          onJournal={() => setJournalOpen(true)}
          onPause={() => setPaused(true)}
        />
      )}

      {dialogue && (
        <DialoguePanel
          npc={NPCS.find((n) => n.id === dialogue.npcId)}
          node={dialogue.node}
          onChoose={chooseDialogue}
        />
      )}

      {journalOpen && (
        <QuestJournal
          chapterTitle={CHAPTER.title}
          objective={objective}
          journal={getJournal(progress)}
          shardsTotal={SHARDS.length}
          onClose={() => setJournalOpen(false)}
        />
      )}

      {paused && (
        <PauseMenu
          saving={saving}
          savedAt={savedAt}
          playtime={playtime}
          onResume={() => setPaused(false)}
          onSave={() => persist(progressRef.current)}
          onQuit={quitToTitle}
        />
      )}

      {notice && <NoticeToast text={notice} />}
    </div>
  );
}