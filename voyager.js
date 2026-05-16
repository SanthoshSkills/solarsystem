const MS_PER_DAY = 86400000;
const REFERENCE_DATE = new Date('1977-01-01').getTime();

const ORBITAL_PERIOD_DAYS = {
  'Mercury': 88, 'Venus': 225, 'Earth': 365.25, 'Mars': 687,
  'Jupiter': 4383, 'Saturn': 10738, 'Uranus': 30681, 'Neptune': 60262, 'Pluto': 90584,
};

const PLANET_DISTANCES = {
  'Mercury': 15, 'Venus': 22, 'Earth': 30, 'Mars': 40,
  'Jupiter': 72, 'Saturn': 100, 'Uranus': 125, 'Neptune': 145, 'Pluto': 170,
};

const ECCENTRICITIES = {
  'Mercury': 0.2056, 'Venus': 0.0067, 'Earth': 0.0167, 'Mars': 0.0934,
  'Jupiter': 0.0489, 'Saturn': 0.0565, 'Uranus': 0.0457, 'Neptune': 0.0113, 'Pluto': 0.2448,
};

const VOYAGER_EVENTS = [
  // ── Voyager 2 ──
  { craft: 2, date: '1977-08-20', type: 'launch', name: 'Voyager 2 Launch', targetPlanet: 'Earth' },
  { craft: 2, date: '1979-07-09', type: 'flyby', name: 'Jupiter Flyby', targetPlanet: 'Jupiter' },
  { craft: 2, date: '1981-08-25', type: 'flyby', name: 'Saturn Flyby', targetPlanet: 'Saturn' },
  { craft: 2, date: '1986-01-24', type: 'flyby', name: 'Uranus Flyby', targetPlanet: 'Uranus' },
  { craft: 2, date: '1989-08-25', type: 'flyby', name: 'Neptune Flyby', targetPlanet: 'Neptune' },
  { craft: 2, date: '1998-10-01', type: 'milestone', name: 'Kuiper Belt Crossing', r: 180, theta: 2.80, desc: 'Entering the realm of icy bodies beyond Neptune' },
  { craft: 2, date: '2007-08-01', type: 'milestone', name: 'Heliosheath Entry', r: 200, theta: 3.10, desc: 'Feeling the edge of the Sun\'s influence' },
  { craft: 2, date: '2018-11-05', type: 'milestone', name: 'Interstellar Space', r: 220, theta: 3.35, desc: 'Voyager 2 crosses the heliopause — second human object in interstellar space' },
  { craft: 2, date: '2026-05-16', type: 'milestone', name: 'Current Position', r: 250, theta: 3.50, desc: 'Voyager 2 continues its journey into the galaxy at ~138 AU from the Sun' },
  // ── Voyager 1 ──
  { craft: 1, date: '1977-09-05', type: 'launch', name: 'Voyager 1 Launch', targetPlanet: 'Earth' },
  { craft: 1, date: '1979-03-05', type: 'flyby', name: 'Jupiter Flyby', targetPlanet: 'Jupiter' },
  { craft: 1, date: '1980-11-12', type: 'flyby', name: 'Saturn Flyby', targetPlanet: 'Saturn' },
  { craft: 1, date: '1990-02-14', type: 'milestone', name: 'Pale Blue Dot', r: 135, theta: 1.25, desc: 'Carl Sagan\'s iconic image — Earth from 6 billion km' },
  { craft: 1, date: '2012-08-25', type: 'milestone', name: 'Interstellar Space', r: 210, theta: 1.55, desc: 'Voyager 1 becomes the first human-made object to reach interstellar space' },
  { craft: 1, date: '2026-05-16', type: 'milestone', name: 'Current Position', r: 260, theta: 1.75, desc: 'Voyager 1, the most distant human object, at ~165 AU from the Sun' },
];

