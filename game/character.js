import * as THREE from 'three';

// Emberi alak anatómiai arányokkal: ízületek, kéz, arc, ruharétegek, felszerelés.
export function createCharacter({
  variant = 'villager',
  skin = 0xcaa07a,
  cloth = 0x5a4a38,
  accent = 0x33445f,
  hairColor = 0x2b2018,
  scale = 1,
} = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const M = {
    skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.66, metalness: 0.02 }),
    cloth: new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.96, metalness: 0 }),
    trim: new THREE.MeshStandardMaterial({ color: accent, roughness: 0.62, metalness: 0.18 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x46331f, roughness: 0.78 }),
    hair: new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.88 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.55 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8d8f93, roughness: 0.42, metalness: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6b4f31, roughness: 0.85 }),
  };

  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // törzs
  add(body, new THREE.CapsuleGeometry(0.155, 0.12, 5, 14), M.cloth, 0, 0.94, 0);
  add(body, new THREE.CapsuleGeometry(0.17, 0.2, 5, 16), M.cloth, 0, 1.08, 0);
  const chest = add(body, new THREE.CapsuleGeometry(0.205, 0.3, 6, 18), M.cloth, 0, 1.27, 0);
  chest.scale.set(1, 1, 0.82);
  add(body, new THREE.CylinderGeometry(0.19, 0.195, 0.09, 20), M.leather, 0, 1.0, 0);
  add(body, new THREE.BoxGeometry(0.07, 0.055, 0.03), M.metal, 0, 1.0, 0.19);
  add(body, new THREE.CylinderGeometry(0.058, 0.066, 0.12, 12), M.skin, 0, 1.47, 0);

  // fej
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.53, 0);
  body.add(headGroup);

  const head = add(headGroup, new THREE.SphereGeometry(0.115, 26, 20), M.skin, 0, 0.11, 0);
  head.scale.set(1, 1.12, 1.05);
  add(headGroup, new THREE.SphereGeometry(0.09, 16, 12), M.skin, 0, 0.035, 0.03);

  [-1, 1].forEach((side) => {
    const eye = add(headGroup, new THREE.SphereGeometry(0.021, 10, 8), M.dark, side * 0.045, 0.133, 0.1);
    eye.scale.set(1, 0.85, 0.7);
    add(headGroup, new THREE.BoxGeometry(0.045, 0.009, 0.012), M.hair, side * 0.047, 0.166, 0.102);
    add(headGroup, new THREE.SphereGeometry(0.02, 10, 8), M.skin, side * 0.112, 0.105, -0.005);
  });
  const nose = add(headGroup, new THREE.ConeGeometry(0.019, 0.055, 8), M.skin, 0, 0.095, 0.108);
  nose.rotation.x = Math.PI / 2.2;
  add(headGroup, new THREE.BoxGeometry(0.045, 0.008, 0.012), M.dark, 0, 0.058, 0.104);

  const hairCap = add(
    headGroup,
    new THREE.SphereGeometry(0.122, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    M.hair,
    0,
    0.118,
    -0.004
  );
  hairCap.scale.set(1, 1.08, 1.06);

  if (variant === 'elder') {
    add(headGroup, new THREE.SphereGeometry(0.128, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.75), M.hair, 0, 0.1, -0.05).scale.set(1.05, 1.35, 1.1);
    add(body, new THREE.CapsuleGeometry(0.1, 0.26, 5, 12), M.hair, 0, 1.34, -0.11);
  }
  if (variant === 'long') {
    add(body, new THREE.CapsuleGeometry(0.11, 0.3, 5, 12), M.hair, 0, 1.32, -0.1);
  }
  if (variant === 'smith' || variant === 'guard') {
    const beard = add(
      headGroup,
      new THREE.SphereGeometry(0.098, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      M.hair,
      0,
      0.06,
      0.035
    );
    beard.rotation.x = Math.PI;
    beard.scale.set(1, 1.15, 1);
  }
  if (variant === 'child') {
    hairCap.scale.set(1.06, 1.12, 1.1);
  }

  // karok
  const makeArm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.235, 1.42, 0);
    shoulder.rotation.z = side * -0.12;
    const upper = add(shoulder, new THREE.CapsuleGeometry(0.062, 0.24, 5, 12), M.cloth, 0, -0.15, 0);
    upper.scale.set(1, 1, 0.95);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.3, 0);
    shoulder.add(elbow);
    add(elbow, new THREE.CapsuleGeometry(0.052, 0.22, 5, 12), M.skin, 0, -0.14, 0);
    const hand = add(elbow, new THREE.SphereGeometry(0.062, 12, 10), M.skin, 0, -0.29, 0);
    hand.scale.set(0.85, 1.1, 0.7);
    body.add(shoulder);
    return { shoulder, elbow };
  };
  const armL = makeArm(1);
  const armR = makeArm(-1);

  // lábak
  const makeLeg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, 0.9, 0);
    add(hip, new THREE.CapsuleGeometry(0.098, 0.2, 5, 12), M.cloth, 0, -0.16, 0);
    const knee = new THREE.Group();
    knee.position.set(0, -0.36, 0);
    hip.add(knee);
    add(knee, new THREE.CapsuleGeometry(0.078, 0.18, 5, 12), M.cloth, 0, -0.16, 0);
    const boot = add(knee, new THREE.BoxGeometry(0.135, 0.12, 0.24), M.leather, 0, -0.32, 0.04);
    boot.scale.set(1, 1, 1);
    body.add(hip);
    return { hip, knee };
  };
  const legL = makeLeg(1);
  const legR = makeLeg(-1);

  // ruharétegek és felszerelés
  if (variant === 'guard' || variant === 'player') {
    const cloak = add(body, new THREE.ConeGeometry(0.4, 0.72, 18, 1, true), M.trim, 0, 1.2, -0.02);
    cloak.rotation.x = 0.04;
    cloak.material = M.trim;
  }
  if (variant === 'player') {
    add(body, new THREE.BoxGeometry(0.24, 0.2, 0.11), M.leather, 0.26, 0.96, -0.17);
    add(body, new THREE.BoxGeometry(0.26, 0.03, 0.13), M.trim, 0.26, 1.06, -0.17);
  }
  if (variant === 'elder') {
    const shawl = add(body, new THREE.SphereGeometry(0.32, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), M.trim, 0, 1.36, -0.01);
    shawl.scale.set(1.05, 0.72, 1);
    const staff = add(root, new THREE.CylinderGeometry(0.022, 0.028, 1.85, 8), M.wood, 0.34, 0.95, 0.02);
    staff.rotation.z = 0.06;
    add(root, new THREE.SphereGeometry(0.045, 12, 10), M.trim, 0.4, 1.85, 0.02);
  }
  if (variant === 'guard') {
    const shaft = add(root, new THREE.CylinderGeometry(0.018, 0.022, 2.05, 8), M.wood, 0.33, 1.05, 0.02);
    shaft.rotation.z = 0.07;
    add(root, new THREE.ConeGeometry(0.045, 0.2, 8), M.metal, 0.4, 2.14, 0.02);
  }
  if (variant === 'smith') {
    add(body, new THREE.BoxGeometry(0.42, 0.52, 0.02), M.leather, 0, 1.08, 0.2);
    add(body, new THREE.CylinderGeometry(0.016, 0.018, 0.28, 6), M.wood, -0.28, 1.02, 0.06).rotation.x = 0.5;
    add(body, new THREE.BoxGeometry(0.11, 0.08, 0.07), M.metal, -0.28, 0.93, 0.13);
  }

  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  root.scale.setScalar(0.95 * scale);

  let time = Math.random() * 10;

  return {
    root,
    update(dt, speed = 0, moving = false) {
      time += dt * (moving ? 3.3 + speed * 1.05 : 0.85);
      const amp = moving ? Math.min(0.6, 0.16 + speed * 0.068) : 0;
      const s = Math.sin(time);
      const s2 = Math.sin(time + Math.PI);

      legL.hip.rotation.x = s * amp;
      legR.hip.rotation.x = s2 * amp;
      legL.knee.rotation.x = Math.max(0, Math.sin(time + 0.75)) * amp * 1.15;
      legR.knee.rotation.x = Math.max(0, Math.sin(time + Math.PI + 0.75)) * amp * 1.15;

      armL.shoulder.rotation.x = s2 * amp * 0.78;
      armR.shoulder.rotation.x = s * amp * 0.78;
      armL.elbow.rotation.x = -0.28 - Math.max(0, s2) * amp * 0.5;
      armR.elbow.rotation.x = -0.28 - Math.max(0, s) * amp * 0.5;

      body.position.y = moving ? Math.abs(s) * 0.028 : Math.sin(time * 0.62) * 0.011;
      body.rotation.z = moving ? s * 0.02 : 0;
      body.rotation.y = moving ? s * 0.05 : 0;
      headGroup.rotation.y = moving ? -s * 0.05 : Math.sin(time * 0.31) * 0.2;
      headGroup.rotation.x = moving ? 0 : Math.sin(time * 0.47) * 0.03;
    },
  };
}