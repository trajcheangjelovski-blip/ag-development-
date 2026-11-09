// Crumb Club hero — a small Three.js still life: branded paper cup with steam,
// glazed donut with sprinkles, a choc-chip cookie and roasted beans.
// Colours follow the Brand kit (listens for the `cc-theme` event).
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const stage = document.getElementById('heroStage');

function fail() { document.body.classList.add('no-webgl'); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no ctx');
} catch (e) { fail(); throw e; }

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0.5, 9.4);
camera.lookAt(0, 0.1, 0);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xfff3e2, 0x6b4a33, 1.35));
const key = new THREE.DirectionalLight(0xfff0dc, 2.6);
key.position.set(3.5, 6, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
key.shadow.radius = 6;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffc89a, 1.4);
rim.position.set(-5, 2.5, -4);
scene.add(rim);
const fill = new THREE.PointLight(0xffe2c4, 8, 20);
fill.position.set(-3, -1, 4);
scene.add(fill);

const theme = () => (window.ccTheme && window.ccTheme()) || { accent: '#E0532F', accent2: '#F3B83F', ink: '#23160F', paper: '#F4EDE1', leaf: '#5E7F4E', display: 'Gloock' };

/* ---------- root ---------- */
const root = new THREE.Group();
scene.add(root);

/* ---------- cup ---------- */
const cup = new THREE.Group();
const V = (x, y) => new THREE.Vector2(x, y);
const cupGeo = new THREE.LatheGeometry([V(0, -1.25), V(0.74, -1.25), V(0.79, -1.2), V(1.0, 1.16), V(0.97, 1.2), V(0, 1.2)], 72);
const paperMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.62, metalness: 0 });
const cupMesh = new THREE.Mesh(cupGeo, paperMat);
cupMesh.castShadow = true;
cup.add(cupMesh);

// sleeve with printed canvas texture
const sleeveCanvas = document.createElement('canvas');
sleeveCanvas.width = 2048; sleeveCanvas.height = 420;
const sleeveTex = new THREE.CanvasTexture(sleeveCanvas);
sleeveTex.colorSpace = THREE.SRGBColorSpace;
sleeveTex.anisotropy = 8;
function paintSleeve() {
  const t = theme(), c = sleeveCanvas.getContext('2d'), W = sleeveCanvas.width, H = sleeveCanvas.height;
  c.fillStyle = t.accent; c.fillRect(0, 0, W, H);
  // corrugation lines
  c.globalAlpha = 0.1; c.fillStyle = '#000';
  for (let x = 0; x < W; x += 14) c.fillRect(x, 0, 5, H);
  c.globalAlpha = 1;
  // bands
  c.fillStyle = t.accent2; c.fillRect(0, 26, W, 16); c.fillRect(0, H - 42, W, 16);
  // text
  const darkInk = '#1d130d';
  c.fillStyle = darkInk;
  c.font = `140px "${t.display}", Georgia, serif`;
  c.textBaseline = 'middle';
  const word = 'Crumb Club ✺ ';
  const w = c.measureText(word).width;
  for (let x = 0; x < W + w; x += w) c.fillText(word, x, H / 2 + 6);
  sleeveTex.needsUpdate = true;
}
const sleeveGeo = new THREE.CylinderGeometry(0.97, 0.893, 0.95, 72, 1, true);
const sleeveMat = new THREE.MeshStandardMaterial({ map: sleeveTex, roughness: 0.78, side: THREE.DoubleSide });
const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
sleeve.position.y = 0.08;
sleeve.castShadow = true;
cup.add(sleeve);

// lid
const lidGeo = new THREE.LatheGeometry([V(0, 1.52), V(0.3, 1.51), V(0.78, 1.44), V(0.94, 1.38), V(1.0, 1.35), V(1.075, 1.33), V(1.085, 1.22), V(1.05, 1.17), V(0.98, 1.17)], 72);
const lidMat = new THREE.MeshStandardMaterial({ color: 0x2a1d15, roughness: 0.38, metalness: 0.05 });
const lid = new THREE.Mesh(lidGeo, lidMat);
lid.castShadow = true;
cup.add(lid);
const sip = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.22, 4, 12), new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.5 }));
sip.rotation.z = Math.PI / 2; sip.position.set(0, 1.47, 0.62); sip.rotation.x = -0.12;
cup.add(sip);

