import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { planetsData, sunData } from './planets.js';

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

// --- Planets & Moons ---
const planets = [];
const moonGroups = []; // Groups to toggle visibility

planetsData.forEach((data) => {
  // Orbit line
  const a = data.distance;
  const b = a * Math.sqrt(1 - Math.pow(data.eccentricity, 2));
  const orbitCurve = new THREE.EllipseCurve(0, 0, a, b, 0, 2 * Math.PI, false, 0);
  const points = orbitCurve.getPoints(128);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.03 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  // Planet Mesh
  const planetGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
  const planetTexture = data.texture ? textureLoader.load(data.texture) : null;
  const planetMaterial = new THREE.MeshStandardMaterial({
    map: planetTexture,
    color: planetTexture ? 0xffffff : data.color,
    metalness: 0.1,
    roughness: 0.8,
    emissive: data.name === "Earth" ? 0x2271b3 : data.color,
    emissiveIntensity: data.name === "Earth" ? 0.5 : 0.3 // Earth is brightest planet
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.userData = data;
  scene.add(planet);

  // Saturn's Rings
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

  // Moons
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
        emissiveIntensity: 0.15 // Brighter than stars
      });
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      moon.userData = { ...moonData, parentName: data.name };
      
      const moonObj = {
        mesh: moon,
        data: moonData,
        angle: Math.random() * Math.PI * 2,
        speed: moonData.speed
      };
      moons.push(moonObj);
      scene.add(moon);
    });
  }

  const planetObj = {
    mesh: planet,
    data: data,
    a: a,
    b: b,
    angle: Math.random() * Math.PI * 2,
    speed: data.speed,
    moons: moons
  };
  
  planets.push(planetObj);
});

// --- Interaction ---
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.1; // Easier selection

const planetInfo = document.getElementById('planet-info');
const planetName = document.getElementById('planet-name');
const planetMass = document.getElementById('planet-mass');
const planetGrav = document.getElementById('planet-gravity');
const planetTemp = document.getElementById('planet-temp');
const planetVel = document.getElementById('planet-velocity');
const planetRadiusKm = document.getElementById('planet-radius-km');
const planetOrbitalPeriod = document.getElementById('planet-orbital-period');
const planetDayLength = document.getElementById('planet-day-length');
const planetMoonsCount = document.getElementById('planet-moons-count');
const planetFact = document.getElementById('planet-fun-fact');
const planetDesc = document.getElementById('planet-description');

// Navigation List
const navList = [sunData, ...planetsData];
let currentNavIndex = -1;

// Moon Subpanel State
const allMoons = [];
planetsData.forEach(p => {
  if (p.moons) {
    p.moons.forEach(m => {
      allMoons.push({ moon: m, planet: p });
    });
  }
});
let globalMoonNavIndex = -1;
let isGlobalMoonMode = false;
let currentPlanetMoons = [];
let localMoonNavIndex = -1;

const moonInfo = document.getElementById('moon-info');
const moonName = document.getElementById('moon-name');
const moonMass = document.getElementById('moon-mass');
const moonGrav = document.getElementById('moon-gravity');
const moonTemp = document.getElementById('moon-temp');
const moonRadiusKm = document.getElementById('moon-radius-km');
const moonOrbitalPeriod = document.getElementById('moon-orbital-period');
const moonDayLength = document.getElementById('moon-day-length');
const moonFact = document.getElementById('moon-fun-fact');
const moonDesc = document.getElementById('moon-description');

// Interaction targets

