/* AURELLE — hero 3D studio: a procedural Halo pendant (brass + alabaster)
   that sways toward the pointer, can be spun by dragging, switched on/off
   and re-finished live. Rendering pauses when the hero is off-screen. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('studio');
const canvas = document.getElementById('studioCanvas');
if (stage && canvas) init();

function init(){
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' }); }
  catch(e){ stage.classList.add('no-gl'); return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.15, 9.2);

  /* ---------- Alabaster texture (procedural veining) ---------- */
  function alabasterTex(){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0,0,0,512);
    grd.addColorStop(0,'#f4ead9'); grd.addColorStop(.5,'#efe1c8'); grd.addColorStop(1,'#f3e7d3');
    g.fillStyle = grd; g.fillRect(0,0,1024,512);
    // soft clouds
    for (let i=0;i<70;i++){
      const x=Math.random()*1024,y=Math.random()*512,r=40+Math.random()*140;
      const rg=g.createRadialGradient(x,y,0,x,y,r);
      const warm=Math.random()>.5;
      rg.addColorStop(0, warm?'rgba(214,180,130,.20)':'rgba(255,250,240,.28)'); rg.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=rg; g.fillRect(x-r,y-r,r*2,r*2);
    }
    // veins
    g.lineCap='round';
    for (let i=0;i<26;i++){
      g.strokeStyle=`rgba(${150+Math.random()*40|0},${110+Math.random()*30|0},${70+Math.random()*20|0},${.10+Math.random()*.22})`;
      g.lineWidth=.6+Math.random()*2.4;
      g.beginPath(); let x=Math.random()*1024,y=Math.random()*512; g.moveTo(x,y);
      for (let k=0;k<6;k++){ const nx=x+(Math.random()-.3)*260, ny=y+(Math.random()-.5)*120; g.quadraticCurveTo((x+nx)/2+(Math.random()-.5)*90,(y+ny)/2+(Math.random()-.5)*90,nx,ny); x=nx;y=ny; }
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  function glowTex(){
    const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
    const rg=g.createRadialGradient(128,128,0,128,128,128);
    rg.addColorStop(0,'rgba(255,214,150,1)'); rg.addColorStop(.18,'rgba(255,196,120,.55)'); rg.addColorStop(.45,'rgba(255,170,90,.16)'); rg.addColorStop(1,'rgba(255,160,80,0)');
    g.fillStyle=rg; g.fillRect(0,0,256,256);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
  }
  const alab = alabasterTex();

  /* ---------- Materials ---------- */
  const FIN = {
    'Aged Brass':     { color:0xb08a52, metalness:1, roughness:.32 },
    'Patina Bronze':  { color:0x5e4a36, metalness:1, roughness:.42 },
    'Matte Black':    { color:0x1e1d1b, metalness:.55, roughness:.62 },
    'Polished Nickel':{ color:0xd2cfc9, metalness:1, roughness:.16 }
  };
  const metal = new THREE.MeshStandardMaterial({ ...FIN['Aged Brass'], envMapIntensity:1.15 });
  const stone = new THREE.MeshStandardMaterial({ map:alab, emissive:0xffc98a, emissiveMap:alab, emissiveIntensity:1.25, roughness:.55, metalness:0 });
  const cordMat = new THREE.MeshStandardMaterial({ color:0x2a2622, roughness:.8 });

  /* ---------- Lamp model ---------- */
  const rig = new THREE.Group();       // swings (pivot at the ceiling)
  rig.position.y = 3.6;
  scene.add(rig);
  const lamp = new THREE.Group();      // spins
  lamp.position.y = -3.75;
  rig.add(lamp);

  // cord runs from above the frame down to the knuckle (lamp y 1.68 → rig y -2.07)
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,6,10), cordMat);
  cord.position.y = -2.07 + 3; rig.add(cord);

  // top cap: spun dome via lathe
  const capPts = [];
  for (let i=0;i<=24;i++){ const t=i/24; capPts.push(new THREE.Vector2(.06+Math.sin(t*Math.PI*.5)*1.02, .62-Math.pow(t,1.6)*.62)); }
  capPts.push(new THREE.Vector2(1.05,-.02));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 96), metal);
  cap.position.y = .74; lamp.add(cap);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,.34,24), metal); stem.position.y = 1.5; lamp.add(stem);
  const knuckle = new THREE.Mesh(new THREE.SphereGeometry(.1,24,16), metal); knuckle.position.y = 1.68; lamp.add(knuckle);

  // alabaster globe
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), stone);
  globe.scale.set(1,.92,1); lamp.add(globe);

  // halo ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.24,.035,20,160), metal);
  ring.rotation.x = Math.PI/2; ring.position.y = -.05; lamp.add(ring);
  const up = new THREE.Vector3(0,1,0);
  for (let i=0;i<3;i++){ // three slim rods from the ring up to the cap rim, outside the globe
    const a = i/3*Math.PI*2 + Math.PI/6;
    const p0 = new THREE.Vector3(Math.cos(a)*1.24, -.05, Math.sin(a)*1.24);
    const p1 = new THREE.Vector3(Math.cos(a)*1.03, .72, Math.sin(a)*1.03);
    const d = p1.clone().sub(p0), len = d.length();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,len,10), metal);
    rod.position.copy(p0).addScaledVector(d,.5);
    rod.quaternion.setFromUnitVectors(up, d.normalize());
    lamp.add(rod);
    const nub = new THREE.Mesh(new THREE.SphereGeometry(.04,12,10), metal); nub.position.copy(p0); lamp.add(nub);
  }
  // finial
  const fin = new THREE.Mesh(new THREE.CylinderGeometry(.05,.12,.16,24), metal); fin.position.y = -.96; lamp.add(fin);
  const finBall = new THREE.Mesh(new THREE.SphereGeometry(.055,16,12), metal); finBall.position.y = -1.07; lamp.add(finBall);

  // light inside + glow
  const bulb = new THREE.PointLight(0xffc580, 18, 12, 1.6); bulb.position.y = -.05; lamp.add(bulb);
  const key = new THREE.DirectionalLight(0xfff1e0, .55); key.position.set(-4,5,6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd7a8, .35); rim.position.set(5,2,-4); scene.add(rim);
  const amb = new THREE.AmbientLight(0x6b5845, .25); scene.add(amb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:.9 }));
  glow.scale.set(7.5,7.5,1); glow.position.y = rig.position.y - 3.8; glow.renderOrder = -1; scene.add(glow);

  // drifting dust in the light
  const N = innerWidth < 768 ? 140 : 260;
  const pos = new Float32Array(N*3), seed = new Float32Array(N);
  for (let i=0;i<N;i++){ pos[i*3]=(Math.random()-.5)*6; pos[i*3+1]=(Math.random()-.5)*6-.6; pos[i*3+2]=(Math.random()-.5)*3; seed[i]=Math.random()*100; }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const dMat = new THREE.PointsMaterial({ color:0xffd9a6, size:.06, map:glowTex(), alphaTest:.001, transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true });
  const dust = new THREE.Points(dGeo, dMat); scene.add(dust);

  /* ---------- Interaction ---------- */
  let on = 1, onT = 1;                 // light level (target / current)
  let spin = 0, spinV = reduce ? 0 : .0035, dragging = false, lastX = 0;
  const pointer = { x:0, y:0 }, sway = { x:0, z:0, vx:0, vz:0 };

  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left)/r.width)*2-1; pointer.y = ((e.clientY - r.top)/r.height)*2-1;
    if (dragging){ const dx = e.clientX - lastX; spinV = dx*.0009; spin += dx*.008; lastX = e.clientX; }
  });
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); stage.classList.add('grabbing'); hideHint(); });
  const end = e => { dragging = false; stage.classList.remove('grabbing'); if (e && e.pointerType === 'touch'){ pointer.x = 0; pointer.y = 0; } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  stage.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  canvas.addEventListener('dblclick', () => toggle());
  function hideHint(){ const h = document.getElementById('studioHint'); if (h) h.classList.add('gone'); }

  const sw = document.getElementById('studioSwitch');
  function toggle(){ onT = onT ? 0 : 1; sw.setAttribute('aria-pressed', onT ? 'true':'false'); stage.classList.toggle('off', !onT); }
  sw.addEventListener('click', toggle);

  document.querySelectorAll('[data-finish]').forEach(b => b.addEventListener('click', () => {
    const f = FIN[b.dataset.finish]; if (!f) return;
    document.querySelectorAll('[data-finish]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true':'false'));
    document.getElementById('studioFinish').textContent = b.dataset.finish;
    const from = metal.color.clone(), to = new THREE.Color(f.color), r0 = metal.roughness, m0 = metal.metalness, t0 = performance.now();
    (function step(){ const k = Math.min(1,(performance.now()-t0)/600), e = 1-Math.pow(1-k,3);
      metal.color.copy(from).lerp(to,e); metal.roughness = r0+(f.roughness-r0)*e; metal.metalness = m0+(f.metalness-m0)*e;
      if (k<1) requestAnimationFrame(step); })();
    spinV += .02; // a little flourish
  }));

  /* ---------- Sizing ---------- */
  function resize(){
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w/h;
    // keep the lamp clear of the title (top) and the control bar (bottom)
    if (w < 640){ camera.position.z = 12.8; camera.position.y = .32; }      // phone: smaller lamp, centred between title and bar
    else { camera.position.z = w/h < .8 ? 10.6 : w/h < 1.1 ? 9.8 : 9.4; camera.position.y = .05; }
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  /* ---------- Loop (paused off-screen) ---------- */
  let visible = true, raf = 0, last = performance.now(), intro = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf){ last = performance.now(); raf = requestAnimationFrame(tick); } });

  function tick(now){
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(.05, (now-last)/1000); last = now;
    intro = Math.min(1, intro + dt*.55);
    const ei = 1 - Math.pow(1-intro, 4);

    // light fade (with a tiny warm flicker while on)
    on += (onT - on) * Math.min(1, dt*4.5);
    const flick = 1 + (reduce ? 0 : Math.sin(now*.013)*.012 + Math.sin(now*.0047)*.018);
    const L = on * flick * ei;
    stone.emissiveIntensity = .05 + L*1.0;
    bulb.intensity = L*18;
    glow.material.opacity = L*.9;
    dMat.opacity = .08 + L*.5;
    amb.intensity = .18 + L*.12;
    renderer.toneMappingExposure = .82 + L*.25;

    // pendulum sway toward pointer (spring)
    const tx = -pointer.x*.09, tz = pointer.y*.05;
    sway.vx += ((tx - sway.x)*7 - sway.vx*2.6)*dt; sway.x += sway.vx*dt;
    sway.vz += ((tz - sway.z)*7 - sway.vz*2.6)*dt; sway.z += sway.vz*dt;
    const idle = reduce ? 0 : Math.sin(now*.0006)*.018;
    rig.rotation.z = sway.x + idle; rig.rotation.x = sway.z;
    rig.position.y = 3.6 + (1-ei)*2.6;             // lowers in on load
    glow.position.set(Math.sin(rig.rotation.z)*3.8, rig.position.y - Math.cos(rig.rotation.z)*3.8, 0);

    // spin with inertia
    if (!dragging){ spinV += ((reduce?0:.0035) - spinV)*Math.min(1,dt*1.2); spin += spinV; }
    lamp.rotation.y = spin;

    // dust drift
    const p = dGeo.attributes.position.array;
    for (let i=0;i<N;i++){ const s = seed[i];
      p[i*3]   += Math.sin(now*.0002 + s)*.0009;
      p[i*3+1] += .0016 + Math.sin(now*.0003+s)*.0006;
      if (p[i*3+1] > 2.6) p[i*3+1] = -3.6;
    }
    dGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  stage.classList.add('ready');
}
