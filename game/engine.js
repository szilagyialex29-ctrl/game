import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createCharacter } from './character.js';
import { loadHeroModel } from './heroModel.js';
import { groundY } from './terrain.js';
import { PALETTE, SPAWN, WORLD_RADIUS, PLAYER_NAME } from './content.js';

const TAU = Math.PI * 2;
const WALK_SPEED = 4.4;
const RUN_SPEED = 7.6;
const CAM_DISTANCE = 5.2;
const CAM_HEIGHT = 1.62;
const MOUSE_SENSITIVITY = 0.0022;

function lerpAngle(a, b, t) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}

export default class GameEngine {
  constructor(container, handlers = {}) {
    this.container = container;
    this.handlers = handlers;
    this.mode = 'title';
    this.paused = false;
    this.keys = new Set();
    this.target = null;
    this.prompt = null;
    this.time = 0;
    this.disposed = false;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(PALETTE.fog, 0.0072);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.world = buildWorld(this.scene);

    this.player = { pos: new THREE.Vector3(SPAWN.x, 0, SPAWN.z), yaw: 0, speed: 0 };
    this.player.pos.y = groundY(SPAWN.x, SPAWN.z);
    this.camYaw = 0;
    this.camPitch = -0.16;

    this.playerActor = createCharacter({
      variant: 'player',
      skin: 0xcaa07a,
      cloth: 0x3f4a5c,
      accent: 0x9a7b3c,
      hairColor: 0x2b2018,
      scale: 1,
    });
    this.playerActor.root.position.copy(this.player.pos);
    this.playerActor.root.visible = false;
    this.scene.add(this.playerActor.root);

    // a rigelt modell a háttérben töltődik, addig a kódból épített alak áll
    loadHeroModel()
      .then((hero) => {
        if (this.disposed) {
          hero.dispose();
          return;
        }
        this._setPlayerActor(hero);
      })
      .catch((error) => console.warn('A hős modellje nem töltődött be.', error));

    this._tmpTarget = new THREE.Vector3();
    this._tmpCam = new THREE.Vector3();

    this._onKeyDown = (event) => {
      if (event.code === 'KeyE') {
        if (this.interact()) event.preventDefault();
        return;
      }
      this.keys.add(event.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
    };
    this._onKeyUp = (event) => this.keys.delete(event.code);
    this._onMouseMove = (event) => {
      if (document.pointerLockElement !== this.renderer.domElement) return;
      this.camYaw -= event.movementX * MOUSE_SENSITIVITY;
      this.camPitch -= event.movementY * MOUSE_SENSITIVITY;
      this.camPitch = Math.max(-0.66, Math.min(0.34, this.camPitch));
    };
    this._onCanvasClick = () => {
      if (this.mode !== 'play' || this.paused) return;
      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock?.();
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    this.renderer.domElement.addEventListener('click', this._onCanvasClick);

    this._observer = new ResizeObserver(() => this._resize());
    this._observer.observe(container);
    this._resize();

    this._tick = this._tick.bind(this);
    window.game = this;
  }

  start() {
    this.renderer.setAnimationLoop(this._tick);
  }

  _setPlayerActor(actor) {
    const previous = this.playerActor;
    actor.root.position.copy(previous.root.position);
    actor.root.rotation.copy(previous.root.rotation);
    actor.root.visible = previous.root.visible;
    this.scene.remove(previous.root);
    this.scene.add(actor.root);
    this.playerActor = actor;
    previous.dispose?.();
  }

  _resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    if (this.mode === 'play') this._updatePlay(dt);
    else this._updateTitle(dt);
    this.world.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _updateTitle(dt) {
    const t = this.time * 0.055;
    this.camera.position.set(
      Math.cos(t) * 36 + 6,
      17 + Math.sin(t * 0.8) * 2.5,
      -34 + Math.sin(t) * 36
    );
    this.camera.lookAt(0, 3.5, -34);
    this.target = null;
    this._setPrompt(null);
  }

  _updatePlay(dt) {
    const keys = this.keys;
    let mx = 0;
    let mz = 0;
    if (!this.paused) {
      if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
    }

    const fx = -Math.sin(this.camYaw);
    const fz = -Math.cos(this.camYaw);
    const rx = Math.cos(this.camYaw);
    const rz = -Math.sin(this.camYaw);

    let dirX = fx * mz + rx * mx;
    let dirZ = fz * mz + rz * mx;
    const dirLen = Math.hypot(dirX, dirZ);
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = dirLen > 0.001 ? (running ? RUN_SPEED : WALK_SPEED) : 0;

    if (dirLen > 0.001) {
      dirX /= dirLen;
      dirZ /= dirLen;
      this.player.pos.x += dirX * speed * dt;
      this.player.pos.z += dirZ * speed * dt;
      const dist = Math.hypot(this.player.pos.x, this.player.pos.z);
      if (dist > WORLD_RADIUS) {
        const k = WORLD_RADIUS / dist;
        this.player.pos.x *= k;
        this.player.pos.z *= k;
      }
      const wantYaw = Math.atan2(-dirX, -dirZ);
      this.player.yaw = lerpAngle(this.player.yaw, wantYaw, 1 - Math.pow(0.0005, dt));
    }

    this.player.pos.y = groundY(this.player.pos.x, this.player.pos.z);
    this.player.speed = speed;

    this.playerActor.root.position.copy(this.player.pos);
    this.playerActor.root.rotation.y = this.player.yaw;
    this.playerActor.update(dt, this.paused ? 0 : speed, !this.paused && speed > 0);

    const cp = Math.cos(this.camPitch);
    const fwdX = -Math.sin(this.camYaw) * cp;
    const fwdY = Math.sin(this.camPitch);
    const fwdZ = -Math.cos(this.camYaw) * cp;

    this._tmpTarget.set(this.player.pos.x, this.player.pos.y + CAM_HEIGHT, this.player.pos.z);
    this._tmpCam.set(
      this._tmpTarget.x - fwdX * CAM_DISTANCE,
      this._tmpTarget.y - fwdY * CAM_DISTANCE,
      this._tmpTarget.z - fwdZ * CAM_DISTANCE
    );
    const minY = groundY(this._tmpCam.x, this._tmpCam.z) + 0.8;
    if (this._tmpCam.y < minY) this._tmpCam.y = minY;
    this.camera.position.copy(this._tmpCam);
    this.camera.lookAt(this._tmpTarget.x, this._tmpTarget.y + 0.12, this._tmpTarget.z);

    this._findTarget();
  }

  _findTarget() {
    let best = null;
    let bestDist = Infinity;
    for (const item of this.world.interactables) {
      if (!item.active) continue;
      const d = Math.hypot(item.position.x - this.player.pos.x, item.position.z - this.player.pos.z);
      if (d < item.radius && d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    if (best !== this.target) {
      this.target = best;
      this._setPrompt(best);
    }
  }

  _setPrompt(item) {
    const prompt = item
      ? { kind: item.kind, id: item.id, name: item.name, label: item.label }
      : null;
    const changed = JSON.stringify(prompt) !== JSON.stringify(this.prompt);
    this.prompt = prompt;
    if (changed) this.handlers.onPrompt?.(prompt);
  }

  _setPromptSafe() {
    this._setPrompt(this.target);
  }

  interact() {
    if (this.mode !== 'play' || this.paused) return false;
    if (!this.target) return false;
    this.handlers.onInteract?.({
      kind: this.target.kind,
      id: this.target.id,
      name: this.target.name,
    });
    return true;
  }

  setMode(mode) {
    this.mode = mode;
    this.playerActor.root.visible = mode === 'play';
    this.keys.clear();
    if (mode === 'play') this.playerActor.root.position.copy(this.player.pos);
    if (mode !== 'play' && document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
  }

  setPaused(paused) {
    this.paused = paused;
    this.keys.clear();
    if (paused && document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
  }

  setPlayerPosition(x, z, yaw) {
    this.player.pos.set(x, groundY(x, z), z);
    if (typeof yaw === 'number') {
      this.player.yaw = yaw;
      this.camYaw = yaw;
    }
    this.playerActor.root.position.copy(this.player.pos);
  }

  setObjectiveTarget(target) {
    this.world.setObjectiveTarget(target);
  }

  setBeaconLit(id, lit) {
    this.world.setBeaconLit(id, lit);
  }

  collectShard(id) {
    this.world.collectShard(id);
  }

  syncProgress({ beacons = [], shards = [] }) {
    this.world.interactables.forEach((item) => {
      if (item.kind === 'beacon') this.world.setBeaconLit(item.id, beacons.includes(item.id));
    });
    shards.forEach((id) => this.world.collectShard(id));
  }

  getSnapshot() {
    return {
      mode: this.mode,
      paused: this.paused,
      name: PLAYER_NAME,
      x: this.player.pos.x,
      z: this.player.pos.z,
      yaw: this.player.yaw,
      camYaw: this.camYaw,
      prompt: this.prompt,
    };
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this._observer?.disconnect();
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    this.renderer.domElement.removeEventListener('click', this._onCanvasClick);
    this.playerActor.dispose?.();
    this.world.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (window.game === this) delete window.game;
  }
}