// steam wisps
const steam = [];
const steamMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
for (let i = 0; i < 3; i++) {
  const pts = [];
  for (let k = 0; k <= 8; k++) pts.push(new THREE.Vector3(Math.sin(k * 0.9 + i * 2) * 0.16, k * 0.14, Math.cos(k * 0.7 + i) * 0.08));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.035, 8, false);
  const m = new THREE.Mesh(g, steamMat());
  m.position.set((i - 1) * 0.28, 1.58, 0.15);
  m.userData.phase = i * 0.33;
  cup.add(m); steam.push(m);
}
cup.position.set(-0.25, -0.15, 0);
cup.rotation.set(0.12, -0.5, -0.06);
root.add(cup);

/* ---------- donut ---------- */
const donut = new THREE.Group();
const dough = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.3, 36, 80), new THREE.MeshStandardMaterial({ color: 0xd59b5f, roughness: 0.7 }));
dough.castShadow = true;
donut.add(dough);
const icingGeo = new THREE.TorusGeometry(0.6, 0.318, 36, 120);
{
  const p = icingGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const th = Math.atan2(y, x);
    const zMin = -0.03 + 0.07 * Math.sin(th * 7) + 0.035 * Math.sin(th * 17 + 1.3);
    if (z < zMin) p.setZ(i, zMin);
  }
  icingGeo.computeVertexNormals();
}
const icingMat = new THREE.MeshStandardMaterial({ color: 0x3b2116, roughness: 0.22, metalness: 0.02 });
const icing = new THREE.Mesh(icingGeo, icingMat);
icing.castShadow = true;
donut.add(icing);
const SPR = 90;
const sprinkles = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.02, 0.075, 3, 8), new THREE.MeshStandardMaterial({ roughness: 0.4 }), SPR);
{
  const d = new THREE.Object3D();
  for (let i = 0; i < SPR; i++) {
    const th = Math.random() * Math.PI * 2, ph = 0.35 + Math.random() * 2.45, r = 0.33;
    d.position.set((0.6 + r * Math.cos(ph)) * Math.cos(th), (0.6 + r * Math.cos(ph)) * Math.sin(th), r * Math.sin(ph));
    d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    d.updateMatrix(); sprinkles.setMatrixAt(i, d.matrix);
  }
}
donut.add(sprinkles);
function paintSprinkles() {
  const t = theme(); const cols = [t.accent, t.accent2, t.leaf, '#ffffff', '#7fc8f8'].map(c => new THREE.Color(c));
  for (let i = 0; i < SPR; i++) sprinkles.setColorAt(i, cols[i % cols.length]);
  sprinkles.instanceColor.needsUpdate = true;
}
donut.position.set(1.75, -1.05, 0.9);
donut.rotation.set(-1.05, 0.35, 0.3);
donut.scale.setScalar(0.92);
root.add(donut);

/* ---------- cookie ---------- */
const cookie = new THREE.Group();
const cookieGeo = new THREE.LatheGeometry([V(0, 0.1), V(0.3, 0.1), V(0.5, 0.085), V(0.6, 0.045), V(0.63, 0), V(0.6, -0.05), V(0.5, -0.07), V(0, -0.07)], 64, 0, Math.PI * 2);
{
  const p = cookieGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 11) * Math.cos(z * 9) * 0.02 + Math.sin(x * 23 + z * 17) * 0.012;
    if (y > 0) p.setY(i, y + n);
    const rr = Math.hypot(x, z); if (rr > 0.4) { const k = 1 + Math.sin(Math.atan2(z, x) * 9) * 0.025; p.setX(i, x * k); p.setZ(i, z * k); }
  }
  cookieGeo.computeVertexNormals();
}
const cookieBody = new THREE.Mesh(cookieGeo, new THREE.MeshStandardMaterial({ color: 0xc98a4b, roughness: 0.85 }));
cookieBody.castShadow = true;
cookie.add(cookieBody);
const chipMat = new THREE.MeshStandardMaterial({ color: 0x2b170e, roughness: 0.35 });
for (let i = 0; i < 11; i++) {
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.48;
  const chip = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055 + Math.random() * 0.04, 0), chipMat);
  chip.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
  chip.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  chip.scale.y = 0.6;
  cookie.add(chip);
}
cookie.position.set(-1.85, 1.2, -0.6);
cookie.rotation.set(1.1, 0.2, -0.5);
root.add(cookie);

