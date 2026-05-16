import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { planetsData, sunData } from './planets.js';
import { getVoyagerTimeline, getVoyagerDateRange, getVoyagerState, getAllPlanetPositions, formatVoyagerDate } from './voyager.js';

// --- Configuration ---
const sunSize = 5;
const timeScale = 1;
let hoveredObject = null;
let pinnedObject = null;
let showMoons = true;
let targetViewOffsetX = 0;
let currentViewOffsetX = 0;

// --- Scene Setup ---
const canvas = document.querySelector('#solar-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 150, 450);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Background ---
scene.background = new THREE.Color(0x000000);

// Procedural Starfield
function createStarfield(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 4000;
    const y = (Math.random() - 0.5) * 4000;
    const z = (Math.random() - 0.5) * 4000;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x444444, // Dim stars
    size: 0.5,       // Smaller stars
    sizeAttenuation: false
  });
  
  return new THREE.Points(geometry, material);
}
const starfield = createStarfield(15000);
scene.add(starfield);

const textureLoader = new THREE.TextureLoader();

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 6, 3000, 1);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// --- Sun ---
const sunGeometry = new THREE.SphereGeometry(sunSize, 64, 64);
const sunTexture = textureLoader.load(sunData.texture);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: 0xffffff,
  emissiveMap: sunTexture,
  emissiveIntensity: 1.0, // Peak brightness
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.userData = sunData;
scene.add(sun);

// Reduced Sun Glow
const sunGlowGeometry = new THREE.SphereGeometry(sunSize * 1.1, 64, 64);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffa500,
  transparent: true,
  opacity: 0.1,
  side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlow);

// --- Particle Belts ---
function createBelt(count, innerRadius, outerRadius, color, speed) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    angles[i] = angle;
    radii[i] = radius;
    
    positions[i * 3] = radius * Math.cos(angle);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = radius * Math.sin(angle);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: color,
    size: 0.4,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  const belt = new THREE.Points(geometry, material);
  belt.userData = { speed, angles, radii };
  return belt;
}

const asteroidBelt = createBelt(6000, 45, 58, 0xdddddd, 0.0001);
scene.add(asteroidBelt);

const kuiperBelt = createBelt(10000, 150, 260, 0x99ccff, 0.00005);
scene.add(kuiperBelt);

// --- Voyager Mode State ---
let isVoyagerMode = false;
let voyagerTime = 0;
let voyagerSpeed = 1;
let voyagerPaused = false;
let voyagerCraftId = 2; 
let voyagerLastFlyby = '';
let voyagerCockpitView = false;

// --- Formation Cinematic Assets ---
let isFormationAnimating = false;
let formationTime = 0;
let formationSpeed = 1;
let formationPaused = false;

// Generate Soft Glow Texture
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,200,100,0.8)');
  gradient.addColorStop(0.5, 'rgba(100,50,255,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
const glowTex = createGlowTexture();

// Cinematic Dust Cloud
const dustCount = 20000;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
const dustColors = new Float32Array(dustCount * 3);
const initialData = new Float32Array(dustCount * 4); // r, theta, phi, phase

const cObj = new THREE.Color();
for(let i=0; i<dustCount; i++) {
  const r = 200 + Math.random() * 400;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  dustPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
  dustPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  dustPos[i*3+2] = r * Math.cos(phi);
  
  initialData[i*4] = r;
  initialData[i*4+1] = theta;
  initialData[i*4+2] = phi;
  initialData[i*4+3] = Math.random() * Math.PI * 2;
  
  const mix = Math.random();
  if (mix < 0.4) cObj.setHex(0xffaa00);
  else if (mix < 0.7) cObj.setHex(0x5588ff);
  else cObj.setHex(0x8833ff);
  dustColors[i*3] = cObj.r;
  dustColors[i*3+1] = cObj.g;
  dustColors[i*3+2] = cObj.b;
}

dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
const dustMat = new THREE.PointsMaterial({
  size: 8, map: glowTex, blending: THREE.AdditiveBlending,
  depthWrite: false, transparent: true, vertexColors: true, opacity: 1.0
});
const dustSystem = new THREE.Points(dustGeo, dustMat);
dustSystem.visible = false;
scene.add(dustSystem);

// --- Voyager Spacecraft Meshes ---
function createVoyagerCraft() {
  const group = new THREE.Group();
  // Body
  const bodyGeo = new THREE.BoxGeometry(1.2, 0.6, 0.8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3, emissive: 0x004466, emissiveIntensity: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  // Antenna dish
  const dishGeo = new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.rotation.x = Math.PI / 2;
  dish.position.set(0, 0.4, -0.4);
  group.add(dish);
  // Boom arms (simple lines)
  const boomMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  for (let side = -1; side <= 1; side += 2) {
    const pts = [new THREE.Vector3(side * 0.3, 0, 0.3), new THREE.Vector3(side * 1.2, 0, 0.8)];
    const boomGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const boom = new THREE.Line(boomGeo, boomMat);
    group.add(boom);
  }
  // Glow point (RTG glow)
  const glowGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -0.2, 0.5);
  group.add(glow);
  group.scale.setScalar(0.5);
  return group;
}

const voyagerCraft1 = createVoyagerCraft();
voyagerCraft1.visible = false;
scene.add(voyagerCraft1);
const voyagerCraft2 = createVoyagerCraft();
voyagerCraft2.visible = false;
scene.add(voyagerCraft2);

const trailMaxPoints = 200;
const rocketMaxPoints = 50;
function createRocketTexture(stripeColor) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 40;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 32, 40);
  x.fillStyle = '#f80'; x.beginPath(); x.moveTo(16,38); x.lineTo(8,28); x.lineTo(24,28); x.closePath(); x.fill();
  x.fillStyle = '#ff0'; x.beginPath(); x.moveTo(16,35); x.lineTo(11,28); x.lineTo(21,28); x.closePath(); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(16,2); x.lineTo(6,28); x.lineTo(26,28); x.closePath(); x.fill();
  x.fillStyle = stripeColor; x.fillRect(7,10,18,3); x.fillRect(7,18,18,3);
  x.fillStyle = '#4af'; x.beginPath(); x.arc(16,8,3,0,Math.PI*2); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.arc(15,7,1,0,Math.PI*2); x.fill();
  return new THREE.CanvasTexture(c);
}
const rocketTexV2 = createRocketTexture('#d4af37');
const rocketTexV1 = createRocketTexture('#ff8800');

