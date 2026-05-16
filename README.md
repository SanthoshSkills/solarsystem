# 🪐 3D Solar System Simulator

<div align="center">
  <p>An interactive, high-fidelity 3D solar system simulator built with Three.js and Vite.</p>

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSanthoshSkills%2Fsolarsystem)
  <br>
  <strong>🌍 <a href="https://solarsystem-kappa-one.vercel.app/">Live Demo</a></strong>
</div>

---

## 👨‍👧 A Dad, a Kid & an AI

This started as a weekend project with a very specific product brief from a very demanding 7-year-old:
*"I want to see all the planets. And the moons. And make it spinny."*

**Dad** built it. **An AI coding assistant** did the heavy lifting. **The 7-year-old** approved (or rejected) every feature.

---

## 🌟 Features

- **✨ Solar System Genesis:** Cinematic 4.6 billion year formation sequence — watch a molecular cloud collapse into a spinning disk, the Sun ignite, and planets condense. Includes a scientifically accurate non-linear timeline, interactive scrubber, play/pause, and 1x/2x/4x speed controls.
- **🔭 Cosmic Navigator:** One-click floating button to open the planet info carousel and focus on the Sun.
- **24-Parameter Astronomical Database:** Deep dive into 24 accurate data points for every celestial body, neatly organized into 4 interactive tabs: Physical, Orbital, Atmosphere & Rotation, and System.
- **Interactive 3D Navigation:** Roam the solar system with intuitive mouse controls — rotate, pan, and zoom.
- **Dynamic Planet Info Carousel:** Click any planet or the Sun to pull up a tabbed info panel with fun facts and rich scientific data. Navigate between all bodies with arrow buttons.
- **Moons:** All major moons rendered and toggleable. Each has its own 24-parameter info panel.
- **Immersive Visuals:** Deep-space backdrop, realistic lighting, textured planets, and Saturn's rings — powered by Three.js.

---

## 🚀 Tech Stack

- **[Three.js](https://threejs.org/):** Core 3D engine for rendering planets, moons, rings, orbits, and the cinematic dust system.
- **[Vite](https://vitejs.dev/):** Fast build tool and development server.
- **Vanilla JavaScript:** Clean, lean, zero-framework logic.
- **Vercel:** Deployment and hosting.

---

## 💻 Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SanthoshSkills/solarsystem.git
   cd solarsystem
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Navigate to `http://localhost:5173` in your browser.

---

## 🎮 Controls

| Action | Control |
|--------|---------|
| Rotate | Left click + drag |
| Pan | Right click + drag |
| Zoom | Scroll wheel |
| Open planet info | Click any planet / Sun |
| Navigate between planets | ◀ / ▶ arrows in the info panel |
| Open Cosmic Navigator | 🔭 button (bottom-left) |
| Replay Genesis animation | ✨ button (bottom-left) |
| Toggle moon visibility | Show Moons switch (bottom-centre) |
| Re-open origin story | 👨‍👩‍👦 button (top header) |

---

## 📦 Build for Production

```bash
npm run build
```
Static assets will be output to the `/dist` directory.

---

## 📝 License

This project is open-source and available under the **MIT License**.