/* ---------- beans ---------- */
const beanGeo = new THREE.SphereGeometry(0.15, 28, 18);
{
  const p = beanGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let ny = y * 0.68;
    if (ny > 0) ny -= 0.045 * Math.exp(-Math.pow(x / 0.028, 2));
    p.setXYZ(i, x, ny, z * 1.4);
  }
  beanGeo.computeVertexNormals();
}
const beanMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.32, metalness: 0.05 });
const beans = [];
const beanSpots = [[1.6, 1.25, 0.4], [2.05, 0.4, -0.4], [-1.7, -0.6, 0.9], [-2.2, 0.25, 0.2], [0.9, 1.85, -0.8], [-0.9, -1.7, 1.2], [2.3, -0.3, 0.6], [-0.4, 2.05, -1.1], [1.2, -1.85, -0.2]];
beanSpots.forEach((s, i) => {
  const b = new THREE.Mesh(beanGeo, beanMat);
  b.position.set(...s);
  b.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  b.userData = { base: new THREE.Vector3(...s), sp: 0.6 + Math.random() * 0.8, ph: i * 1.3, rs: (Math.random() - 0.5) * 1.2 };
  b.castShadow = true;
  root.add(b); beans.push(b);
});

/* ---------- ground shadow ---------- */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.0;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- theme ---------- */
function applyTheme() {
  const t = theme();
  paintSleeve();
  paintSprinkles();
  rim.color.set(t.accent2);
}
window.addEventListener('cc-theme', () => { applyTheme(); if (document.fonts) document.fonts.ready.then(paintSleeve); });
applyTheme();
if (document.fonts) document.fonts.ready.then(paintSleeve);

/* ---------- sizing ---------- */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the composition framed on narrow stages
  camera.position.z = w / h < 0.9 ? 10.6 : 9.4;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------- interaction ---------- */
let dragging = false, lastX = 0, spinV = 0, spin = 0;
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', e => { dragging = false; canvas.releasePointerCapture?.(e.pointerId); });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('pointermove', e => {
  if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; spinV = dx * 0.006; spin += spinV; }
});
window.addEventListener('pointermove', e => {
  const r = stage.getBoundingClientRect();
  mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
}, { passive: true });

let visible = true;
new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stage);

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let intro = 0;
function frame() {
  requestAnimationFrame(frame);
  if (!visible || !stage.offsetParent) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  intro = Math.min(1, intro + dt / 1.6);
  const ei = 1 - Math.pow(1 - intro, 4);
  const bounce = intro < 1 ? Math.sin(intro * Math.PI) * 0.15 : 0;

  if (!dragging) { spinV *= 0.94; spin += spinV; }
  mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
  const scrollK = Math.min(1, window.scrollY / 700);

  root.rotation.y = spin + mouse.x * 0.28 + (reduced ? 0 : Math.sin(t * 0.25) * 0.12) + scrollK * 0.9;
  root.rotation.x = mouse.y * 0.12 + scrollK * 0.25;
  root.scale.setScalar(0.72 + 0.28 * ei + bounce * 0.3);
  root.position.y = -scrollK * 0.6;

  const m = reduced ? 0 : 1;
  cup.position.y = -0.15 + (1 - ei) * 2.5 + Math.sin(t * 1.1) * 0.06 * m;
  cup.rotation.z = -0.06 + Math.sin(t * 0.8) * 0.03 * m;
  donut.position.y = -1.05 + Math.sin(t * 1.3 + 1) * 0.12 * m;
  donut.rotation.z = 0.3 + t * 0.25 * m;
  cookie.position.y = 1.2 + Math.sin(t * 1.0 + 2) * 0.1 * m;
  cookie.rotation.y = 0.2 + t * 0.18 * m;
  beans.forEach(b => {
    const u = b.userData;
    b.position.y = u.base.y + Math.sin(t * u.sp + u.ph) * 0.14 * m;
    b.rotation.x += u.rs * dt * m; b.rotation.y += u.rs * 0.7 * dt * m;
  });
  steam.forEach(s => {
    const p = ((t * 0.35 + s.userData.phase) % 1);
    s.position.y = 1.58 + p * 0.55;
    s.material.opacity = Math.sin(p * Math.PI) * 0.42 * ei;
    s.scale.set(1 + p * 0.6, 1, 1 + p * 0.6);
    s.rotation.y = t * 0.5 + s.userData.phase * 6;
  });
  renderer.render(scene, camera);
  if (!window.__sceneReady) { window.__sceneReady = true; document.body.classList.remove('no-webgl'); }
}
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(); });
frame();