function makeTrail(color, tex) {
  const arr = new Float32Array(trailMaxPoints * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
  const line = new THREE.Line(geo, mat);
  line.visible = false;
  scene.add(line);
  const rArr = new Float32Array(rocketMaxPoints * 3);
  const rGeo = new THREE.BufferGeometry();
  rGeo.setAttribute('position', new THREE.BufferAttribute(rArr, 3));
  const rMat = new THREE.PointsMaterial({ size: 1.5, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 });
  const rPoints = new THREE.Points(rGeo, rMat);
  rPoints.visible = false;
  scene.add(rPoints);
  return { line, rPoints, positions: [] };
}

const trailV1 = makeTrail(0xff8800, rocketTexV1);
const trailV2 = makeTrail(0xd4af37, rocketTexV2);

// --- Planets & Moons ---
const planets = [];

planetsData.forEach((data) => {
  const a = data.distance;
  const b = a * Math.sqrt(1 - Math.pow(data.eccentricity, 2));
  const orbitCurve = new THREE.EllipseCurve(0, 0, a, b, 0, 2 * Math.PI, false, 0);
  const points = orbitCurve.getPoints(128);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.03 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  const planetGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const planetTexture = data.texture ? textureLoader.load(data.texture) : null;
  const planetMaterial = new THREE.MeshStandardMaterial({
    map: planetTexture,
    color: planetTexture ? 0xffffff : data.color,
    metalness: 0.1,
    roughness: 0.8,
    emissive: data.name === "Earth" ? 0x2271b3 : data.color,
    emissiveIntensity: data.name === "Earth" ? 0.5 : 0.3
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.userData = data;
  scene.add(planet);

  if (data.hasRings) {
    const ringGeometry = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: data.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planet.add(ring);
  }

  const moons = [];
  if (data.moons) {
    data.moons.forEach(moonData => {
      const moonGeometry = new THREE.SphereGeometry(moonData.radius, 16, 16);
      const moonTexture = moonData.texture ? textureLoader.load(moonData.texture) : null;
      const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
        color: moonTexture ? 0xffffff : moonData.color,
        metalness: 0.1,
        roughness: 0.9,
        emissive: 0xffffff,
        emissiveIntensity: 0.15
      });
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      moon.userData = { ...moonData, parentName: data.name };
      const moonObj = { mesh: moon, data: moonData, angle: Math.random() * Math.PI * 2, speed: moonData.speed };
      moons.push(moonObj);
      scene.add(moon);
    });
  }

  planets.push({ mesh: planet, data: data, a, b, angle: Math.random() * Math.PI * 2, speed: data.speed, moons });
});

// --- Interaction ---
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.1;

const planetInfo = document.getElementById('planet-info');
const planetName = document.getElementById('planet-name');
const planetFact = document.getElementById('planet-fun-fact');
const planetDesc = document.getElementById('planet-description');

const navList = [sunData, ...planetsData];
let currentNavIndex = -1;

const allMoons = [];
planetsData.forEach(p => { if (p.moons) p.moons.forEach(m => allMoons.push({ moon: m, planet: p })); });

const moonInfo = document.getElementById('moon-info');
const moonName = document.getElementById('moon-name');
const moonFact = document.getElementById('moon-fun-fact');
const moonDesc = document.getElementById('moon-description');

let interactionTargets = [sun, ...planets.map(p => p.mesh)];
function updateTargets() {
  interactionTargets = [sun, ...planets.map(p => p.mesh)];
  if (showMoons) { planets.forEach(p => { p.moons.forEach(m => interactionTargets.push(m.mesh)); }); }
}
updateTargets();

function getObjectByName(name) {
  if (name === "Sun") return sun;
  const pObj = planets.find(p => p.data.name === name);
  if (pObj) return pObj.mesh;
  for (let p of planets) {
    const mObj = p.moons.find(m => m.data.name === name);
    if (mObj) return mObj.mesh;
  }
  return null;
}

function focusOnObject(data) {
  const obj = getObjectByName(data.name);
  if (obj) {
    const targetPos = new THREE.Vector3();
    obj.getWorldPosition(targetPos);
    controls.target.lerp(targetPos, 0.1);
    const distance = (data.radius || 1) * 5 + 20;
    const direction = camera.position.clone().sub(controls.target).normalize();
    const newPos = targetPos.clone().add(direction.multiplyScalar(distance));
    camera.position.lerp(newPos, 0.05);
  }
}

let focusing = false;
let focusData = null;
let resettingToDefault = false;

window.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactionTargets);
  const validHit = intersects.find(i => i.object.userData && i.object.userData.name);
  if (validHit) {
    const object = validHit.object;
    if (hoveredObject !== object) {
      hoveredObject = object;
      if (!pinnedObject) {
         if(object.userData.parentName) {
            let parentPlanet = navList.find(p => p.name === object.userData.parentName);
            if(parentPlanet) showInfo(parentPlanet);
         } else {
            showInfo(object.userData);
         }
      }
    }
    document.body.style.cursor = 'pointer';
  } else {
    hoveredObject = null;
    document.body.style.cursor = 'default';
    if (!pinnedObject) {
      planetInfo.style.opacity = '0';
      planetInfo.style.pointerEvents = 'none';
      planetInfo.style.transform = 'translateY(-20px)';
      hideMoonInfo();
    }
  }
});

