// Eljárásos domborzat: nincs külső modell vagy textúra, minden a kódból épül.

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function noise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function fbm(x, z, octaves) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += (noise(x * freq, z * freq) - 0.5) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// A falu és az oda vezető ösvény teljesen sík, a völgy pereme hegyekbe fut.
export function groundY(x, z) {
  const rolling = fbm(x * 0.013, z * 0.013, 4) * 17;
  const detail = fbm(x * 0.075, z * 0.075, 2) * 1.4;
  const flat = smoothstep(34, 58, Math.hypot(x, z + 16));
  const rim = smoothstep(64, 104, Math.hypot(x, z)) * 26;
  return (rolling + detail) * flat + rim;
}

export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}