// Interaction targets
let interactionTargets = [sun, ...planets.map(p => p.mesh)];
function updateTargets() {
  interactionTargets = [sun, ...planets.map(p => p.mesh)];
  if (showMoons) {
    planets.forEach(p => {
      p.moons.forEach(m => interactionTargets.push(m.mesh));
    });
  }
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

function navigateToGlobalMoon(index) {
  if(index < 0 || index >= allMoons.length) return;
  const item = allMoons[index];
  showMoonInfo(item.moon);
  
  // Keep focus on the planet level
  const parentPlanetMesh = getObjectByName(item.planet.name);
  if (parentPlanetMesh) {
    pinnedObject = parentPlanetMesh;
    currentNavIndex = navList.findIndex(b => b.name === item.planet.name);
    focusing = true;
    focusData = item.planet;
    showInfo(item.planet);
  }
}

function focusOnObject(data) {
  const obj = getObjectByName(data.name);
  if (obj) {
    const targetPos = new THREE.Vector3();
    obj.getWorldPosition(targetPos);
    
    // Smooth transition target for OrbitControls
    controls.target.lerp(targetPos, 0.1);
    
    // Adjust camera distance based on object size
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
      // Clicked a moon
      let parentPlanet = navList.find(p => p.name === hoveredObject.userData.parentName);
      
      if(showMoons) {
         isGlobalMoonMode = false;
         currentPlanetMoons = parentPlanet.moons;
         localMoonNavIndex = currentPlanetMoons.findIndex(m => m.name === hoveredObject.userData.name);
         
         pinnedObject = getObjectByName(parentPlanet.name);
         currentNavIndex = navList.findIndex(b => b.name === parentPlanet.name);
         focusing = true;
         focusData = parentPlanet;
         showInfo(parentPlanet);

         showMoonInfo(hoveredObject.userData);
      } else {
         // just focus planet if moons are hidden
         pinnedObject = getObjectByName(parentPlanet.name);
         currentNavIndex = navList.findIndex(b => b.name === parentPlanet.name);
         focusing = true;
         focusData = parentPlanet;
         showInfo(parentPlanet);
      }
    } else {
      // Clicked a planet or sun
      pinnedObject = hoveredObject;
      currentNavIndex = navList.findIndex(b => b.name === pinnedObject.userData.name);
      showInfo(hoveredObject.userData);
      focusing = true;
      focusData = hoveredObject.userData;
    }
  }
});

document.addEventListener('openPlanetCarousel', () => {
  // If nothing is currently pinned, default to the Sun or first planet in navList
  if (!pinnedObject) {
    const defaultData = navList[0]; // Sun
    pinnedObject = getObjectByName(defaultData.name);
    currentNavIndex = 0;
    showInfo(defaultData);
    focusing = true;
    focusData = defaultData;
  }
});

function populateGrid(data, prefix) {
  const g = (id, key) => { const el = document.getElementById(prefix + id); if (el) el.innerText = data[key] || 'N/A'; };
  g('mass', 'mass');
  g('vol', 'volume');
  g('eqrad', 'eqRadius');
  g('polrad', 'polarRadius');
  g('den', 'density');
  g('grav', 'gravity');
  g('esc', 'escapeVelocity');
  
  g('dist', 'meanDistance');
  g('peri', 'perihelion');
  g('aph', 'aphelion');
  g('orbper', 'orbitalPeriod');
  g('orbvel', 'orbitalVelocity');
  g('ecc', 'orbEccentricity');
  g('inc', 'inclination');
  
  g('day', 'dayLength');
  g('tilt', 'axialTilt');
  g('temp', 'meanTemp');
  g('pres', 'surfacePressure');
  g('atmos', 'atmosphere');
  
  g('moons', 'moonsCount');
  g('rings', 'ringSystem');
  g('mag', 'globalMagneticField');
  g('disc', 'discoverer');
  g('discdate', 'discoveryDate');
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
      span.onclick = (e) => {
        e.stopPropagation();
        isGlobalMoonMode = false;
        currentPlanetMoons = data.moons;
        localMoonNavIndex = idx;
        showMoonInfo(m);
      };
      moonsList.appendChild(span);
      if(idx < data.moons.length - 1) {
        moonsList.appendChild(document.createTextNode(', '));
      }
    });
  } else {
    moonsList.innerText = 'None';
  }
  
  planetInfo.style.opacity = '1';
  planetInfo.style.pointerEvents = 'auto';
  planetInfo.style.transform = 'none';

  if (data.moons && data.moons.length > 0) {
    isGlobalMoonMode = false;
    currentPlanetMoons = data.moons;
    localMoonNavIndex = 0;
    showMoonInfo(data.moons[0]);
  } else {
    hideMoonInfo();
  }
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