window.addEventListener('click', (event) => {
  if (hoveredObject && hoveredObject.userData && hoveredObject.userData.name) {
    if (hoveredObject.userData.parentName) {
      let parentPlanet = navList.find(p => p.name === hoveredObject.userData.parentName);
      if(showMoons) {
         pinnedObject = getObjectByName(parentPlanet.name);
         currentNavIndex = navList.findIndex(b => b.name === parentPlanet.name);
         focusing = true;
         focusData = parentPlanet;
         showInfo(parentPlanet);
         showMoonInfo(hoveredObject.userData);
      } else {
         pinnedObject = getObjectByName(parentPlanet.name);
         currentNavIndex = navList.findIndex(b => b.name === parentPlanet.name);
         focusing = true;
         focusData = parentPlanet;
         showInfo(parentPlanet);
      }
    } else {
      pinnedObject = hoveredObject;
      currentNavIndex = navList.findIndex(b => b.name === pinnedObject.userData.name);
      showInfo(hoveredObject.userData);
      focusing = true;
      focusData = hoveredObject.userData;
    }
  }
});

document.addEventListener('openPlanetCarousel', () => {
  if (!pinnedObject) {
    const defaultData = navList[0];
    pinnedObject = getObjectByName(defaultData.name);
    currentNavIndex = 0;
    showInfo(defaultData);
    focusing = true;
    focusData = defaultData;
  }
});

function populateGrid(data, prefix) {
  const g = (id, key) => { const el = document.getElementById(prefix + id); if (el) el.innerText = data[key] || 'N/A'; };
  g('mass', 'mass'); g('vol', 'volume'); g('eqrad', 'eqRadius'); g('polrad', 'polarRadius'); g('den', 'density'); g('grav', 'gravity'); g('esc', 'escapeVelocity');
  g('dist', 'meanDistance'); g('peri', 'perihelion'); g('aph', 'aphelion'); g('orbper', 'orbitalPeriod'); g('orbvel', 'orbitalVelocity'); g('ecc', 'orbEccentricity'); g('inc', 'inclination');
  g('day', 'dayLength'); g('tilt', 'axialTilt'); g('temp', 'meanTemp'); g('pres', 'surfacePressure'); g('atmos', 'atmosphere');
  g('moons', 'moonsCount'); g('rings', 'ringSystem'); g('mag', 'globalMagneticField'); g('disc', 'discoverer'); g('discdate', 'discoveryDate');
}

function showInfo(data) {
  planetName.innerText = data.name;
  populateGrid(data, 'p-');
  planetFact.innerText = data.funFact || 'Exploring the unknown...';
  planetDesc.innerText = data.description || '';
  const moonsList = document.getElementById('planet-moons-list');
  if (data.moons && data.moons.length > 0) {
    moonsList.innerHTML = '';
    data.moons.forEach((m, idx) => {
      const span = document.createElement('span');
      span.innerText = m.name;
      span.className = 'moon-link';
      span.onclick = (e) => { e.stopPropagation(); showMoonInfo(m); };
      moonsList.appendChild(span);
      if(idx < data.moons.length - 1) moonsList.appendChild(document.createTextNode(', '));
    });
  } else { moonsList.innerText = 'None'; }
  planetInfo.style.opacity = '1';
  planetInfo.style.pointerEvents = 'auto';
  planetInfo.style.transform = 'none';
  if (data.moons && data.moons.length > 0) { showMoonInfo(data.moons[0]); } else { hideMoonInfo(); }
}

function showMoonInfo(moonData) {
  moonName.innerText = moonData.name;
  populateGrid(moonData, 'm-');
  moonFact.innerText = moonData.funFact || 'A silent witness to cosmic history...';
  moonDesc.innerText = moonData.description || '';
  moonInfo.style.opacity = '1';
  moonInfo.style.pointerEvents = 'auto';
  moonInfo.style.transform = 'none';
}

function hideMoonInfo() {
  moonInfo.style.opacity = '0';
  moonInfo.style.pointerEvents = 'none';
  moonInfo.style.transform = 'translateY(-20px)';
}

document.getElementById('prev-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentNavIndex = (currentNavIndex - 1 + navList.length) % navList.length;
  const data = navList[currentNavIndex];
  pinnedObject = getObjectByName(data.name);
  showInfo(data);
  focusing = true; focusData = data;
});

document.getElementById('next-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentNavIndex = (currentNavIndex + 1) % navList.length;
  const data = navList[currentNavIndex];
  pinnedObject = getObjectByName(data.name);
  showInfo(data);
  focusing = true; focusData = data;
});

document.getElementById('close-info').addEventListener('click', () => {
  pinnedObject = null; focusing = false;
  planetInfo.style.opacity = '0'; planetInfo.style.pointerEvents = 'none'; planetInfo.style.transform = 'translateY(-20px)';
  hideMoonInfo(); resettingToDefault = true;
});

document.getElementById('close-moon-info').addEventListener('click', () => { hideMoonInfo(); });

const moonToggle = document.getElementById('toggle-moons');
if (moonToggle) {
  moonToggle.addEventListener('change', (e) => {
    showMoons = e.target.checked;
    planets.forEach(p => { if (p.moons) p.moons.forEach(m => { m.mesh.visible = showMoons && !isFormationAnimating; }); });
    updateTargets();
  });
}

