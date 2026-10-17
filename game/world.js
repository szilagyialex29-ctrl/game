import * as THREE from 'three';
import { groundY, seededRandom } from './terrain.js';
import {
  grassSurface,
  dirtSurface,
  woodSurface,
  thatchSurface,
  stoneSurface,
  barkSurface,
  leafSurface,
} from './textures.js';
import { displacedIcosahedron } from './geometry.js';
import { buildVegetation } from './vegetation.js';
import { isBlocked } from './layout.js';
import { PALETTE, SUN_POSITION, SUN_TARGET, VILLAGE, HUTS, WELL, NPCS, BEACONS, SHARDS } from './content.js';
import { createCharacter } from './character.js';

function glowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.32)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildWorld(scene) {
  const glow = glowTexture();
  const surfaces = [];
  const disposables = [];

  const surface = (s, repeatX, repeatY) => {
    s.repeat(repeatX, repeatY);
    surfaces.push(s);
    return s;
  };

  const grass = surface(grassSurface(), 46, 46);
  const dirt = surface(dirtSurface(), 7, 7);
  const wood = surface(woodSurface(), 2, 1.3);
  const thatch = surface(thatchSurface(), 5, 2);
  const stone = surface(stoneSurface(), 2, 2.4);
  const bark = surface(barkSurface(), 1.4, 2.6);
  const leaf = surface(leafSurface(), 2.5, 2.5);

  const material = (s, scale = 0.9, extra = {}) =>
    new THREE.MeshStandardMaterial({
      map: s.map,
      normalMap: s.normalMap,
      roughnessMap: s.roughnessMap,
      normalScale: new THREE.Vector2(scale, scale),
      roughness: 1,
      metalness: 0,
      ...extra,
    });

  const grassMat = material(grass, 0.7);
  const plazaMat = material(dirt, 1);
  const pathMat = material(dirt, 1.1, { color: 0xb8ada2 });
  const woodMat = material(wood, 1);
  const thatchMat = material(thatch, 1.2);
  const stoneMat = material(stone, 0.95);
  const rockMat = material(stone, 1.15, { color: 0xc9c8c2 });
  const barkMat = material(bark, 1.2);
  const canopyMat = (color) => material(leaf, 1.2, { color });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c231a, roughness: 0.95 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x1e1811,
    emissive: 0xffb457,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });
  disposables.push(
    grassMat,
    plazaMat,
    pathMat,
    woodMat,
    thatchMat,
    stoneMat,
    rockMat,
    barkMat,
    darkMat,
    windowMat
  );

  // --- ég ---
  const skyGeo = new THREE.SphereGeometry(460, 32, 20);
  const zenith = new THREE.Color(PALETTE.zenith);
  const horizon = new THREE.Color(PALETTE.horizon);
  const colors = new Float32Array(skyGeo.attributes.position.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < skyGeo.attributes.position.count; i += 1) {
    v.fromBufferAttribute(skyGeo.attributes.position, i).normalize();
    const c = horizon.clone().lerp(zenith, Math.pow(Math.max(v.y, 0), 0.55));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.frustumCulled = false;
  scene.add(sky);
  disposables.push(skyGeo, sky.material);

  const sunDir = new THREE.Vector3(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z).normalize();
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff2d4, fog: false })
  );
  sunDisc.position.copy(sunDir).multiplyScalar(400);
  scene.add(sunDisc);
  disposables.push(sunDisc.geometry, sunDisc.material);

  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffd9a0,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  sunGlow.scale.set(190, 190, 1);
  sunGlow.position.copy(sunDir).multiplyScalar(400);
  scene.add(sunGlow);

  // --- fények ---
  scene.add(new THREE.HemisphereLight(PALETTE.skyLight, PALETTE.groundLight, 0.55));

  const sun = new THREE.DirectionalLight(PALETTE.sun, 2.8);
  sun.position.set(SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z);
  sun.target.position.set(SUN_TARGET.x, SUN_TARGET.y, SUN_TARGET.z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -72;
  sun.shadow.camera.right = 72;
  sun.shadow.camera.top = 72;
  sun.shadow.camera.bottom = -72;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 320;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);

  // --- talaj ---
  const terrainGeo = new THREE.PlaneGeometry(280, 280, 176, 176);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i += 1) {
    posAttr.setY(i, groundY(posAttr.getX(i), posAttr.getZ(i)));
  }
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, grassMat);
  terrain.receiveShadow = true;
  scene.add(terrain);
  disposables.push(terrainGeo);

  const villageGround = new THREE.Mesh(new THREE.CircleGeometry(VILLAGE.radius, 56), plazaMat);
  villageGround.rotation.x = -Math.PI / 2;
  villageGround.position.set(VILLAGE.x, 0.02, VILLAGE.z);
  villageGround.receiveShadow = true;
  scene.add(villageGround);
  disposables.push(villageGround.geometry);

  const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 48), pathMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(0, 0.03, -11);
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);
  disposables.push(pathMesh.geometry);

  // --- falu ---
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const doorGeo = new THREE.PlaneGeometry(1.1, 1.9);
  const windowGeo = new THREE.PlaneGeometry(0.7, 0.7);
  const roofGeo = new THREE.ConeGeometry(3.5, 2.1, 4);
  disposables.push(boxGeo, doorGeo, windowGeo, roofGeo);

  HUTS.forEach((hut) => {
    const group = new THREE.Group();
    group.position.set(hut.x, groundY(hut.x, hut.z), hut.z);
    group.rotation.y = hut.rot;

    const plinth = new THREE.Mesh(boxGeo, stoneMat);
    plinth.scale.set(4.9, 0.5, 4.9);
    plinth.position.y = 0.22;
    plinth.castShadow = true;
    plinth.receiveShadow = true;

    const walls = new THREE.Mesh(boxGeo, woodMat);
    walls.scale.set(4.6, 2.9, 4.6);
    walls.position.y = 1.7;
    walls.castShadow = true;
    walls.receiveShadow = true;

    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.y = 3.95;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;

    const door = new THREE.Mesh(doorGeo, darkMat);
    door.position.set(0, 1.12, 2.31);

    const window = new THREE.Mesh(windowGeo, windowMat);
    window.position.set(1.7, 1.85, 2.31);

    group.add(plinth, walls, roof, door, window);
    scene.add(group);
  });

  {
    const y = groundY(WELL.x, WELL.z);
    const group = new THREE.Group();
    group.position.set(WELL.x, y, WELL.z);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 1, 24, 1, true), stoneMat);
    ring.position.y = 0.5;
    ring.castShadow = true;
    ring.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.09, 8, 28), stoneMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 1;
    const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.4, 10);
    const postA = new THREE.Mesh(postGeo, woodMat);
    postA.position.set(1.1, 1.2, 0);
    postA.castShadow = true;
    const postB = postA.clone();
    postB.position.set(-1.1, 1.2, 0);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.scale.setScalar(0.85);
    roof.position.y = 2.95;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(ring, rim, postA, postB, roof);
    scene.add(group);
    disposables.push(ring.geometry, rim.geometry, postGeo);
  }

  // --- máglya ---
  const flames = [];
  const hearthLight = new THREE.PointLight(0xff9a3c, 3.4, 26, 2);
  hearthLight.position.set(VILLAGE.x, 1.6, VILLAGE.z);
  scene.add(hearthLight);

  {
    const group = new THREE.Group();
    group.position.set(VILLAGE.x, 0, VILLAGE.z);
    const stoneGeo = displacedIcosahedron(0.22, 0, 0.3, 5);
    const rockRand = seededRandom(7);
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const rock = new THREE.Mesh(stoneGeo, rockMat);
      rock.position.set(Math.cos(a) * 1.15, 0.14, Math.sin(a) * 1.15);
      rock.scale.setScalar(0.7 + rockRand() * 0.7);
      rock.rotation.set(rockRand() * 3, rockRand() * 3, rockRand() * 3);
      rock.castShadow = true;
      group.add(rock);
    }
    const logGeo = new THREE.CylinderGeometry(0.14, 0.16, 1.7, 10);
    const logRand = seededRandom(11);
    for (let i = 0; i < 4; i += 1) {
      const log = new THREE.Mesh(logGeo, woodMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 4) * Math.PI * 2 + 0.2;
      log.position.set(0, 0.16 + logRand() * 0.12, 0);
      log.castShadow = true;
      group.add(log);
    }
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff8a2b,
      emissive: 0xff5f0d,
      emissiveIntensity: 2.6,
      transparent: true,
      opacity: 0.92,
      roughness: 0.4,
    });
    const flameGeo = new THREE.ConeGeometry(0.62, 1.5, 12);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.05;
    const fireGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color: 0xff8a2b,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    fireGlow.scale.set(6.5, 6.5, 1);
    fireGlow.position.y = 1.3;
    group.add(flame, fireGlow);
    scene.add(group);
    disposables.push(stoneGeo, logGeo, flameGeo, flameMat);
    flames.push({ flame, glow: fireGlow, light: hearthLight, seed: 1 });
  }

  // --- fák ---
  const treeRand = seededRandom(1337);
  const spots = [];
  let attempts = 0;
  while (spots.length < 116 && attempts < 8000) {
    attempts += 1;
    const x = (treeRand() - 0.5) * 200;
    const z = (treeRand() - 0.5) * 200;
    if (Math.hypot(x, z) > 98 || isBlocked(x, z)) continue;
    if (spots.some((t) => Math.hypot(t.x - x, t.z - z) < 5)) continue;
    const roll = treeRand();
    spots.push({
      x,
      z,
      scale: 0.8 + treeRand() * 0.75,
      rot: treeRand() * Math.PI * 2,
      kind: roll < 0.6 ? 'broad' : roll < 0.87 ? 'pine' : 'dead',
      r2: treeRand(),
      r3: treeRand(),
    });
  }

  const broad = spots.filter((s) => s.kind === 'broad');
  const pines = spots.filter((s) => s.kind === 'pine');
  const dead = spots.filter((s) => s.kind === 'dead');
  const dummy = new THREE.Object3D();

  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.31, 3.8, 9);
  trunkGeo.translate(0, 1.9, 0);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, barkMat, Math.max(1, broad.length));
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  broad.forEach((tree, i) => {
    dummy.position.set(tree.x, groundY(tree.x, tree.z), tree.z);
    dummy.rotation.set(0, tree.rot, 0);
    dummy.scale.set(tree.scale, tree.scale * (0.9 + tree.r2 * 0.3), tree.scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
  });
  trunkMesh.count = broad.length;
  scene.add(trunkMesh);
  disposables.push(trunkGeo);

  const canopyColors = [0xe4f0c4, 0xd6e6b4, 0xeff8d8];
  const canopyGeos = [0, 1, 2].map((i) => displacedIcosahedron(1.55, 2, 0.32, i * 5.1 + 2));
  const canopyMeshes = canopyGeos.map((geo, i) => {
    const mesh = new THREE.InstancedMesh(geo, canopyMat(canopyColors[i]), Math.max(1, broad.length));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    disposables.push(geo);
    return mesh;
  });
  const canopyUsed = [0, 0, 0];
  broad.forEach((tree, i) => {
    const top = groundY(tree.x, tree.z) + 3.8 * tree.scale;
    const main = i % 3;
    dummy.position.set(tree.x, top + 0.45 * tree.scale, tree.z);
    dummy.rotation.set(tree.r2, tree.rot, tree.r3);
    dummy.scale.setScalar(tree.scale * (1.1 + tree.r2 * 0.35));
    dummy.updateMatrix();
    canopyMeshes[main].setMatrixAt(canopyUsed[main]++, dummy.matrix);

    const second = (i + 1) % 3;
    dummy.position.set(tree.x + (tree.r2 - 0.5) * 1.1, top + 1.5 * tree.scale, tree.z - (tree.r3 - 0.5) * 1.1);
    dummy.rotation.set(tree.r3, tree.r2, tree.r2);
    dummy.scale.setScalar(tree.scale * (0.62 + tree.r3 * 0.3));
    dummy.updateMatrix();
    canopyMeshes[second].setMatrixAt(canopyUsed[second]++, dummy.matrix);
  });
  canopyMeshes.forEach((mesh, i) => {
    mesh.count = canopyUsed[i];
    mesh.instanceMatrix.needsUpdate = true;
  });

  const pineTrunkGeo = new THREE.CylinderGeometry(0.13, 0.22, 5.4, 8);
  pineTrunkGeo.translate(0, 2.7, 0);
  const pineTrunk = new THREE.InstancedMesh(pineTrunkGeo, barkMat, Math.max(1, pines.length));
  pineTrunk.castShadow = true;
  pineTrunk.receiveShadow = true;
  const pineConeGeo = new THREE.ConeGeometry(1.6, 2.4, 10);
  const pineCones = new THREE.InstancedMesh(pineConeGeo, canopyMat(0x9fbf88), Math.max(1, pines.length * 3));
  pineCones.castShadow = true;
  pineCones.receiveShadow = true;
  pines.forEach((tree, i) => {
    const y = groundY(tree.x, tree.z);
    dummy.position.set(tree.x, y, tree.z);
    dummy.rotation.set(0, tree.rot, 0);
    dummy.scale.set(tree.scale, tree.scale * (0.95 + tree.r2 * 0.25), tree.scale);
    dummy.updateMatrix();
    pineTrunk.setMatrixAt(i, dummy.matrix);

    for (let layer = 0; layer < 3; layer += 1) {
      const base = y + (2.6 + layer * 1.05) * tree.scale;
      dummy.position.set(tree.x, base, tree.z);
      dummy.rotation.set(0, tree.r3 + layer, 0);
      dummy.scale.setScalar(tree.scale * (1.15 - layer * 0.28));
      dummy.updateMatrix();
      pineCones.setMatrixAt(i * 3 + layer, dummy.matrix);
    }
  });
  scene.add(pineTrunk, pineCones);
  disposables.push(pineTrunkGeo, pineConeGeo);

  const deadTrunkGeo = new THREE.CylinderGeometry(0.11, 0.2, 3.2, 8);
  deadTrunkGeo.translate(0, 1.6, 0);
  const deadTrunk = new THREE.InstancedMesh(deadTrunkGeo, barkMat, Math.max(1, dead.length));
  deadTrunk.castShadow = true;
  const branchGeo = new THREE.CylinderGeometry(0.03, 0.06, 1.5, 6);
  const deadBranches = new THREE.InstancedMesh(branchGeo, barkMat, Math.max(1, dead.length * 4));
  deadBranches.castShadow = true;
  dead.forEach((tree, i) => {
    const y = groundY(tree.x, tree.z);
    dummy.position.set(tree.x, y, tree.z);
    dummy.rotation.set((tree.r2 - 0.5) * 0.25, tree.rot, (tree.r3 - 0.5) * 0.25);
    dummy.scale.set(tree.scale, tree.scale * (0.85 + tree.r2 * 0.4), tree.scale);
    dummy.updateMatrix();
    deadTrunk.setMatrixAt(i, dummy.matrix);

    for (let b = 0; b < 4; b += 1) {
      const angle = (b / 4) * Math.PI * 2 + tree.r2 * 3;
      const height = y + (1.2 + b * 0.5) * tree.scale;
      dummy.position.set(tree.x + Math.cos(angle) * 0.45, height, tree.z + Math.sin(angle) * 0.45);
      dummy.rotation.set(Math.sin(angle) * 0.9, angle, Math.cos(angle) * 0.9);
      dummy.scale.setScalar(tree.scale * (0.7 + (b % 2) * 0.35));
      dummy.updateMatrix();
      deadBranches.setMatrixAt(i * 4 + b, dummy.matrix);
    }
  });
  scene.add(deadTrunk, deadBranches);
  disposables.push(deadTrunkGeo, branchGeo);

  // --- sziklák ---
  const rockRand = seededRandom(99);
  const rockGeos = [0, 1, 2].map((i) => displacedIcosahedron(1, 0, 0.34, i * 7.3 + 3));
  const rockMeshes = rockGeos.map((geo) => {
    const mesh = new THREE.InstancedMesh(geo, rockMat, 40);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    disposables.push(geo);
    return mesh;
  });
  const rockUsed = [0, 0, 0];
  attempts = 0;
  let rocksPlaced = 0;
  while (rocksPlaced < 96 && attempts < 4000) {
    attempts += 1;
    const x = (rockRand() - 0.5) * 210;
    const z = (rockRand() - 0.5) * 210;
    if (Math.hypot(x, z) > 104 || isBlocked(x, z)) continue;
    const variant = rocksPlaced % 3;
    if (rockUsed[variant] >= 40) continue;
    const s = 0.45 + rockRand() * 1.5;
    const r2 = rockRand();
    const r3 = rockRand();
    dummy.position.set(x, groundY(x, z) + s * 0.22, z);
    dummy.rotation.set(r2 * 3, r3 * 6, r2 * 4);
    dummy.scale.set(s, s * 0.72, s * 1.12);
    dummy.updateMatrix();
    rockMeshes[variant].setMatrixAt(rockUsed[variant], dummy.matrix);
    rockUsed[variant] += 1;
    rocksPlaced += 1;
  }
  rockMeshes.forEach((mesh, i) => {
    mesh.count = rockUsed[i];
    mesh.instanceMatrix.needsUpdate = true;
  });

  // --- távoli hegyek ---
  const mountainRand = seededRandom(4242);
  const mountainGeo = new THREE.ConeGeometry(1, 1, 7, 1);
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x5f6b7a, roughness: 1, metalness: 0 });
  const mountains = new THREE.InstancedMesh(mountainGeo, mountainMat, 22);
  for (let i = 0; i < 22; i += 1) {
    const angle = (i / 22) * Math.PI * 2 + mountainRand() * 0.22;
    const radius = 168 + mountainRand() * 62;
    const height = 58 + mountainRand() * 72;
    const width = 48 + mountainRand() * 46;
    dummy.position.set(Math.cos(angle) * radius, height / 2 - 12, Math.sin(angle) * radius);
    dummy.rotation.set(0, mountainRand() * 3, 0);
    dummy.scale.set(width, height, width);
    dummy.updateMatrix();
    mountains.setMatrixAt(i, dummy.matrix);
  }
  scene.add(mountains);
  disposables.push(mountainGeo, mountainMat);

  // --- növényzet ---
  const vegetation = buildVegetation(scene, { leaf });

  // --- szereplők ---
  const interactables = [];
  const npcActors = [];

  NPCS.forEach((def) => {
    const actor = createCharacter({
      variant: def.variant,
      skin: def.skin,
      cloth: def.cloth,
      accent: def.accent,
      hairColor: def.hairColor,
      scale: def.scale,
    });
    const y = groundY(def.x, def.z);
    actor.root.position.set(def.x, y, def.z);
    const yaw = def.rot ?? Math.atan2(-(VILLAGE.x - def.x), -(VILLAGE.z - def.z));
    actor.root.rotation.y = yaw;
    scene.add(actor.root);
    npcActors.push(actor);
    interactables.push({
      kind: 'npc',
      id: def.id,
      name: def.name,
      label: 'Beszélgetés',
      position: new THREE.Vector3(def.x, y, def.z),
      radius: 3.6,
      active: true,
    });
  });

  // --- jelzőtüzek ---
  const beaconParts = {};
  BEACONS.forEach((def) => {
    const y = groundY(def.x, def.z);
    const group = new THREE.Group();
    group.position.set(def.x, y, def.z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 0.7, 14), stoneMat);
    base.position.y = 0.35;
    base.castShadow = true;
    base.receiveShadow = true;

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.62, 0.6, 16), darkMat);
    bowl.position.y = 1;
    bowl.castShadow = true;

    const stoneGeo = displacedIcosahedron(0.28, 0, 0.3, def.x * 0.1 + 9);
    const stoneRand = seededRandom(def.x * 31 + def.z);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(stoneGeo, rockMat);
      rock.position.set(Math.cos(a) * 1.5, 0.18, Math.sin(a) * 1.5);
      rock.scale.setScalar(0.7 + stoneRand() * 0.6);
      rock.rotation.set(stoneRand() * 3, stoneRand() * 3, stoneRand() * 3);
      rock.castShadow = true;
      group.add(rock);
    }

    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffb057,
      emissive: 0xff7a12,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.92,
      roughness: 0.35,
    });
    const flameGeo = new THREE.ConeGeometry(0.5, 1.6, 12);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.9;
    flame.visible = false;

    const beaconGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color: 0xffa347,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    beaconGlow.scale.set(7, 7, 1);
    beaconGlow.position.y = 1.9;
    beaconGlow.visible = false;

    group.add(base, bowl, flame, beaconGlow);
    scene.add(group);
    disposables.push(base.geometry, bowl.geometry, stoneGeo, flameGeo, flameMat);

    beaconParts[def.id] = { group, flame, glow: beaconGlow, light: null, seed: def.x + def.z };
    interactables.push({
      kind: 'beacon',
      id: def.id,
      name: def.name,
      label: 'A kőtál',
      position: new THREE.Vector3(def.x, y, def.z),
      radius: 3.4,
      active: true,
    });
  });

  // --- fénytöredékek ---
  const shardParts = {};
  SHARDS.forEach((def, index) => {
    const y = groundY(def.x, def.z) + 1.4;
    const group = new THREE.Group();
    group.position.set(def.x, y, def.z);

    const coreGeo = new THREE.IcosahedronGeometry(0.28, 0);
    const core = new THREE.Mesh(
      coreGeo,
      new THREE.MeshStandardMaterial({
        color: 0xcdeeff,
        emissive: 0x74d9ff,
        emissiveIntensity: 2.6,
        roughness: 0.15,
        metalness: 0.2,
        flatShading: true,
      })
    );
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color: 0x9fe6ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      })
    );
    halo.scale.set(3.2, 3.2, 1);
    group.add(core, halo);
    scene.add(group);
    disposables.push(coreGeo, core.material);

    shardParts[def.id] = { group, core, base: y, phase: index * 2.1, collected: false };
    interactables.push({
      kind: 'shard',
      id: def.id,
      name: def.title,
      label: 'Fénytöredék felvétele',
      position: new THREE.Vector3(def.x, y, def.z),
      radius: 2.6,
      active: true,
    });
  });

  // --- célzó jelölés ---
  const marker = new THREE.Group();
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffd28a,
    transparent: true,
    opacity: 0.13,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 26, 14, 1, true);
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 13;
  const ringGroup = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(1.6, 0.05, 8, 44);
  const ringMesh = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({ color: 0xffe0a8, transparent: true, opacity: 0.7, fog: false })
  );
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.12;
  ringGroup.add(ringMesh);
  const markerGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffd28a,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  markerGlow.scale.set(6, 6, 1);
  markerGlow.position.y = 0.5;
  marker.add(beam, ringGroup, markerGlow);
  marker.visible = false;
  scene.add(marker);
  disposables.push(beamGeo, beamMat, ringGeo, ringMesh.material);

  let time = 0;

  return {
    interactables,
    sun,

    update(dt) {
      time += dt;
      vegetation.update(dt);
      flames.forEach((f) => {
        const flicker = 0.86 + Math.sin(time * 9 + f.seed) * 0.08 + Math.sin(time * 21 + f.seed * 2) * 0.06;
        f.flame.scale.set(1, flicker, 1);
        f.glow.scale.setScalar(6 + flicker * 1.2);
        if (f.light) f.light.intensity = 2.6 + flicker * 1.1;
      });
      Object.values(beaconParts).forEach((b) => {
        if (!b.flame.visible) return;
        const flicker = 0.85 + Math.sin(time * 8.5 + b.seed) * 0.1 + Math.sin(time * 19 + b.seed) * 0.05;
        b.flame.scale.set(1, flicker, 1);
        b.flame.rotation.y = time * 0.7;
        b.glow.scale.setScalar(5.5 + flicker * 1.6);
        if (b.light) b.light.intensity = 3 + flicker * 1.4;
      });
      Object.values(shardParts).forEach((s) => {
        if (s.collected) return;
        s.group.rotation.y = time * 0.9 + s.phase;
        s.group.position.y = s.base + Math.sin(time * 1.6 + s.phase) * 0.18;
      });
      npcActors.forEach((actor, i) => {
        actor.update(dt, 0, false);
        actor.root.rotation.y += Math.sin(time * 0.3 + i) * 0.0004;
      });
      ringGroup.rotation.y = time * 0.6;
      if (marker.visible) markerGlow.material.opacity = 0.3 + Math.sin(time * 2.2) * 0.12;
    },

    setBeaconLit(id, lit) {
      const b = beaconParts[id];
      if (!b) return;
      b.flame.visible = lit;
      b.glow.visible = lit;
      if (lit && !b.light) {
        b.light = new THREE.PointLight(0xff9a3f, 3.6, 36, 2);
        b.light.position.set(0, 2.4, 0);
        b.group.add(b.light);
      }
      if (!lit && b.light) {
        b.group.remove(b.light);
        b.light = null;
      }
    },

    collectShard(id) {
      const s = shardParts[id];
      if (!s) return;
      s.collected = true;
      s.group.visible = false;
      const item = interactables.find((i) => i.kind === 'shard' && i.id === id);
      if (item) item.active = false;
    },

    setObjectiveTarget(target) {
      if (!target) {
        marker.visible = false;
        return;
      }
      marker.position.set(target.x, groundY(target.x, target.z), target.z);
      marker.visible = true;
    },

    dispose() {
      vegetation.dispose();
      surfaces.forEach((s) => s.dispose());
      disposables.forEach((d) => d.dispose?.());
      glow.dispose();
    },
  };
}