// Navigation Listeners
document.getElementById('prev-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentNavIndex = (currentNavIndex - 1 + navList.length) % navList.length;
  const data = navList[currentNavIndex];
  pinnedObject = { userData: data }; // Mock for logic
  const mesh = getObjectByName(data.name);
  if (mesh) pinnedObject = mesh;
  showInfo(data);
  focusing = true;
  focusData = data;
});

document.getElementById('next-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  currentNavIndex = (currentNavIndex + 1) % navList.length;
  const data = navList[currentNavIndex];
  pinnedObject = { userData: data }; // Mock for logic
  const mesh = getObjectByName(data.name);
  if (mesh) pinnedObject = mesh;
  showInfo(data);
  focusing = true;
  focusData = data;
});

document.getElementById('close-info').addEventListener('click', () => {
  pinnedObject = null;
  focusing = false;
  planetInfo.style.opacity = '0';
  planetInfo.style.pointerEvents = 'none';
  planetInfo.style.transform = 'translateY(-20px)';
  hideMoonInfo();
  resettingToDefault = true;
});

document.getElementById('close-moon-info').addEventListener('click', () => {
  hideMoonInfo();
});

document.getElementById('prev-moon-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (isGlobalMoonMode) {
    if(!allMoons.length) return;
    globalMoonNavIndex = (globalMoonNavIndex - 1 + allMoons.length) % allMoons.length;
    navigateToGlobalMoon(globalMoonNavIndex);
  } else {
    if(!currentPlanetMoons.length) return;
    localMoonNavIndex = (localMoonNavIndex - 1 + currentPlanetMoons.length) % currentPlanetMoons.length;
    showMoonInfo(currentPlanetMoons[localMoonNavIndex]);
  }
});

document.getElementById('next-moon-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if (isGlobalMoonMode) {
    if(!allMoons.length) return;
    globalMoonNavIndex = (globalMoonNavIndex + 1) % allMoons.length;
    navigateToGlobalMoon(globalMoonNavIndex);
  } else {
    if(!currentPlanetMoons.length) return;
    localMoonNavIndex = (localMoonNavIndex + 1) % currentPlanetMoons.length;
    showMoonInfo(currentPlanetMoons[localMoonNavIndex]);
  }
});

// Moon Toggle Logic
document.getElementById('toggle-moons').addEventListener('change', (e) => {
  showMoons = e.target.checked;
  planets.forEach(p => {
    p.moons.forEach(m => {
      m.mesh.visible = showMoons && !isFormationAnimating;
    });
  });
  updateTargets();
});

// Formation Event Listener
document.addEventListener('startFormation', () => {
  const formationUi = document.getElementById('formation-ui');
  const formationStageText = document.getElementById('formation-stage-text');
  
  if (!formationUi) return;

  isFormationAnimating = true;
  formationTime = 0;
  formationSpeed = 1;
  formationPaused = false;
  
  // UI Resets
  document.getElementById('play-pause-btn').innerText = '⏸️';
  document.getElementById('formation-timeline').value = 0;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.speed == '1');
    btn.style.background = btn.dataset.speed == '1' ? 'rgba(255,255,255,0.2)' : 'transparent';
    btn.style.color = btn.dataset.speed == '1' ? 'white' : 'rgba(255,255,255,0.5)';
  });
  
  // Hide normal solar system objects
  sun.visible = false;
  sunGlow.visible = false;
  asteroidBelt.visible = false;
  kuiperBelt.visible = false;
  planets.forEach(p => {
    p.mesh.visible = false;
    p.moons.forEach(m => m.mesh.visible = false);
  });
  
  dustSystem.visible = true;
  dustMat.opacity = 1.0;
  
  // Reset Camera
  camera.position.set(0, 300, 600);
  controls.target.set(0, 0, 0);
  pinnedObject = null;
  focusing = false;
  
  formationUi.style.display = 'flex';
  formationStageText.innerText = "✨ Giant Molecular Cloud";
  const timeCounter = document.getElementById('formation-time-counter');
  if (timeCounter) timeCounter.innerText = "4.60 Billion Years Ago";
});

