# Solar System Simulator - User Manual

Welcome to the 3D Solar System Simulator! This application provides an interactive, detailed, and realistic 3D representation of our solar system right in your browser.

## Getting Started

When you launch the simulator, you will initially be presented with a wide view of the entire solar system, centered on the Sun. The simulation is running in real-time, meaning planets are actively moving along their orbital paths based on relatively scaled speeds.

## Camera Controls

Navigating the 3D space is intuitive and relies on your mouse:

*   **Rotate View (Orbit):** Click and hold the **Left Mouse Button** anywhere in the empty space, then drag to orbit the camera around the currently focused object or the center of the solar system.
*   **Pan Camera:** Click and hold the **Right Mouse Button**, then drag to laterally move (pan) your camera perspective without rotating.
*   **Zoom In / Out:** Use your **Mouse Scroll Wheel** to zoom closer to the celestial bodies or zoom out for a macro view of the solar system.

## Interaction & Exploration

### Interacting with Planets and the Sun

*   **Hovering:** If your view isn't currently locked to a planet, simply hovering your mouse cursor over any planet (or the Sun) will briefly highlight it and pop open the **Planet Info Panel**.
*   **Selecting (Pinning):** To lock the camera onto a planet and track it through space, **Left Click** on it. 
    *   *Smart Camera Shift:* When a planet is selected and the information panel opens, the camera intelligently pans the planet slightly to the left portion of your screen so it remains clearly visible alongside the UI panel.
*   **Deselecting:** You can unlock your view by clicking the **Close** button at the bottom of the Planet Info Panel. This will safely close any open moon info panels and elegantly reset your camera back to a wide, cinematic viewpoint showcasing the entire solar system. Clicking on the empty background space will no longer accidentally unpin your camera.

### Discovering Moons

*   **Moon Info Panel:** If you select a planet that has moons (like Earth, Mars, Jupiter, etc.), the **Moon Info Panel** will open automatically by default, showcasing details about its most prominent moon.
*   **Selecting Specific Moons:** Inside the Planet Info Panel, you will see a list of "Major Moons". You can click on any of these underlined names to instantly pull up its targeted data.
*   **Navigating Moons:** While the Moon Info Panel is open, use the **previous (<)** and **next (>)** arrows at the top of the panel to cycle through all the major moons belonging to the currently selected planet.

### Navigating the System

*   You don't have to manually locate everything! While the Planet Info Panel is open, you can use the **previous (<)** and **next (>)** arrow buttons on the panel header to cycle through the Sun and all the planets in order of their distance from the Sun.
*   **Cosmic Navigator Button (🔭):** Located in the UI, clicking this button acts as a quick-access shortcut to open the Planet Carousel, automatically focusing on the Sun if nothing is currently selected.
*   The camera will automatically fly to and focus on the newly selected planet.

## Cinematic Genesis Sequence

Click the **✨ Solar System Genesis** button to travel back 4.6 billion years!
*   **Continuous Cinematic Morph:** Watch as the solar system forms from a bright, glowing molecular cloud into a swirling accretion disk, and finally cools down as planets condense.
*   **Interactive Scrubber:** Use the timeline slider at the bottom of the screen to manually scrub back and forth through the 4.6 billion years of history.
*   **Playback Controls:** You can pause/play the animation at any time, or use the 1x, 2x, and 4x speed toggles to fast-forward the formation of the solar system.

## Visual Toggles

*   **Show Moons Switch:** Located at the bottom center of your screen, this toggle allows you to hide or show the 3D models and orbits of the moons in the simulation. 
    *   *Note:* Turning this off purely removes the 3D meshes to declutter your screen. You can still access full moon data via the UI panels seamlessly!

## Understanding the Data (24 Parameters)

The information panels now contain a comprehensive database of 24 highly accurate astronomical parameters for every celestial body! To save screen real-estate, these parameters are organized into interactive tabs:

*   **Physical:** Mass, Volume, Equatorial/Polar Radius, Density, Surface Gravity, Escape Velocity.
*   **Orbital:** Mean Distance, Periapsis, Apoapsis, Orbital Period, Orbital Velocity, Eccentricity, Inclination.
*   **Atmos & Rot:** Day Length, Axial Tilt, Mean Temperature, Surface Pressure, Main Atmospheric Components.
*   **System:** Number of Moons, Ring System Presence, Global Magnetic Field, Discoverer, Discovery Date.

Enjoy your journey through the cosmos!
