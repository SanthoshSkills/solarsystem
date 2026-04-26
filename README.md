# 🪐 3D Solar System Simulator

<div align="center">
  <p>An interactive, high-fidelity 3D solar system simulator built with Three.js and Vite.</p>

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fsolar-system-simulator)
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

- **Interactive 3D Navigation:** Roam the solar system with intuitive mouse controls — rotate, pan, and zoom.
- **Realistic Planetary Data:** Live stats on mass, gravity, temperature, velocity, radius, orbital period, and day length.
- **Dynamic Info Panels:** Tap any planet to pull up a dedicated info card with fun facts and descriptions.
- **Moons:** Toggleable rendering of all major planetary moons, each with their own data panel.
- **Immersive Visuals:** Deep-space backdrop, realistic lighting, textured planets, and Saturn's rings — all powered by Three.js.
- **Fullscreen Mode:** One-click fullscreen toggle for a truly immersive experience.
- **Origin Story:** The project's backstory is baked right into the UI — hit the 👨‍👩‍👦 button anytime.

## 🚀 Tech Stack

- **[Three.js](https://threejs.org/):** Core 3D engine for rendering planets, moons, rings, and orbits.
- **[Vite](https://vitejs.dev/):** Fast build tool and development server.
- **Vanilla JavaScript:** Clean, lean, zero-framework logic.
- **Vercel:** Deployment and hosting.

## 💻 Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/solar-system-simulator.git
   cd solar-system-simulator
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

## 🎮 Controls

| Action | Control |
|--------|---------|
| Rotate | Left click + drag |
| Pan | Right click + drag |
| Zoom | Scroll wheel |
| Toggle moons | Switch in the bottom bar |
| Fullscreen | Button in the top header |
| Origin story | 👨‍👩‍👦 button in the top header |

## 📦 Build for Production

```bash
npm run build
```
Static assets will be output to the `/dist` directory.

## 📝 License

This project is open-source and available under the **MIT License**.