import Compass from '@/components/game/Compass';
import ObjectiveCard from '@/components/game/ObjectiveCard';
import InteractPrompt from '@/components/game/InteractPrompt';

export default function Hud({ chapterTitle, objective, prompt, snapshot, onJournal, onPause }) {
  const heading = snapshot ? -snapshot.camYaw : 0;
  const hasTarget = Boolean(objective?.target && snapshot);
  const dx = hasTarget ? objective.target.x - snapshot.x : 0;
  const dz = hasTarget ? objective.target.z - snapshot.z : 0;
  const distance = Math.hypot(dx, dz);
  const bearing = Math.atan2(dx, -dz);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <ObjectiveCard chapterTitle={chapterTitle} objective={objective} />
      </div>

      <div className="absolute left-1/2 top-4 -translate-x-1/2 sm:top-6">
        <Compass heading={heading} bearing={bearing} distance={distance} hasTarget={hasTarget} />
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={onJournal}