document.addEventListener('startFormation', () => {
  const formationUi = document.getElementById('formation-ui');
  const formationStageText = document.getElementById('formation-stage-text');
  if (!formationUi) return;
  isFormationAnimating = true; formationTime = 0; formationSpeed = 1; formationPaused = false;
  document.getElementById('play-pause-btn').innerText = '⏸️';
  document.getElementById('formation-timeline').value = 0;
  sun.visible = false; sunGlow.visible = false; asteroidBelt.visible = false; kuiperBelt.visible = false;
  planets.forEach(p => { p.mesh.visible = false; p.moons.forEach(m => m.mesh.visible = false); });
  dustSystem.visible = true; dustMat.opacity = 1.0;
  camera.position.set(0, 300, 600); controls.target.set(0, 0, 0);
  pinnedObject = null; focusing = false;
  formationUi.style.display = 'flex';
  formationStageText.innerText = "✨ Giant Molecular Cloud";
});

document.addEventListener('skipFormation', () => { if (isFormationAnimating) formationTime = 20; });
document.addEventListener('toggleFormationPause', () => { 
  if (!isFormationAnimating) return; 
  formationPaused = !formationPaused; 
  const playBtn = document.getElementById('play-pause-btn');
  if (playBtn) {
    playBtn.dataset.state = formationPaused ? 'paused' : 'playing';
    playBtn.innerText = formationPaused ? '▶️' : '⏸️';
  }
});
document.addEventListener('scrubFormation', (e) => { if (isFormationAnimating) formationTime = e.detail.time; });
document.addEventListener('changeFormationSpeed', (e) => { formationSpeed = e.detail.speed; });

function updateTrail(trail, x, z) {
  const attr = trail.line.geometry.attributes.position;
  const arr = attr.array;
  trail.positions.push(x, 0, z);
  if (trail.positions.length > trailMaxPoints * 3) trail.positions.splice(0, 3);
  const count = Math.min(trail.positions.length / 3, trailMaxPoints);
  for (let i = 0; i < count * 3; i++) arr[i] = trail.positions[i];
  trail.line.geometry.setDrawRange(0, count);
  attr.needsUpdate = true;
  const rAttr = trail.rPoints.geometry.attributes.position;
  const rArr = rAttr.array;
  const rocketCount = Math.min(Math.floor(count / 4), rocketMaxPoints);
  for (let i = 0; i < rocketCount; i++) {
    const ti = i * 4 * 3;
    rArr[i * 3] = arr[ti];
    rArr[i * 3 + 1] = arr[ti + 1] + 0.3;
    rArr[i * 3 + 2] = arr[ti + 2];
  }
  trail.rPoints.geometry.setDrawRange(0, rocketCount);
  rAttr.needsUpdate = true;
}

document.addEventListener('startVoyagerMode', () => {
  // Force reset formation state if active
  isFormationAnimating = false;
  const formationUi = document.getElementById('formation-ui');
  if (formationUi) formationUi.style.display = 'none';

  // Restore base scene state
  sun.visible = true; sunGlow.visible = true; 
  asteroidBelt.visible = true; kuiperBelt.visible = true;
  dustSystem.visible = false;
  planets.forEach(p => { 
    p.mesh.visible = true; p.mesh.scale.setScalar(1); 
    p.mesh.material.color.setHex(p.data.texture ? 0xffffff : new THREE.Color(p.data.color).getHex());
  });

  isVoyagerMode = true; voyagerTime = 0; voyagerSpeed = 1; voyagerPaused = true; voyagerCockpitView = false;
  trailV1.positions = []; trailV2.positions = [];
  
  // ... rest of startVoyagerMode ...
  planets.forEach(p => { if (p.moons) p.moons.forEach(m => m.mesh.visible = showMoons); });
  voyagerCraftId = 2; voyagerEventDotsBuilt = false;
  const badge = document.getElementById('voyager-badge');
  const badgeStart = document.getElementById('voyager-badge-start');
  const range = getVoyagerDateRange(voyagerCraftId);
  if (badge) badge.style.display = 'block';
  if (badgeStart) badgeStart.innerText = new Date(range.startMs).getFullYear();
  updateVoyagerCraftVisibility(); updateVoyagerCraftButtons(); rebuildVoyagerFlybyTrack();
  trailV1.line.visible = true; trailV1.rPoints.visible = true; trailV2.line.visible = true; trailV2.rPoints.visible = true;
  pinnedObject = null; focusing = false;
  planetInfo.style.opacity = '0'; planetInfo.style.pointerEvents = 'none'; planetInfo.style.transform = 'translateY(-20px)';
  hideMoonInfo(); voyagerLastFlyby = '';
  const fab = document.getElementById('fab-voyager');
  const closeFab = document.getElementById('fab-voyager-close');
  const switchFab = document.getElementById('fab-voyager-switch');
  if (fab) {
    fab.dataset.voyagerActive = 'true';
  }
  if (closeFab) closeFab.style.display = 'flex';
  if (switchFab) { switchFab.style.display = 'none'; }
  rebuildVoyagerFlybyTrack();
});

document.addEventListener('togglePlanetCarousel', () => {
  if (isFormationAnimating) {
    document.dispatchEvent(new Event('skipFormation'));
  }
  
  if (pinnedObject) {
    pinnedObject = null; focusing = false;
    planetInfo.style.opacity = '0'; planetInfo.style.pointerEvents = 'none'; planetInfo.style.transform = 'translateY(-20px)';
    hideMoonInfo(); resettingToDefault = true;
  } else if (!isFormationAnimating) {
    const defaultData = navList[0];
    pinnedObject = getObjectByName(defaultData.name);
    currentNavIndex = 0;
    showInfo(defaultData);
    focusing = true;
    focusData = defaultData;
  }
});

document.addEventListener('toggleGenesisMode', () => {
  if (isFormationAnimating) {
    document.dispatchEvent(new Event('toggleFormationPause'));
  } else {
    document.dispatchEvent(new Event('startFormation'));
  }
});

