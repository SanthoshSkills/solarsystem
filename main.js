import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { planetsData, sunData } from './planets.js';

// --- Configuration ---
const sunSize = 5;
const timeScale = 1;
let hoveredObject = null;
let pinnedObject = null;
let showMoons = true;

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 4, 3000, 1);
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
    size: 0.1,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
  });
  
  const belt = new THREE.Points(geometry, material);
  belt.userData = { speed, angles, radii };
  return belt;
}

const asteroidBelt = createBelt(6000, 45, 58, 0xaaaaaa, 0.0001);
scene.add(asteroidBelt);

const kuiperBelt = createBelt(10000, 150, 260, 0x5577ff, 0.00005);
scene.add(kuiperBelt);

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
const planetFact = document.getElementById('planet-fun-fact');
const planetDesc = document.getElementById('planet-description');

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

window.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactionTargets);
  
  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (hoveredObject !== object) {
      hoveredObject = object;
      console.log('Interaction Hit:', object.userData.name);
      if (!pinnedObject) showInfo(object.userData);
    }
    document.body.style.cursor = 'pointer';
  } else {
    hoveredObject = null;
    document.body.style.cursor = 'default';
    if (!pinnedObject) {
      planetInfo.style.opacity = '0';
      planetInfo.style.pointerEvents = 'none';
      planetInfo.style.transform = 'translateY(-20px)';
    }
  }
});

window.addEventListener('click', () => {
  if (hoveredObject) {
    pinnedObject = hoveredObject;
    showInfo(hoveredObject.userData);
  } else {
    pinnedObject = null;
    planetInfo.style.opacity = '0';
    planetInfo.style.pointerEvents = 'none';
    planetInfo.style.transform = 'translateY(-20px)';
  }
});

function showInfo(data) {
  planetName.innerText = data.name;
  planetMass.innerText = data.mass || 'N/A';
  planetGrav.innerText = data.gravity || 'N/A';
  planetTemp.innerText = data.temp || 'N/A';
  planetVel.innerText = data.speed ? `${(data.speed * 1000).toFixed(2)} km/s` : 'N/A';
  planetFact.innerText = data.funFact || 'Exploring the unknown...';
  planetDesc.innerText = data.description || '';
  
  const moonsList = document.getElementById('planet-moons-list');
  if (data.moons && data.moons.length > 0) {
    moonsList.innerText = data.moons.map(m => m.name).join(', ');
  } else {
    moonsList.innerText = 'None';
  }
  
  planetInfo.style.opacity = '1';
  planetInfo.style.pointerEvents = 'auto';
  planetInfo.style.transform = 'none';
}

document.getElementById('close-info').addEventListener('click', () => {
  pinnedObject = null;
  planetInfo.style.opacity = '0';
  planetInfo.style.pointerEvents = 'none';
  planetInfo.style.transform = 'translateY(-20px)';
});

// Moon Toggle Logic
document.getElementById('toggle-moons').addEventListener('change', (e) => {
  showMoons = e.target.checked;
  planets.forEach(p => {
    p.moons.forEach(m => {
      m.mesh.visible = showMoons;
    });
  });
  updateTargets();
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

  controls.update();
  renderer.render(scene, camera);
}

animate();

// --- Responsive ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
