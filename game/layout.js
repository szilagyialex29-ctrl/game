import { BEACONS, HUTS, NPCS, SHARDS, SPAWN, VILLAGE, WELL } from './content.js';

// Amit nem szabad benőni: ösvény, falu tér, házak, szereplők, küldetés-pontok.
const ZONES = [
  ...HUTS.map((h) => ({ x: h.x, z: h.z, r: 5.5 })),
  { x: WELL.x, z: WELL.z, r: 3.5 },
  { x: SPAWN.x, z: SPAWN.z, r: 5 },
  ...NPCS.map((n) => ({ x: n.x, z: n.z, r: 4.5 })),
  ...BEACONS.map((b) => ({ x: b.x, z: b.z, r: 4.5 })),
  ...SHARDS.map((s) => ({ x: s.x, z: s.z, r: 3.5 })),
];

export function isBlocked(x, z) {
  if (Math.hypot(x - VILLAGE.x, z - VILLAGE.z) < VILLAGE.radius) return true;
  if (Math.abs(x) < 3.6 && z > -36 && z < 14) return true;
  return ZONES.some((zone) => Math.hypot(zone.x - x, zone.z - z) < zone.r);
}