document.addEventListener('toggleVoyagerPause', () => { if (isVoyagerMode) voyagerPaused = !voyagerPaused; });
document.addEventListener('changeVoyagerSpeed', (e) => { voyagerSpeed = e.detail.speed; });

document.addEventListener('switchVoyagerCraft', (e) => {
  if (!isVoyagerMode) return;
  const newCraftId = e.detail.craft; if (newCraftId === voyagerCraftId) return;
  const oldRange = getVoyagerDateRange(voyagerCraftId);
  const currentDateMs = oldRange.startMs + voyagerTime * (oldRange.endMs - oldRange.startMs);
  voyagerCraftId = newCraftId; const newRange = getVoyagerDateRange(voyagerCraftId);
  let newT = (currentDateMs - newRange.startMs) / (newRange.endMs - newRange.startMs);
  voyagerTime = Math.max(0, Math.min(1, newT));
  voyagerPaused = false; voyagerEventDotsBuilt = false;
  const badgeStart = document.getElementById('voyager-badge-start');
  if (badgeStart) badgeStart.innerText = new Date(newRange.startMs).getFullYear();
  const switchFab = document.getElementById('fab-voyager-switch');
  if (switchFab) switchFab.innerText = voyagerCraftId === 1 ? 'V2' : 'V1';
  updateVoyagerCraftVisibility(); updateVoyagerCraftButtons(); rebuildVoyagerFlybyTrack();
});

document.addEventListener('closeVoyagerMode', () => {
  isVoyagerMode = false; voyagerCockpitView = false; voyagerEventDotsBuilt = false; voyagerLastFlyby = '';
  updateVoyagerImageOverlay(null, false);
  
  const fab = document.getElementById('fab-voyager'); const closeFab = document.getElementById('fab-voyager-close');
  const switchFab = document.getElementById('fab-voyager-switch'); const badge = document.getElementById('voyager-badge');
  if (fab) { fab.dataset.voyagerActive = 'false'; const icon = fab.querySelector('.fab-icon'); if (icon) icon.textContent = '🛸'; }
  if (closeFab) closeFab.style.display = 'none'; if (switchFab) switchFab.style.display = 'none'; if (badge) badge.style.display = 'none';
  trailV1.line.visible = false; trailV1.rPoints.visible = false; trailV2.line.visible = false; trailV2.rPoints.visible = false;
  updateVoyagerCraftVisibility(); updateVoyagerCraftButtons(); rebuildVoyagerFlybyTrack();
});

function updateVoyagerCraftVisibility() { voyagerCraft1.visible = isVoyagerMode; voyagerCraft2.visible = isVoyagerMode; }

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05; controls.maxDistance = 1500;

