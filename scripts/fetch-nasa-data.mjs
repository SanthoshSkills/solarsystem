import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HORIZONS_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const HORIZONS_IDS = {
  Mercury: 199, Venus: 299, Earth: 399, Mars: 499,
  Jupiter: 599, Saturn: 699, Uranus: 799, Neptune: 899,
  Pluto: 999,
};

const OUTPUT_PATH = join(__dirname, '..', 'public', 'planet-data.json');
const FALLBACK_PATH = join(__dirname, '..', 'src', 'data', 'planetFallbacks.js');

const THRESHOLD_PCT = 1.0;

function parseHorizonsOBJ(text) {
  const fields = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s{2}(.+?)\s+=\s+(.+?)(?:\s+\{.*)?$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().split(/\s+/)[0];
      fields[key] = val;
    }
    const gmMatch = line.match(/^\s{2}GM.*?=\s+([\d.]+)/);
    if (gmMatch) fields['GM'] = gmMatch[1];
  }
  return fields;
}

async function fetchPlanetData(id) {
  const url = `${HORIZONS_BASE}?format=text&COMMAND=${id}&OBJ_DATA=YES&MAKE_EPHEM=NO`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Horizons returned ${res.status} for ${id}`);
  const text = await res.text();
  return parseHorizonsOBJ(text);
}

function extractNumeric(value) {
  const m = String(value).match(/[-\d.]+(?:e[+-]?\d+)?/i);
  return m ? parseFloat(m[0]) : null;
}

function mapHorizonsToSchema(raw, planetName) {
  return {
    name: planetName,
    nasaSource: 'horizons',
    nasaTimestamp: new Date().toISOString(),
    mass: extractNumeric(raw['Mass']),
    density: extractNumeric(raw['Density']),
    equatorialRadius: extractNumeric(raw['Equatorial radius']),
    meanRadius: extractNumeric(raw['Vol. mean radius']),
    gravity: extractNumeric(raw['Equ. gravity']),
    escapeVelocity: extractNumeric(raw['Escape speed']),
    albedo: extractNumeric(raw['Geometric Albedo']),
    rotationPeriod: extractNumeric(raw['Sidereal rot. period']),
    orbitalPeriod: extractNumeric(raw['Mean sidereal orb per']),
    meanTemperature: extractNumeric(raw['Mean temperature']),
    atmosphericPressure: extractNumeric(raw['Atmos. pressure']),
    obliquity: extractNumeric(raw['Obliquity to orbit']),
    orbitalSpeed: extractNumeric(raw['Orbital speed']),
    gm: extractNumeric(raw['GM']),
  };
}

function computeDelta(existing, fresh) {
  if (!existing) return true;
  const deltas = {};
  for (const [key, val] of Object.entries(fresh)) {
    if (typeof val === 'number' && typeof existing[key] === 'number') {
      const pct = existing[key] !== 0
        ? Math.abs((val - existing[key]) / existing[key]) * 100
        : val !== 0 ? 100 : 0;
      if (pct > THRESHOLD_PCT) deltas[key] = { old: existing[key], new: val, pct };
    }
  }
  return Object.keys(deltas).length > 0 ? deltas : null;
}

async function main() {
  console.log('[nasa-sync] Starting Horizons data fetch...');

  const results = {};
  let hasChanges = false;

  const existing = existsSync(OUTPUT_PATH)
    ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
    : null;

  for (const [name, id] of Object.entries(HORIZONS_IDS)) {
    try {
      const raw = await fetchPlanetData(id);
      const mapped = mapHorizonsToSchema(raw, name);
      results[name] = mapped;

      const delta = existing ? computeDelta(existing[name], mapped) : { new: true };
      if (delta) {
        hasChanges = true;
        console.log(`  [${name}] delta:`, JSON.stringify(delta));
      } else {
        console.log(`  [${name}] no significant change`);
      }
    } catch (err) {
      console.error(`  [${name}] FAILED:`, err.message);
      if (existing?.[name]) results[name] = existing[name];
    }
  }

  if (hasChanges) {
    const output = {
      _meta: { updatedAt: new Date().toISOString(), source: 'JPL Horizons API' },
      planets: results,
    };
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[nasa-sync] Updated ${OUTPUT_PATH}`);
  } else {
    console.log('[nasa-sync] No significant changes detected — file left untouched');
  }
}

main().catch((err) => {
  console.error('[nasa-sync] Fatal error:', err);
  process.exit(1);
});
