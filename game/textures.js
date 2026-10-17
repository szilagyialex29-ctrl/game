import * as THREE from 'three';

// Eljárásos, hézagmentesen ismételhető PBR-textúrák: szín + normál + érdesség.
// Minden felület egyetlen mintavevő függvényből épül, hogy a zajt csak egyszer számoljuk.

function hashInt(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function hashLattice(ix, iz, px, pz) {
  const a = ((ix % px) + px) % px;
  const b = ((iz % pz) + pz) % pz;
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function tnoise(x, z, px, pz) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hashLattice(xi, zi, px, pz);
  const b = hashLattice(xi + 1, zi, px, pz);
  const c = hashLattice(xi, zi + 1, px, pz);
  const d = hashLattice(xi + 1, zi + 1, px, pz);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function tfbm(x, z, px, pz, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (let i = 0; i < octaves; i += 1) {
    sum += (tnoise(x * freq, z * freq, px * freq, pz * freq) - 0.5) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

function dataTexture(data, size, srgb) {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function normalFromHeight(height, size, strength) {
  const data = new Uint8Array(size * size * 4);
  const at = (x, z) => height[(((z % size) + size) % size) * size + (((x % size) + size) % size)];
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const dhx = (at(x + 1, z) - at(x - 1, z)) * strength;
      const dhz = (at(x, z + 1) - at(x, z - 1)) * strength;
      const nx = -dhx;
      const nz = -dhz;
      const len = Math.hypot(nx, nz, 1) || 1;
      const i = (z * size + x) * 4;
      data[i] = Math.round((nx / len * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((nz / len * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  return data;
}

export function makeSurface({ size = 256, periodX = 4, periodZ = 4, normalStrength = 2, sample }) {
  const colorData = new Uint8ClampedArray(size * size * 4);
  const roughData = new Uint8ClampedArray(size * size * 4);
  const heightData = new Float32Array(size * size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * periodX;
      const v = (y / size) * periodZ;
      const index = y * size + x;
      const out = sample(u, v, hashInt(index + 1));
      colorData[index * 4] = clamp255(out[0]);
      colorData[index * 4 + 1] = clamp255(out[1]);
      colorData[index * 4 + 2] = clamp255(out[2]);
      colorData[index * 4 + 3] = 255;
      heightData[index] = out[3];
      const r = clamp255(Math.min(1, Math.max(0, out[4] ?? 0.92)) * 255);
      roughData[index * 4] = r;
      roughData[index * 4 + 1] = r;
      roughData[index * 4 + 2] = r;
      roughData[index * 4 + 3] = 255;
    }
  }

  const map = dataTexture(colorData, size, true);
  const normalMap = dataTexture(normalFromHeight(heightData, size, normalStrength), size, false);
  const roughnessMap = dataTexture(roughData, size, false);

  return {
    map,
    normalMap,
    roughnessMap,
    repeat(rx, ry) {
      [map, normalMap, roughnessMap].forEach((t) => t.repeat.set(rx, ry));
      return this;
    },
    dispose() {
      [map, normalMap, roughnessMap].forEach((t) => t.dispose());
    },
  };
}

// --- felületek: [r, g, b, magasság, érdesség] ---

export function grassSurface() {
  return makeSurface({
    size: 512,
    periodX: 4,
    periodZ: 4,
    normalStrength: 1.5,
    sample: (u, v, rnd) => {
      const big = tfbm(u, v, 4, 4, 3);
      const mid = tfbm(u * 3, v * 3, 12, 12, 2);
      const fine = tfbm(u * 12, v * 12, 48, 48, 2);
      const dry = Math.max(0, big * 2.2 - 0.12);
      const dark = rnd < 0.05 ? 26 : 0;
      return [
        58 + big * 30 + mid * 22 + fine * 26 + dry * 62 - dark,
        80 + big * 30 + mid * 26 + fine * 30 + dry * 42 - dark,
        40 + big * 20 + mid * 16 + fine * 18 + dry * 18 - dark * 0.8,
        0.5 + mid * 1.1 + fine * 0.8,
        0.95,
      ];
    },
  });
}

export function dirtSurface({ size = 256, periodX = 3, periodZ = 3 } = {}) {
  return makeSurface({
    size,
    periodX,
    periodZ,
    normalStrength: 2.1,
    sample: (u, v, rnd) => {
      const big = tfbm(u, v, 3, 3, 3);
      const mid = tfbm(u * 4, v * 4, 12, 12, 2);
      const fine = tfbm(u * 16, v * 16, 48, 48, 2);
      const pebble = tfbm(u * 9, v * 9, 27, 27, 1);
      const k = pebble > 0.26 ? (pebble - 0.26) * 3.4 : 0;
      const dark = rnd < 0.08 ? 22 : 0;
      return [
        126 + big * 30 + mid * 24 + fine * 20 + k * 36 - dark,
        104 + big * 28 + mid * 22 + fine * 20 + k * 34 - dark,
        76 + big * 22 + mid * 18 + fine * 16 + k * 30 - dark,
        0.5 + mid * 0.9 + fine * 0.7 + (pebble > 0.26 ? 0.6 : 0),
        0.97,
      ];
    },
  });
}

export function woodSurface() {
  return makeSurface({
    size: 256,
    periodX: 2,
    periodZ: 6,
    normalStrength: 2.4,
    sample: (u, v) => {
      const row = Math.floor(v) % 6;
      const rowVar = hashInt(row * 31 + 7);
      const grain = tfbm(u * 2, v * 2, 4, 12, 3);
      const knot = tfbm(u * 3, v, 6, 6, 1);
      const gap = Math.min(v - Math.floor(v), Math.floor(v) + 1 - v);
      const base = 92 + rowVar * 34;
      const shadeK = gap < 0.035 ? 0.45 : 1;
      return [
        (base + grain * 34 + knot * 16) * shadeK,
        (base * 0.78 + grain * 26 + knot * 12) * shadeK,
        (base * 0.55 + grain * 18 + knot * 10) * shadeK,
        gap < 0.045 ? 0.08 : 0.55 + grain * 0.6 + knot * 0.3,
        0.88,
      ];
    },
  });
}

export function thatchSurface() {
  return makeSurface({
    size: 256,
    periodX: 4,
    periodZ: 2,
    normalStrength: 2.6,
    sample: (u, v) => {
      const straw = tfbm(u, v * 24, 4, 48, 2);
      const wisp = tfbm(u * 8, v * 4, 32, 8, 2);
      const rowVar = hashInt((Math.floor(v * 4) % 8) * 13 + 3);
      return [
        128 + straw * 42 + rowVar * 36 + wisp * 22,
        104 + straw * 38 + rowVar * 32 + wisp * 20,
        60 + straw * 26 + rowVar * 24 + wisp * 16,
        0.5 + straw * 1.2 + wisp * 0.55,
        0.98,
      ];
    },
  });
}

export function stoneSurface({ size = 256, periodX = 3, periodZ = 3 } = {}) {
  return makeSurface({
    size,
    periodX,
    periodZ,
    normalStrength: 2.3,
    sample: (u, v, rnd) => {
      const big = tfbm(u, v, 3, 3, 3);
      const mid = tfbm(u * 5, v * 5, 15, 15, 2);
      const crack = Math.abs(tfbm(u * 3, v * 3, 9, 9, 2));
      const dark = crack < 0.022 ? 46 : 0;
      const grit = rnd < 0.06 ? -22 : 0;
      return [
        118 + big * 26 + mid * 22 - dark + grit,
        117 + big * 26 + mid * 22 - dark + grit,
        110 + big * 24 + mid * 20 - dark + grit,
        0.5 + mid * 0.9 + (crack < 0.022 ? -0.6 : 0) + rnd * 0.2,
        0.96,
      ];
    },
  });
}

export function barkSurface() {
  return makeSurface({
    size: 256,
    periodX: 1,
    periodZ: 4,
    normalStrength: 3,
    sample: (u, v) => {
      const streak = tfbm(u * 14, v, 14, 4, 3);
      const ridge = Math.abs(tfbm(u * 6, v * 2, 6, 8, 2));
      return [
        74 + streak * 42 + ridge * 32,
        58 + streak * 36 + ridge * 26,
        42 + streak * 26 + ridge * 20,
        0.5 + streak * 1.3 + ridge * 0.7,
        0.97,
      ];
    },
  });
}

export function leafSurface() {
  return makeSurface({
    size: 256,
    periodX: 4,
    periodZ: 4,
    normalStrength: 3.2,
    sample: (u, v) => {
      const clump = tfbm(u * 4, v * 4, 16, 16, 3);
      const clump2 = tfbm(u * 9, v * 9, 36, 36, 2);
      const hue = tfbm(u, v, 4, 4, 2);
      return [
        50 + clump * 46 + clump2 * 28 + hue * 22,
        74 + clump * 44 + clump2 * 30 + hue * 30,
        32 + clump * 26 + clump2 * 16 + hue * 14,
        0.5 + clump * 1.4 + clump2 * 0.9,
        0.94,
      ];
    },
  });
}