function animate() {
  requestAnimationFrame(animate); const delta = 0.01;
  if (isFormationAnimating) {
    if (!formationPaused) { formationTime += delta * formationSpeed; const timelineSlider = document.getElementById('formation-timeline'); if (timelineSlider && document.activeElement !== timelineSlider) timelineSlider.value = formationTime; }
    const t = formationTime / 20; let yearsAgo = 0;
    if (t < 0.4) yearsAgo = 4.60 - (t / 0.4) * 0.04; else if (t < 0.7) yearsAgo = 4.56 - ((t - 0.4) / 0.3) * 0.06; else if (t < 0.9) yearsAgo = 4.50 - ((t - 0.7) / 0.2) * 0.70; else yearsAgo = 3.80 - ((t - 0.9) / 0.1) * 3.80;
    const timeCounter = document.getElementById('formation-time-counter'); if (timeCounter) timeCounter.innerText = yearsAgo > 0.01 ? `${yearsAgo.toFixed(2)} Billion Years Ago` : "Present Day";
    
    // Sync Runner position & state
    const runner = document.getElementById('timeline-runner');
    if (runner) {
      const timeline = document.getElementById('formation-timeline');
      if (timeline) {
        const pct = (timeline.value / timeline.max) * 100;
        runner.style.left = `${pct}%`;
        
        // Dynamic speed based on formationSpeed
        const runDur = Math.max(0.1, 0.55 / formationSpeed);
        runner.style.setProperty('--run-dur', `${runDur}s`);

        // Dynamic Color Transition: blue (#b8d8ff) -> yellow (#ffff00) -> gold (#ffd700) -> pink (#ffc0cb) -> red (#ff0000)
        const hexToRgb = (hex) => {
           const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
           return [r, g, b];
        };
        const colors = ['#b8d8ff', '#ffff00', '#ffd700', '#ffc0cb', '#ff0000'];
        const rgbColors = colors.map(hexToRgb);
        
        const floatIdx = t * (colors.length - 1);
        const idx1 = Math.floor(floatIdx);
        const idx2 = Math.min(idx1 + 1, colors.length - 1);
        const lerpFactor = floatIdx - idx1;
        
        const r = Math.round(rgbColors[idx1][0] + (rgbColors[idx2][0] - rgbColors[idx1][0]) * lerpFactor);
        const g = Math.round(rgbColors[idx1][1] + (rgbColors[idx2][1] - rgbColors[idx1][1]) * lerpFactor);
        const b = Math.round(rgbColors[idx1][2] + (rgbColors[idx2][2] - rgbColors[idx1][2]) * lerpFactor);
        
        runner.style.setProperty('--rc', `rgb(${r}, ${g}, ${b})`); 
      }
    }
    
    const camX = Math.sin(t * Math.PI * 2) * (600 - t * 150); const camY = 300 + t * (150 - 300); const camZ = Math.cos(t * Math.PI * 2) * (600 - t * 150);
    camera.position.set(camX, camY, camZ); camera.lookAt(0,0,0);
    if (t < 0.9) {
      dustSystem.visible = true; const positions = dustGeo.attributes.position.array; const timeOffset = Date.now() * 0.001;
      const spiralWeight = Math.min(Math.max((t - 0.1) * 3, 0), 1); const ringWeight = Math.min(Math.max((t - 0.5) * 2, 0), 1); const opacityFade = Math.min(Math.max((0.9 - t) * 10, 0), 1);
      dustMat.opacity = opacityFade;
      for(let i=0; i<dustCount; i++) {
        const r0 = initialData[i*4]; const theta0 = initialData[i*4+1]; const phi0 = initialData[i*4+2]; const phase = initialData[i*4+3];
        let x = r0 * Math.sin(phi0) * Math.cos(theta0 + timeOffset * 0.1), y = r0 * Math.cos(phi0), z = r0 * Math.sin(phi0) * Math.sin(theta0 + timeOffset * 0.1);
        const spiralRadius = r0 * 0.6, spiralTheta = theta0 + spiralRadius * 0.02 + timeOffset * 0.5;
        const spiralX = spiralRadius * Math.cos(spiralTheta), spiralY = (Math.random() - 0.5) * 40, spiralZ = spiralRadius * Math.sin(spiralTheta);
        x += (spiralX - x) * spiralWeight; y += (spiralY - y) * spiralWeight; z += (spiralZ - z) * spiralWeight;
        if (ringWeight > 0) {
          const planetIndex = i % planets.length; const pData = planets[planetIndex];
          const ringRadius = pData.a * 1.5, ringTheta = spiralTheta * 2;
          const ringX = ringRadius * Math.cos(ringTheta), ringY = Math.sin(phase + timeOffset) * 5, ringZ = ringRadius * Math.sin(ringTheta);
          x += (ringX - x) * ringWeight; y += (ringY - y) * ringWeight; z += (ringZ - z) * ringWeight;
        }
        positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
      }
      dustGeo.attributes.position.needsUpdate = true;
    } else { dustSystem.visible = false; }
    if (t > 0.5) {
       sun.visible = true; sunGlow.visible = true; const pProgress = (t - 0.5) * 2;
       planets.forEach(p => {
           p.mesh.visible = true; p.mesh.scale.setScalar(0.1 + pProgress * 0.9);
           const origColor = p.data.texture ? new THREE.Color(0xffffff) : new THREE.Color(p.data.color);
           const origEmissive = p.data.name === "Earth" ? new THREE.Color(0x2271b3) : new THREE.Color(p.data.color);
           p.mesh.material.color.lerpColors(new THREE.Color(0xffaa00), origColor, pProgress);
           p.mesh.material.emissive.lerpColors(new THREE.Color(0xff3300), origEmissive, pProgress);
           p.mesh.material.emissiveIntensity = 2.0 - pProgress * (2.0 - (p.data.name === "Earth" ? 0.5 : 0.3));
           p.angle += p.speed * timeScale * 0.5 * (1 + (1 - pProgress)*5); p.mesh.position.set(p.a * Math.cos(p.angle), 0, p.b * Math.sin(p.angle));
       });
    }
    if (t > 0.75) {
       asteroidBelt.visible = true; kuiperBelt.visible = true; const beltProgress = Math.min((t - 0.75) * 4, 1);
       asteroidBelt.material.opacity = beltProgress * 0.8; kuiperBelt.material.opacity = beltProgress * 0.8;
    }
    if (formationTime >= 20) {
       isFormationAnimating = false; document.getElementById('formation-ui').style.display = 'none';
       planets.forEach(p => { p.mesh.scale.setScalar(1); if (showMoons) p.moons.forEach(m => m.mesh.visible = true); });
       camera.position.set(0, 150, 450); controls.target.set(0,0,0);
    }
  } else if (isVoyagerMode) {
    if (!voyagerPaused) { voyagerTime += delta * voyagerSpeed * 0.05; if (voyagerTime >= 1) { voyagerTime = 1; voyagerPaused = true; document.dispatchEvent(new Event('closeVoyagerMode')); } }
    const state = getVoyagerState(voyagerTime, voyagerCraftId), stateV1 = getVoyagerState(voyagerTime, 1), stateV2 = getVoyagerState(voyagerTime, 2);
    if (!state) { controls.update(); renderer.render(scene, camera); return; }
    const badge = document.getElementById('voyager-badge'), badgeCurrent = document.getElementById('voyager-badge-current');
    if (badge) badge.style.display = 'block';
    if (badgeCurrent) {
      const d = new Date(state.currentDateMs);
      // Logic: Show full date for first 5% of mission, then just Year
      if (voyagerTime < 0.05) {
        badgeCurrent.innerText = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
      } else {
        badgeCurrent.innerText = d.getFullYear();
      }
      
      // Visual feedback for pause
      if (badge) {
        badge.style.borderColor = voyagerPaused ? 'rgba(255,200,0,0.6)' : '#00ccff';
        badge.style.boxShadow = voyagerPaused ? '0 0 25px rgba(255,200,0,0.3)' : '0 0 25px rgba(0,204,255,0.5)';
      }
    }
    updateVoyagerEventDots(state);
    const planetPositions = getAllPlanetPositions(state.currentDateMs);
    planets.forEach(p => { const pos = planetPositions[p.data.name]; if (pos) { p.angle = pos.angle; p.mesh.position.set(p.a * Math.cos(pos.angle), 0, (p.a * Math.sqrt(1 - Math.pow(p.data.eccentricity||0, 2))) * Math.sin(pos.angle)); } p.mesh.rotation.y += 0.01; });
    planets.forEach(p => { if (p.moons) p.moons.forEach(m => { m.angle += m.speed * 0.5; m.mesh.position.set(p.mesh.position.x + m.data.distance * Math.cos(m.angle), 0, p.mesh.position.z + m.data.distance * Math.sin(m.angle)); }); });
    voyagerCraft1.position.set(stateV1.scX, 0, stateV1.scZ); voyagerCraft2.position.set(stateV2.scX, 0, stateV2.scZ);
    function orientCraft(c, s) { if (s.vx !== undefined && s.vz !== undefined) { if (Math.abs(s.vx) > 0.0001 || Math.abs(s.vz) > 0.0001) { c.rotation.y = Math.atan2(s.vx, s.vz); return; } } }
    orientCraft(voyagerCraft1, stateV1); orientCraft(voyagerCraft2, stateV2);
    updateTrail(trailV1, stateV1.scX, stateV1.scZ); updateTrail(trailV2, stateV2.scX, stateV2.scZ);
    sun.rotation.y += 0.002; const pulse = 1 + Math.sin(Date.now() * 0.001) * 0.02; sunGlow.scale.setScalar(pulse);
    if (state.flybyActive && state.flybyEvent) { if (state.flybyEvent.name !== voyagerLastFlyby) { voyagerLastFlyby = state.flybyEvent.name; if (state.flybyEvent.type === 'flyby' || state.flybyEvent.type === 'milestone') updateVoyagerImageOverlay(state.flybyEvent.name, true); } } else { updateVoyagerImageOverlay(null, false); voyagerLastFlyby = ''; }
    asteroidBelt.rotation.y += asteroidBelt.userData.speed * 5; kuiperBelt.rotation.y += kuiperBelt.userData.speed * 5;
  } else {
    planets.forEach((p) => { p.angle += p.speed * timeScale * 0.5; p.mesh.position.set(p.a * Math.cos(p.angle), 0, p.b * Math.sin(p.angle)); p.mesh.rotation.y += 0.01; if (p.moons) p.moons.forEach((m) => { m.angle += m.speed * timeScale; m.mesh.position.set(p.mesh.position.x + m.data.distance * Math.cos(m.angle), 0, p.mesh.position.z + m.data.distance * Math.sin(m.angle)); }); });
    asteroidBelt.rotation.y += asteroidBelt.userData.speed; kuiperBelt.rotation.y += kuiperBelt.userData.speed;
  }
  let uiOffset = focusing ? (window.innerWidth > 768 ? 200 : 0) : 0; if (focusing && moonInfo.style.opacity === '1') uiOffset = window.innerWidth > 1024 ? 400 : uiOffset;
  targetViewOffsetX = uiOffset;
  if (Math.abs(targetViewOffsetX - currentViewOffsetX) > 0.5) { currentViewOffsetX += (targetViewOffsetX - currentViewOffsetX) * 0.1; camera.setViewOffset(window.innerWidth, window.innerHeight, currentViewOffsetX, 0, window.innerWidth, window.innerHeight); } else if (currentViewOffsetX !== 0 && targetViewOffsetX === 0) { currentViewOffsetX = 0; camera.clearViewOffset(); }
  if (focusing && focusData) focusOnObject(focusData); else if (resettingToDefault) { controls.target.lerp(new THREE.Vector3(0,0,0), 0.05); camera.position.lerp(new THREE.Vector3(0,150,450), 0.05); if (controls.target.distanceTo(new THREE.Vector3(0,0,0)) < 0.1) resettingToDefault = false; }
  controls.update(); renderer.render(scene, camera);
}
animate();

