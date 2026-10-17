import * as THREE from 'three';
import { groundY, seededRandom } from './terrain.js';
import { VILLAGE } from './content.js';
import { isBlocked } from './layout.js';
import { displacedIcosahedron, addWind, windTime } from './geometry.js';

const GRASS_NEAR = 9000;
const GRASS_FAR = 3000;
const BUSH_COUNT = 150;
const FLOWER_COUNT = 480;

function tuftGeometry() {
  const positions = [];
  const colors = [];
  const indices = [];
  const rand = seededRandom(5150);
  const blades = 3;
  for (let b = 0; b < blades; b += 1) {
    const angle = (b / blades) * Math.PI + rand() * 0.7;
    const h = 0.3 + rand() * 0.32;
    const w = 0.036 + rand() * 0.024;
    const bend = 0.05 + rand() * 0.18;
    const offX = (rand() - 0.5) * 0.14;
    const offZ = (rand() - 0.5) * 0.14;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const place = (lx, ly, lz) => [lx * cos - lz * sin + offX, ly, lx * sin + lz * cos + offZ];
    const verts = [
      place(-w / 2, 0, 0),
      place(w / 2, 0, 0),
      place(w * 0.12, h, bend),
      place(-w * 0.12, h, bend),
    ];
    const start = positions.length / 3;
    verts.forEach((p, i) => {
      positions.push(p[0], p[1], p[2]);
      const shade = i < 2 ? 0.42 : 1;
      colors.push(shade, shade, shade);
    });
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function scatter(rand, count, { minRadius, maxRadius, minGap = 0.35 }) {
  const points = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 40) {
    attempts += 1;
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * (maxRadius - minRadius) + minRadius;
    const x = VILLAGE.x + Math.cos(angle) * radius;
    const z = VILLAGE.z + Math.sin(angle) * radius;
    if (isBlocked(x, z)) continue;
    if (minGap > 0 && points.some((p) => Math.hypot(p.x - x, p.z - z) < minGap)) continue;
    points.push({ x, z, r: rand(), r2: rand(), r3: rand() });
  }
  return points;
}

export function buildVegetation(scene, { leaf }) {
  const rand = seededRandom(20260);
  const disposables = [];

  // --- fű ---
  const tuftGeo = tuftGeometry();
  const grassMat = addWind(
    new THREE.MeshStandardMaterial({
      color: 0x86a04c,
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.88,
      metalness: 0,
    }),
    0.45,
    0.5
  );

  const near = scatter(rand, GRASS_NEAR, { minRadius: 17, maxRadius: 54, minGap: 0 });
  const far = scatter(rand, GRASS_FAR, { minRadius: 54, maxRadius: 94, minGap: 0.6 });
  const blades = near.concat(far);
  const grass = new THREE.InstancedMesh(tuftGeo, grassMat, blades.length);
  grass.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  blades.forEach((p, i) => {
    const s = 0.75 + p.r * 0.85;
    dummy.position.set(p.x, groundY(p.x, p.z) - 0.02, p.z);
    dummy.rotation.set((p.r2 - 0.5) * 0.3, p.r3 * Math.PI * 2, (p.r3 - 0.5) * 0.3);
    dummy.scale.set(s, s * (0.8 + p.r2 * 0.7), s);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(i, tint.setRGB(0.86 + p.r * 0.3, 0.9 + p.r2 * 0.28, 0.7 + p.r3 * 0.34));
  });
  scene.add(grass);
  disposables.push(tuftGeo, grassMat);

  // --- bokrok ---
  const bushGeos = [0, 1, 2].map((i) => displacedIcosahedron(0.62, 1, 0.34, i * 3.7 + 1));
  const bushMesh = bushGeos.map((geo, i) => {
    const mat = addWind(
      new THREE.MeshStandardMaterial({
        color: [0xe8f4cc, 0xdae9be, 0xcadfb2][i],
        map: leaf.map,
        normalMap: leaf.normalMap,
        roughnessMap: leaf.roughnessMap,
        roughness: 1,
        metalness: 0,
      }),
      0.08,
      0.3
    );
    const mesh = new THREE.InstancedMesh(geo, mat, BUSH_COUNT);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    disposables.push(mat);
    return mesh;
  });

  const bushPoints = scatter(rand, BUSH_COUNT * 3, { minRadius: 20, maxRadius: 92, minGap: 5 });
  const bushCounts = [0, 0, 0];
  bushPoints.forEach((p, i) => {
    const variant = i % 3;
    if (bushCounts[variant] >= BUSH_COUNT) return;
    const s = 0.7 + p.r * 0.9;
    dummy.position.set(p.x, groundY(p.x, p.z) + 0.25 * s, p.z);
    dummy.rotation.set((p.r2 - 0.5) * 0.35, p.r3 * Math.PI * 2, (p.r3 - 0.5) * 0.35);
    dummy.scale.set(s, s * (0.75 + p.r2 * 0.5), s);
    dummy.updateMatrix();
    bushMesh[variant].setMatrixAt(bushCounts[variant], dummy.matrix);
    bushCounts[variant] += 1;
  });
  bushMesh.forEach((mesh, i) => {
    mesh.count = bushCounts[i];
    mesh.instanceMatrix.needsUpdate = true;
  });
  disposables.push(...bushGeos);

  // --- virágok ---
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.011, 0.3, 5);
  stemGeo.translate(0, 0.15, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6d8a44, roughness: 0.9 });
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, FLOWER_COUNT);

  const headGeo = new THREE.SphereGeometry(0.035, 7, 6);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf4ead2, roughness: 0.7 });
  const heads = new THREE.InstancedMesh(headGeo, headMat, FLOWER_COUNT);

  const palette = [0xf6ecd4, 0xe9c95e, 0xd8d0e6, 0xdfa2af, 0xf2b46a];
  const flowers = scatter(rand, FLOWER_COUNT, { minRadius: 18, maxRadius: 70, minGap: 1.4 });
  flowers.forEach((p, i) => {
    const y = groundY(p.x, p.z);
    const s = 0.8 + p.r * 0.7;
    dummy.position.set(p.x, y, p.z);
    dummy.rotation.set(0, p.r3 * Math.PI * 2, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, y + 0.3 * s, p.z);
    dummy.scale.setScalar(s * (0.8 + p.r2 * 0.5));
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, tint.setHex(palette[i % palette.length]));
  });
  scene.add(stems, heads);
  disposables.push(stemGeo, stemMat, headGeo, headMat);

  return {
    update(dt) {
      windTime.value += dt;
    },
    dispose() {
      disposables.forEach((d) => d.dispose?.());
    },
  };
}