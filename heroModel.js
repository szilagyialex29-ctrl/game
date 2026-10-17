const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// A rigelt hősmodell: Mixamo-csontváz, sétáló animációval, beágyazott PBR-textúrával.
const HERO_URL =
  'https://media.db.com/files/public/6ad2a08ddea7bf55abb3ec34/204a17ba6_Walking.fbx';
const TARGET_HEIGHT = 1.72;

function materialFrom(source, cache) {
  if (cache.has(source)) return cache.get(source);
  if (source.map) source.map.colorSpace = THREE.SRGBColorSpace;
  const std = new THREE.MeshStandardMaterial({
    name: source.name,
    color: source.color,
    map: source.map,
    normalMap: source.normalMap,
    roughnessMap: source.roughnessMap,
    metalnessMap: source.metalnessMap,
    aoMap: source.aoMap,
    transparent: source.transparent,
    opacity: source.opacity,
    side: source.side,
    roughness: 0.78,
    metalness: 0.22,
  });
  cache.set(source, std);
  return std;
}

// A játék karakterei a helyi -Z irányba néznek; a modellt ehhez igazítjuk.
// Az irányt a lábujj csontok adják meg, így nem kell találgatni, merre néz a modell.
function facingAngle(model) {
  const bones = [];
  model.traverse((node) => {
    if (node.isBone) bones.push(node);
  });
  const pick = (pattern) => bones.find((bone) => pattern.test(bone.name));
  const base = pick(/toebase|toe_base/i);
  const tip = pick(/toe_end|toeend|toetip/i);
  if (!base || !tip) return 0;
  const a = base.getWorldPosition(new THREE.Vector3());
  const b = tip.getWorldPosition(new THREE.Vector3());
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (Math.hypot(dx, dz) < 1e-4) return 0;
  return Math.PI - Math.atan2(dx, dz);
}

export function loadHeroModel() {
  return new Promise((resolve, reject) => {
    new FBXLoader().load(HERO_URL, resolve, undefined, reject);
  }).then((model) => {
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.add(model);
    root.add(pivot);

    const materials = new Map();
    model.traverse((node) => {
      if (!node.isMesh && !node.isSkinnedMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
      node.material = Array.isArray(node.material)
        ? node.material.map((entry) => materialFrom(entry, materials))
        : materialFrom(node.material, materials);
    });

    // egységes magasság, talp a talajon
    model.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(model);
    const height = bounds.max.y - bounds.min.y;
    const scale = height > 0.05 ? TARGET_HEIGHT / height : 1;
    pivot.scale.setScalar(scale);

    model.updateWorldMatrix(true, true);
    model.position.y -= new THREE.Box3().setFromObject(model).min.y / scale;

    pivot.rotation.y = facingAngle(model);

    const mixer = new THREE.AnimationMixer(model);
    // a sétáló ciklust keressük; ha a név nem árulja el, a leghosszabb animációt vesszük
    const clips = model.animations || [];
    const clip =
      clips.find((entry) => /walk/i.test(entry.name)) ||
      clips.slice().sort((a, b) => b.duration - a.duration)[0];
    const action = clip ? mixer.clipAction(clip) : null;
    if (action) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    }

    return {
      root,
      update(dt, speed = 0, moving = false) {
        if (!action) return;
        if (moving) {
          mixer.timeScale = Math.min(1.9, Math.max(0.7, speed / 3.5));
        } else {
          // megálláskor az alapállásba simul vissza, nem fagy meg lépés közben
          mixer.timeScale = 0;
          action.time += (0 - action.time) * Math.min(1, dt * 4);
        }
        mixer.update(dt);
      },
      dispose() {
        mixer.stopAllAction();
        materials.forEach((material) => material.dispose());
        model.traverse((node) => {
          if (node.isMesh || node.isSkinnedMesh) node.geometry?.dispose();
        });
      },
    };
  });
}