export function getVoyagerTimeline(craftId) {
  return VOYAGER_EVENTS
    .filter(e => e.craft === craftId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getEventMs(event) {
  return new Date(event.date).getTime();
}

function getPlanetAngle(planetName, dateMs) {
  const period = ORBITAL_PERIOD_DAYS[planetName];
  if (!period) return 0;
  const daysSinceRef = (dateMs - REFERENCE_DATE) / MS_PER_DAY;
  return (daysSinceRef / period) * Math.PI * 2;
}

function getPlanetCoords(planetName, dateMs) {
  const dist = PLANET_DISTANCES[planetName] || 30;
  const ecc = ECCENTRICITIES[planetName] || 0;
  const angle = getPlanetAngle(planetName, dateMs);
  const semiMinor = dist * Math.sqrt(1 - ecc * ecc);
  return { x: dist * Math.cos(angle), z: semiMinor * Math.sin(angle), angle };
}

function getSpacecraftPosAtEvent(event) {
  const dateMs = getEventMs(event);
  if (event.targetPlanet) {
    return getPlanetCoords(event.targetPlanet, dateMs);
  }
  // Beyond-planet events use explicit polar coordinates
  return {
    x: (event.r || 150) * Math.cos(event.theta || 0),
    z: (event.r || 150) * Math.sin(event.theta || 0),
    angle: event.theta || 0,
  };
}

export function getVoyagerDateRange(craftId) {
  const events = getVoyagerTimeline(craftId);
  return {
    startMs: getEventMs(events[0]),
    endMs: getEventMs(events[events.length - 1]),
  };
}

export function getVoyagerState(t, craftId) {
  const events = getVoyagerTimeline(craftId);
  if (!events.length) return null;
  const dateRange = getVoyagerDateRange(craftId);
  const currentDateMs = dateRange.startMs + t * (dateRange.endMs - dateRange.startMs);

  let prevEvent = events[0];
  let nextEvent = events[events.length - 1];
  let localT = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const e1ms = getEventMs(events[i]);
    const e2ms = getEventMs(events[i + 1]);
    if (currentDateMs >= e1ms && currentDateMs <= e2ms) {
      prevEvent = events[i];
      nextEvent = events[i + 1];
      localT = (currentDateMs - e1ms) / (e2ms - e1ms);
      break;
    }
  }

  const prevPos = getSpacecraftPosAtEvent(prevEvent);
  const nextPos = getSpacecraftPosAtEvent(nextEvent);

  // Use polar interpolation to prevent "crossing back" through the inner solar system (e.g. Neptune to Kuiper Belt)
  const r1 = Math.sqrt(prevPos.x * prevPos.x + prevPos.z * prevPos.z);
  const r2 = Math.sqrt(nextPos.x * nextPos.x + nextPos.z * nextPos.z);
  const scR = r1 + (r2 - r1) * localT;

  const phi1 = Math.atan2(prevPos.z, prevPos.x);
  let phi2 = Math.atan2(nextPos.z, nextPos.x);

  // Handle wrap-around to ensure the shortest angular path
  while (phi2 - phi1 > Math.PI) phi2 -= Math.PI * 2;
  while (phi2 - phi1 < -Math.PI) phi2 += Math.PI * 2;

  const scAngle = phi1 + (phi2 - phi1) * localT;
  const scX = scR * Math.cos(scAngle);
  const scZ = scR * Math.sin(scAngle);

  // Velocity components for orientation
  const dr = r2 - r1;
  const dphi = phi2 - phi1;
  const vx = dr * Math.cos(scAngle) - scR * dphi * Math.sin(scAngle);
  const vz = dr * Math.sin(scAngle) + scR * dphi * Math.cos(scAngle);

  // Determine what we're looking at / event proximity
  let lookAtPlanet = null;
  let flybyActive = false;
  let flybyEvent = null;

  const timelineSpan = dateRange.endMs - dateRange.startMs;
  const proximityRange = timelineSpan * 0.06;

  for (const event of events) {
    if (event.type === 'flyby' || event.type === 'milestone') {
      const eMs = getEventMs(event);
      const dist = Math.abs(currentDateMs - eMs);
      if (dist < proximityRange) {
        lookAtPlanet = event.targetPlanet || null;
        flybyActive = true;
        flybyEvent = event;
        break;
      }
    }
  }

  // Between events, look ahead to next target planet or milestone
  if (!lookAtPlanet) {
    const upcomingMilestones = events.filter(e => {
      if (e.type === 'flyby' || e.type === 'milestone') {
        return getEventMs(e) >= currentDateMs;
      }
      return false;
    });
    if (upcomingMilestones.length) {
      const nextMs = upcomingMilestones[0];
      lookAtPlanet = nextMs.targetPlanet || null;
    } else {
      const lastMs = events.filter(e => e.type === 'flyby' || e.type === 'milestone');
      if (lastMs.length) lookAtPlanet = lastMs[lastMs.length - 1].targetPlanet || null;
    }
  }

  return {
    scX, scZ, scR,
    vx, vz,
    currentDateMs,
    lookAtPlanet,
    flybyActive,
    flybyEvent,
    prevEvent,
    nextEvent,
    localT,
    prevPos,
    nextPos,
  };
}

export function getAllPlanetPositions(dateMs) {
  const positions = {};
  for (const name of Object.keys(PLANET_DISTANCES)) {
    positions[name] = getPlanetCoords(name, dateMs);
  }
  return positions;
}

export function formatVoyagerDate(dateMs) {
  const d = new Date(dateMs);
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}
