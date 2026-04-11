export const planetsData = [
  {
    name: "Mercury",
    radius: 0.8,
    distance: 15,
    eccentricity: 0.2056,
    speed: 0.04,
    color: "#A5A5A5",
    texture: "/textures/mercury.jpg",
    mass: "3.28e23 kg",
    gravity: "3.7 m/s²",
    temp: "167°C",
    funFact: "Mercury is shrinking as its iron core cools.",
    description: "The smallest planet in our solar system and closest to the Sun."
  },
  {
    name: "Venus",
    radius: 1.5,
    distance: 22,
    eccentricity: 0.0067,
    speed: 0.015,
    color: "#E3BB76",
    texture: "/textures/venus.jpg",
    mass: "4.86e24 kg",
    gravity: "8.8 m/s²",
    temp: "464°C",
    funFact: "A day on Venus is longer than a year.",
    description: "Spinning slowly in the opposite direction from most planets."
  },
  {
    name: "Earth",
    radius: 1.6,
    distance: 30,
    eccentricity: 0.0167,
    speed: 0.01,
    color: "#2271B3",
    texture: "/textures/earth.jpg",
    mass: "5.97e24 kg",
    gravity: "9.8 m/s²",
    temp: "15°C",
    funFact: "Earth is the only planet not named after a god.",
    description: "The only place we know of so far that's inhabited by living things.",
    moons: [
      { name: "The Moon", radius: 0.45, distance: 3.5, speed: 0.05, texture: "/textures/moon.jpg" }
    ]
  },
  {
    name: "Mars",
    radius: 1.2,
    distance: 40,
    eccentricity: 0.0934,
    speed: 0.008,
    color: "#E27B58",
    texture: "/textures/mars.jpg",
    mass: "6.39e23 kg",
    gravity: "3.7 m/s²",
    temp: "-65°C",
    funFact: "Mars has the tallest volcano in the solar system, Olympus Mons.",
    description: "A dusty, cold, desert world with a very thin atmosphere.",
    moons: [
      { name: "Phobos", radius: 0.2, distance: 2.2, speed: 0.08, color: "#8B4513" },
      { name: "Deimos", radius: 0.15, distance: 3.0, speed: 0.06, color: "#A0522D" }
    ]
  },
  {
    name: "Ceres",
    radius: 0.5,
    distance: 52,
    eccentricity: 0.0758,
    speed: 0.006,
    color: "#6D6D6D",
    mass: "9.39e20 kg",
    gravity: "0.27 m/s²",
    temp: "-105°C",
    funFact: "Ceres makes up one-third of the total mass in the asteroid belt.",
    description: "The largest object in the asteroid belt between Mars and Jupiter."
  },
  {
    name: "Jupiter",
    radius: 4.5,
    distance: 72,
    eccentricity: 0.0489,
    speed: 0.004,
    color: "#D39C7E",
    texture: "/textures/jupiter.jpg",
    mass: "1.89e27 kg",
    gravity: "24.7 m/s²",
    temp: "-110°C",
    funFact: "Jupiter has a 'Great Red Spot' that has been raging for 300 years.",
    description: "More than twice as massive as all other planets combined.",
    moons: [
      { name: "Io", radius: 0.4, distance: 7, speed: 0.06, color: "#EBE334" },
      { name: "Europa", radius: 0.35, distance: 9, speed: 0.045, color: "#D7D7D7" },
      { name: "Ganymede", radius: 0.5, distance: 11, speed: 0.035, color: "#9D9384" },
      { name: "Callisto", radius: 0.48, distance: 13, speed: 0.025, color: "#7F7362" },
      { name: "Amalthea", radius: 0.25, distance: 5, speed: 0.08, color: "#C04000" }
    ]
  },
  {
    name: "Saturn",
    radius: 3.8,
    distance: 100,
    eccentricity: 0.0565,
    speed: 0.002,
    color: "#C5AB6E",
    texture: "/textures/saturn.jpg",
    mass: "5.68e26 kg",
    gravity: "10.4 m/s²",
    temp: "-140°C",
    funFact: "Saturn's rings are made mostly of ice and dust.",
    description: "Unique in our solar system for its dazzling, complex rings.",
    hasRings: true,
    moons: [
      { name: "Mimas", radius: 0.25, distance: 6, speed: 0.05, color: "#C0C0C0" },
      { name: "Enceladus", radius: 0.28, distance: 7.5, speed: 0.04, color: "#FFFFFF" },
      { name: "Tethys", radius: 0.35, distance: 9.5, speed: 0.035, color: "#D3D3D3" },
      { name: "Dione", radius: 0.35, distance: 11, speed: 0.03, color: "#DCDCDC" },
      { name: "Rhea", radius: 0.4, distance: 13.5, speed: 0.025, color: "#F5F5F5" },
      { name: "Titan", radius: 0.65, distance: 17, speed: 0.02, color: "#DBB141" },
      { name: "Iapetus", radius: 0.38, distance: 22, speed: 0.015, color: "#9C9C9C" }
    ]
  },
  {
    name: "Uranus",
    radius: 2.5,
    distance: 125,
    eccentricity: 0.0457,
    speed: 0.0012,
    color: "#BBE1E4",
    texture: "/textures/uranus.jpg",
    mass: "8.68e25 kg",
    gravity: "8.6 m/s²",
    temp: "-195°C",
    funFact: "Uranus rotates on its side, nearly 90 degrees from the plane of its orbit.",
    description: "The first planet found with the aid of a telescope.",
    moons: [
      { name: "Miranda", radius: 0.2, distance: 5, speed: 0.04, color: "#D3D3D3" },
      { name: "Ariel", radius: 0.3, distance: 7, speed: 0.03, color: "#E0E0E0" },
      { name: "Umbriel", radius: 0.3, distance: 9, speed: 0.025, color: "#9E9E9E" },
      { name: "Titania", radius: 0.4, distance: 12, speed: 0.02, color: "#BDBDBD" },
      { name: "Oberon", radius: 0.4, distance: 15, speed: 0.015, color: "#A9A9A9" }
    ]
  },
  {
    name: "Neptune",
    radius: 2.4,
    distance: 145,
    eccentricity: 0.0113,
    speed: 0.0008,
    color: "#6081FF",
    texture: "/textures/neptune.jpg",
    mass: "1.02e26 kg",
    gravity: "11.1 m/s²",
    temp: "-201°C",
    funFact: "Neptune was the first planet predicted by mathematical calculations.",
    description: "Dark, cold, and whipped by supersonic winds.",
    moons: [
      { name: "Proteus", radius: 0.3, distance: 6, speed: 0.03, color: "#708090" },
      { name: "Triton", radius: 0.55, distance: 10, speed: 0.02, color: "#E6E6FA" }
    ]
  },
  {
    name: "Pluto",
    radius: 0.6,
    distance: 170,
    eccentricity: 0.2448,
    speed: 0.0006,
    color: "#DAB5A0",
    texture: "/textures/pluto.jpg",
    mass: "1.30e22 kg",
    gravity: "0.62 m/s²",
    temp: "-225°C",
    funFact: "Pluto is smaller than Earth's moon.",
    description: "Once the ninth planet, now a complex dwarf planet in the Kuiper Belt.",
    moons: [
      { name: "Charon", radius: 0.35, distance: 4, speed: 0.04, color: "#778899" }
    ]
  },
  {
    name: "Haumea",
    radius: 0.5,
    distance: 185,
    eccentricity: 0.1912,
    speed: 0.0005,
    color: "#D7B9A2",
    mass: "4.0e21 kg",
    gravity: "0.4 m/s²",
    temp: "-241°C",
    funFact: "Haumea is egg-shaped due to its extremely fast rotation.",
    description: "A fast-rotating dwarf planet in the Kuiper Belt."
  },
  {
    name: "Makemake",
    radius: 0.5,
    distance: 200,
    eccentricity: 0.1559,
    speed: 0.00045,
    color: "#E28E61",
    mass: "3.1e21 kg",
    gravity: "0.5 m/s²",
    temp: "-243°C",
    funFact: "Makemake has no known atmosphere and is extremely cold.",
    description: "The second largest Kuiper Belt object."
  },
  {
    name: "Eris",
    radius: 0.7,
    distance: 220,
    eccentricity: 0.4407,
    speed: 0.0004,
    color: "#B1B1B1",
    mass: "1.66e22 kg",
    gravity: "0.82 m/s²",
    temp: "-243°C",
    funFact: "Eris is almost the same size as Pluto but more massive.",
    description: "The most massive dwarf planet known."
  }
];

export const sunData = {
  name: "Sun",
  radius: 8,
  color: "#FFD700",
  texture: "/textures/sun.jpg",
  mass: "1.98e30 kg",
  gravity: "274 m/s²",
  temp: "5,505°C",
  funFact: "The Sun accounts for 99.86% of the total mass in the solar system.",
  description: "A nearly perfect sphere of hot plasma at the center."
};
