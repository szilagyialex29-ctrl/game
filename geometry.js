import * as THREE from 'three';

// Szabálytalan, mégis gömb alakú testek: lombok, bokrok, sziklák.
export function displacedIcosahedron(radius, detail, amount, seed) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    const n =
      Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 1.3) * Math.sin(v.z * 3.4 + seed * 0.7);
    v.multiplyScalar(1 + n * amount);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Szél: a MeshStandardMaterial vertex-shaderébe injektált, példányonként fázisolt lengés.
export function addWind(material, strength, phaseScale = 0.35) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float swayH = max(position.y, 0.0);
        float swayPhase = instanceMatrix[3][0] * ${phaseScale.toFixed(3)} + instanceMatrix[3][2] * ${(phaseScale * 0.7).toFixed(3)};
        float gust = sin(uWindTime * 1.35 + swayPhase) * 0.6 + sin(uWindTime * 3.2 + swayPhase * 1.9) * 0.25;
        transformed.x += gust * swayH * ${strength.toFixed(3)};
        transformed.z += gust * swayH * ${(strength * 0.65).toFixed(3)};`
      );
  };
  return material;
}

export const windTime = { value: 0 };