document.addEventListener('skipFormation', () => {
  if (isFormationAnimating) formationTime = 20; 
});

document.addEventListener('toggleFormationPause', () => {
  formationPaused = !formationPaused;
});

document.addEventListener('scrubFormation', (e) => {
  if (isFormationAnimating) formationTime = e.detail.time;
});

document.addEventListener('changeFormationSpeed', (e) => {
  formationSpeed = e.detail.speed;
});

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 1500;

// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  const delta = 0.01;
  
  if (isFormationAnimating) {
    if (!formationPaused) {
      formationTime += delta * formationSpeed;
      const timelineSlider = document.getElementById('formation-timeline');
      if (timelineSlider && document.activeElement !== timelineSlider) {
        timelineSlider.value = formationTime;
      }
    }
    
    const formationUi = document.getElementById('formation-ui');
    const formationStageText = document.getElementById('formation-stage-text');
    
    // Continuous Morphing Logic
    const t = formationTime / 20; // 0.0 to 1.0 progress
    
    // Update Stage Text with Factually Correct Timings
    let yearsAgo = 0;
    if (t < 0.4) {
      yearsAgo = 4.60 - (t / 0.4) * 0.04; 
    } else if (t < 0.7) {
      yearsAgo = 4.56 - ((t - 0.4) / 0.3) * 0.06;
    } else if (t < 0.9) {
      yearsAgo = 4.50 - ((t - 0.7) / 0.2) * 0.70;
    } else {
      yearsAgo = 3.80 - ((t - 0.9) / 0.1) * 3.80;
    }
    
    const timeCounter = document.getElementById('formation-time-counter');
    if (timeCounter) {
      timeCounter.innerText = yearsAgo > 0.01 ? `${yearsAgo.toFixed(2)} Billion Years Ago` : "Present Day";
    }

    if (yearsAgo > 4.56) formationStageText.innerText = "✨ Giant Molecular Cloud Collapsing";
    else if (yearsAgo > 4.53) formationStageText.innerText = "🌀 Protoplanetary Disk Forming";
    else if (yearsAgo > 4.50) formationStageText.innerText = "🔥 Solar Ignition & Planet Condensation";
    else if (yearsAgo > 3.80) formationStageText.innerText = "☄️ Late Heavy Bombardment";
    else formationStageText.innerText = "🌍 Stable Solar System";
    
    // Camera Cinematic Movement
    const camX = Math.sin(t * Math.PI * 2) * (600 - t * 150);
    const camY = 300 + t * (150 - 300);
    const camZ = Math.cos(t * Math.PI * 2) * (600 - t * 150);
    camera.position.set(camX, camY, camZ);
    camera.lookAt(0,0,0);
    
    // Dust System Update
    if (t < 0.9) {
      dustSystem.visible = true;
      const positions = dustGeo.attributes.position.array;
      const timeOffset = Date.now() * 0.001;
      
      // Calculate morph weights
      const spiralWeight = Math.min(Math.max((t - 0.1) * 3, 0), 1); // fades in from 10% to 43%
      const ringWeight = Math.min(Math.max((t - 0.5) * 2, 0), 1);   // fades in from 50% to 100%
      const opacityFade = Math.min(Math.max((0.9 - t) * 10, 0), 1); // fades out sharply at 90%
      
      dustMat.opacity = opacityFade;
      
      for(let i=0; i<dustCount; i++) {
        const r0 = initialData[i*4];
        const theta0 = initialData[i*4+1];
        const phi0 = initialData[i*4+2];
        const phase = initialData[i*4+3];
        
        // 1. Cloud Position (Base)
        let x = r0 * Math.sin(phi0) * Math.cos(theta0 + timeOffset * 0.1);
        let y = r0 * Math.cos(phi0);
        let z = r0 * Math.sin(phi0) * Math.sin(theta0 + timeOffset * 0.1);
        
        // 2. Spiral Target
        const spiralRadius = r0 * 0.6;
        const spiralTheta = theta0 + spiralRadius * 0.02 + timeOffset * 0.5;
        const spiralX = spiralRadius * Math.cos(spiralTheta);
        const spiralY = (Math.random() - 0.5) * 40; // flatten
        const spiralZ = spiralRadius * Math.sin(spiralTheta);
        
        // Morph Base -> Spiral
        x += (spiralX - x) * spiralWeight;
        y += (spiralY - y) * spiralWeight;
        z += (spiralZ - z) * spiralWeight;
        
        // 3. Ring Target (Condensing into planets)
        if (ringWeight > 0) {
          const planetIndex = i % planets.length;
          const pData = planets[planetIndex];
          const ringRadius = pData.a * 1.5; // pull towards orbits
          const ringTheta = spiralTheta * 2;
          const ringX = ringRadius * Math.cos(ringTheta);
          const ringY = Math.sin(phase + timeOffset) * 5;
          const ringZ = ringRadius * Math.sin(ringTheta);
          
          x += (ringX - x) * ringWeight;
          y += (ringY - y) * ringWeight;
          z += (ringZ - z) * ringWeight;
        }
        
        positions[i*3] = x;
        positions[i*3+1] = y;
        positions[i*3+2] = z;
      }
      dustGeo.attributes.position.needsUpdate = true;
    } else {
      dustSystem.visible = false;
    }
    
    // Baby Planets Ignition (Shows up around 50%)
    if (t > 0.5) {
       sun.visible = true;
       sunGlow.visible = true;
       const pProgress = (t - 0.5) * 2; // 0 to 1
       
       planets.forEach(p => {
           p.mesh.visible = true;
           const scale = 0.1 + pProgress * 0.9;
           p.mesh.scale.setScalar(scale);
           
           // Hot fiery colors fading to real colors
           const origColor = p.data.texture ? new THREE.Color(0xffffff) : new THREE.Color(p.data.color);
           const origEmissive = p.data.name === "Earth" ? new THREE.Color(0x2271b3) : new THREE.Color(p.data.color);
           const targetIntensity = p.data.name === "Earth" ? 0.5 : 0.3;
           
           p.mesh.material.color.lerpColors(new THREE.Color(0xffaa00), origColor, pProgress);
           p.mesh.material.emissive.lerpColors(new THREE.Color(0xff3300), origEmissive, pProgress);
           p.mesh.material.emissiveIntensity = 2.0 - pProgress * (2.0 - targetIntensity);
           
           p.angle += p.speed * timeScale * 0.5 * (1 + (1 - pProgress)*5); // Spin faster initially
           const px = p.a * Math.cos(p.angle);
           const pz = p.b * Math.sin(p.angle);
           p.mesh.position.set(px, 0, pz);
           p.mesh.rotation.y += 0.05 * (1 - pProgress) + 0.01;
       });
       sun.rotation.y += 0.002;
       const pulse = 1 + Math.sin(Date.now() * 0.001) * 0.02;
       sunGlow.scale.setScalar(pulse);
    }
    
    // Belt Formation (Shows up around 75%)
    if (t > 0.75) {
       asteroidBelt.visible = true;
       kuiperBelt.visible = true;
       const beltProgress = Math.min((t - 0.75) * 4, 1);
       asteroidBelt.material.opacity = beltProgress * 0.8;
       kuiperBelt.material.opacity = beltProgress * 0.8;
    } else {
       asteroidBelt.visible = false;
       kuiperBelt.visible = false;
    }
    
    // Stage Done
    if (formationTime >= 20) {
       isFormationAnimating = false;
       formationUi.style.display = 'none';
       dustSystem.visible = false;
       asteroidBelt.visible = true;
       kuiperBelt.visible = true;
       asteroidBelt.material.opacity = 0.8;
       kuiperBelt.material.opacity = 0.8;
       
       planets.forEach(p => {
         p.mesh.scale.setScalar(1);
         if (showMoons) {
           p.moons.forEach(m => m.mesh.visible = true);
         }
         p.mesh.material.color.setHex(p.data.texture ? 0xffffff : new THREE.Color(p.data.color).getHex());
         p.mesh.material.emissive.setHex(p.data.name === "Earth" ? 0x2271b3 : new THREE.Color(p.data.color).getHex());
         p.mesh.material.emissiveIntensity = p.data.name === "Earth" ? 0.5 : 0.3;
       });
       
       // Snap camera back to free control
       camera.position.set(0, 150, 450);
       controls.target.set(0,0,0);
    }
  } else {
    // Normal Simulation
    planets.forEach((p) => {
      // Planet Position (Parametric Ellipse)
      p.angle += p.speed * timeScale * 0.5;
      const px = p.a * Math.cos(p.angle);
      const pz = p.b * Math.sin(p.angle);
      p.mesh.position.set(px, 0, pz);
      p.mesh.rotation.y += 0.01;
      
      // Moons Position relative to parent
      p.moons.forEach((m) => {
        m.angle += m.speed * timeScale;
        const mx = p.mesh.position.x + m.data.distance * Math.cos(m.angle);
        const mz = p.mesh.position.z + m.data.distance * Math.sin(m.angle);
        m.mesh.position.set(mx, 0, mz);
        m.mesh.rotation.y += 0.03;
      });
    });
    
    // Belts Animation
    asteroidBelt.rotation.y += asteroidBelt.userData.speed;
    kuiperBelt.rotation.y += kuiperBelt.userData.speed;
    
    // Sun Effects
    sun.rotation.y += 0.002;
    const pulse = 1 + Math.sin(Date.now() * 0.001) * 0.02;
    sunGlow.scale.setScalar(pulse);
  }

  let uiOffset = 0;
  if (focusing) {
    uiOffset = window.innerWidth > 768 ? 200 : 0; // shift left if window is wide enough
    if (moonInfo.style.opacity === '1') {
      uiOffset = window.innerWidth > 1024 ? 400 : uiOffset;
    }
  }
  targetViewOffsetX = uiOffset;

  if (Math.abs(targetViewOffsetX - currentViewOffsetX) > 0.5) {
    currentViewOffsetX += (targetViewOffsetX - currentViewOffsetX) * 0.1;
    camera.setViewOffset(window.innerWidth, window.innerHeight, currentViewOffsetX, 0, window.innerWidth, window.innerHeight);
  } else if (currentViewOffsetX !== 0 && targetViewOffsetX === 0) {
    currentViewOffsetX = 0;
    camera.clearViewOffset();
  }

  if (focusing && focusData) {
    focusOnObject(focusData);
    resettingToDefault = false;
  } else if (resettingToDefault) {
    const defaultTarget = new THREE.Vector3(0, 0, 0);
    // Full view of the entire solar system
    const defaultCameraPos = new THREE.Vector3(0, 150, 450);
    
    controls.target.lerp(defaultTarget, 0.05);
    camera.position.lerp(defaultCameraPos, 0.05);
    
    if (controls.target.distanceTo(defaultTarget) < 0.1 && camera.position.distanceTo(defaultCameraPos) < 1.0) {
      resettingToDefault = false;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Hide base visual on first load so it doesn't flash before Genesis animation
sun.visible = false;
sunGlow.visible = false;
planets.forEach(p => {
  p.mesh.visible = false;
  if (p.moons) p.moons.forEach(m => m.mesh.visible = false);
});
asteroidBelt.visible = false;
kuiperBelt.visible = false;
dustSystem.visible = true;

// --- Responsive ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  if (currentViewOffsetX > 0.5) {
    camera.setViewOffset(window.innerWidth, window.innerHeight, currentViewOffsetX, 0, window.innerWidth, window.innerHeight);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