let voyagerEventDotsBuilt = false;
function buildVoyagerEventDots() {
  const track = document.getElementById('voyager-events-track'); if (!track) return; track.innerHTML = '';
  const events = getVoyagerTimeline(voyagerCraftId), range = getVoyagerDateRange(voyagerCraftId), markers = events.filter(e => e.type === 'flyby' || e.type === 'milestone');
  markers.forEach((event) => {
    const dot = document.createElement('div'); dot.className = 'voyager-event-dot'; dot.dataset.date = event.date;
    const eventT = (new Date(event.date).getTime() - range.startMs) / (range.endMs - range.startMs);
    dot.style.position = 'absolute'; dot.style.left = `${eventT * 100}%`; dot.style.transform = 'translateX(-50%)';
    dot.title = `${event.name}`; if (event.type === 'milestone') { dot.style.background = 'rgba(255,200,50,0.3)'; dot.style.borderColor = 'rgba(255,200,50,0.5)'; }
    track.appendChild(dot);
  });
  voyagerEventDotsBuilt = true;
}

function updateVoyagerCraftButtons() {
  const c1 = document.getElementById('voyager-craft-1'), c2 = document.getElementById('voyager-craft-2'); if (!c1 || !c2) return;
  c1.style.background = voyagerCraftId === 1 ? 'rgba(0,200,255,0.2)' : 'transparent'; c1.style.color = voyagerCraftId === 1 ? '#fff' : 'rgba(255,255,255,0.5)';
  c2.style.background = voyagerCraftId === 2 ? 'rgba(0,200,255,0.2)' : 'transparent'; c2.style.color = voyagerCraftId === 2 ? '#fff' : 'rgba(255,255,255,0.5)';
}

function rebuildVoyagerFlybyTrack() {
  const track = document.getElementById('voyager-flyby-track'); if (!track) return; track.innerHTML = '';
  const events = getVoyagerTimeline(voyagerCraftId), markers = events.filter(e => e.type === 'flyby' || e.type === 'milestone');
  markers.forEach((event) => {
    const marker = document.createElement('div'); marker.className = 'voyager-flyby-marker';
    const label = event.targetPlanet || event.name.replace(/ .*/, '');
    marker.innerHTML = `<span class="marker-dot"></span><br>${label}`; marker.dataset.planet = event.targetPlanet || ''; marker.dataset.eventType = event.type;
    if (event.type === 'milestone') { marker.style.color = 'rgba(255,200,50,0.3)'; marker.querySelector('.marker-dot').style.background = 'rgba(255,200,50,0.2)'; }
    track.appendChild(marker);
  });
}

const FLYBY_IMAGES = {
  'Jupiter Flyby': { url: 'https://images-assets.nasa.gov/image/PIA00343/PIA00343~orig.jpg', caption: 'Jupiter\'s Great Red Spot — Voyager 1' },
  'Saturn Flyby': { url: 'https://images-assets.nasa.gov/image/PIA02224/PIA02224~orig.jpg', caption: 'Saturn\'s majestic rings — Voyager 2' },
  'Uranus Flyby': { url: 'https://images-assets.nasa.gov/image/PIA00142/PIA00142~orig.jpg', caption: 'Uranus — Voyager 2, 1986' },
  'Neptune Flyby': { url: 'https://images-assets.nasa.gov/image/PIA01492/PIA01492~medium.jpg', caption: 'Neptune — Voyager 2, 1989' },
  'Pale Blue Dot': { url: 'https://images-assets.nasa.gov/image/PIA23645/PIA23645~medium.jpg', caption: 'The Pale Blue Dot — Earth from 6 billion km' },
  'Kuiper Belt Crossing': { url: 'https://images-assets.nasa.gov/image/PIA17046/PIA17046~medium.jpg', caption: 'Entering the Kuiper Belt' },
  'Interstellar Space': { url: 'https://images-assets.nasa.gov/image/PIA22949/PIA22949~orig.jpg', caption: 'Voyager enters interstellar space' },
};

function updateVoyagerImageOverlay(eventName, show) {
  const overlay = document.getElementById('voyager-image-overlay'); if (!overlay) return;
  if (!show || !eventName || !FLYBY_IMAGES[eventName]) { overlay.style.opacity = '0'; setTimeout(() => { if (overlay.style.opacity === '0') overlay.style.display = 'none'; }, 1100); return; }
  const imgData = FLYBY_IMAGES[eventName], imgEl = document.getElementById('voyager-flyby-img'), capEl = document.getElementById('voyager-img-caption');
  if (imgEl) { imgEl.style.display = 'block'; imgEl.src = imgData.url; }
  if (capEl) capEl.innerText = imgData.caption;
  overlay.style.display = 'block'; void overlay.offsetWidth; overlay.style.opacity = '1';
}

let currentLightboxImageIndex = -1;
const flybyImageKeys = Object.keys(FLYBY_IMAGES);
function updateLightboxContent(index) {
  if (index < 0 || index >= flybyImageKeys.length) return;
  currentLightboxImageIndex = index; const key = flybyImageKeys[index], imgData = FLYBY_IMAGES[key];
  const lbImg = document.getElementById('voyager-lightbox-img'), lbCap = document.getElementById('voyager-lightbox-caption');
  if (!lbImg || !lbCap) return;
  lbImg.style.opacity = '0';
  setTimeout(() => { lbImg.src = imgData.url; lbCap.innerText = imgData.caption; lbImg.style.opacity = '1'; }, 150);
}

document.addEventListener('click', function (e) {
  if (e.target.closest('#voyager-img-close')) return;
  const prevBtn = e.target.closest('#voyager-lightbox-prev'), nextBtn = e.target.closest('#voyager-lightbox-next');
  if (prevBtn) { e.stopPropagation(); updateLightboxContent((currentLightboxImageIndex - 1 + flybyImageKeys.length) % flybyImageKeys.length); return; }
  if (nextBtn) { e.stopPropagation(); updateLightboxContent((currentLightboxImageIndex + 1) % flybyImageKeys.length); return; }
  const overlay = document.getElementById('voyager-image-overlay');
  if (overlay && overlay.contains(e.target) && overlay.style.display !== 'none' && parseFloat(overlay.style.opacity) > 0) {
    const capEl = document.getElementById('voyager-img-caption'); if (!capEl) return;
    const foundIdx = flybyImageKeys.findIndex(k => FLYBY_IMAGES[k].caption === capEl.innerText);
    const lb = document.getElementById('voyager-lightbox'); if (!lb) return;
    updateLightboxContent(foundIdx !== -1 ? foundIdx : 0);
    lb.style.display = 'flex'; void lb.offsetWidth; lb.style.opacity = '1';
  }
});

document.addEventListener('click', function (e) {
  const closeBtn = e.target.closest('#voyager-img-close'); if (!closeBtn) return;
  const overlay = document.getElementById('voyager-image-overlay'); if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { if (overlay.style.opacity === '0') overlay.style.display = 'none'; }, 1100); }
});

document.addEventListener('click', function (e) {
  const lb = document.getElementById('voyager-lightbox'); if (!lb || lb.style.display === 'none') return;
  if (e.target === lb || e.target.closest('#voyager-lightbox-close')) { lb.style.opacity = '0'; setTimeout(() => { lb.style.display = 'none'; }, 300); }
});

function updateVoyagerEventDots(state) {
  const track = document.getElementById('voyager-events-track'); if (!track) return;
  if (!voyagerEventDotsBuilt) buildVoyagerEventDots();
  const dots = track.querySelectorAll('.voyager-event-dot');
  dots.forEach(dot => { const isActive = state.flybyEvent && state.flybyEvent.date === dot.dataset.date; dot.classList.toggle('active', !!isActive); });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  if (currentViewOffsetX > 0.5) camera.setViewOffset(window.innerWidth, window.innerHeight, currentViewOffsetX, 0, window.innerWidth, window.innerHeight); else camera.clearViewOffset();
  camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);        
});

// Start Genesis formation on load
document.dispatchEvent(new Event('startFormation'));
