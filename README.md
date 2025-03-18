# **Project Plan: “Katamari-Like” Browser Game (Pure Geometric Shapes)**

---

## **1. Overview and Objectives**

### **1.1 Game Description**
- A whimsical 3D browser game inspired by *Katamari Damacy*, featuring a **“sticky” sphere**.
- The sphere roams a simple environment, **absorbing purely geometric** objects smaller than its current size (e.g., cubes, spheres, cones).
- Every absorbed object increases the sphere’s diameter, eventually allowing the sphere to pick up bigger shapes.
- Rendering uses **Three.js** with **primitive geometry** (no textures, no external model formats) and **playful rainbow-like colors**.

### **1.2 Primary Goal**
- Deliver a **fully functional** web-based game (HTML5, CSS3, JavaScript, Three.js) with no server-side requirements.
- The final deliverable is an `index.html` plus JS/CSS/assets that function **offline** or online in any modern browser.

### **1.3 High-Level Game Flow**
1. **Main Menu** → “Start Game” → Initializes the 3D scene with a sticky sphere.
2. **Controls**
   - **Desktop**: `W, A, S, D` or arrow keys.
   - **Mobile**: Device orientation or a fallback to on-screen buttons.
3. **Absorption Mechanic**: Sphere absorbs objects smaller than itself and grows in diameter.
4. **Scaling Up**: After surpassing certain size thresholds, the camera zooms out and larger objects may appear.
5. **Optional Win Condition**: Infinite sandbox or a set size goal (e.g., 1000 cm).

### **1.4 Key Principles**
- **Playful & Whimsical**: Childlike, rainbow color schemes, comedic sense of scale.
- **Performance-Friendly**: Low-polygon geometry, minimal overhead.
- **Clean Architecture**: ES6 modules, well-organized folders, clear documentation.

---

## **2. Technology Stack**

### **2.1 Core Web Technologies**
- **HTML5** for the structure and menu UI.
- **CSS3** for styling (bright, cheerful theme).
- **JavaScript (ES6+)** for all game logic.
- **Three.js** for 3D rendering with basic shapes.
- **(Optional) jQuery** for simple DOM/UI interactions.

### **2.2 Additional Libraries (Optional)**
- Lightweight physics/collision libraries (if needed).
- **DeviceOrientation** or sensor API for mobile tilt.

### **2.3 Delivery**
- A self-contained `index.html` referencing local `main.js`, styles, and assets.
- Everything runs offline with no server calls.

---

## **3. Folder and File Structure**

```plaintext
project-root/
│
├─ index.html
├─ /css
│   ├─ main.css
│   ├─ /components/
│   ├─ /layout/
│   └─ /theme/
│
├─ /js
│   ├─ main.js                 // SINGLE ENTRY POINT (no load.js option)
│   ├─ /game
│   │   ├─ gameController.js
│   │   ├─ objectManager.js
│   │   ├─ physics.js
│   │   ├─ cameraController.js
│   │   ├─ inputHandler.js
│   │   └─ ...
│   └─ /util
│       └─ helpers.js
│
├─ /data
│   ├─ objectDefinitions.json
│   ├─ levels.json
│   └─ ...
│
└─ README.md
```

- **No external 3D models**—use built-in shapes (cubes, spheres, cones, etc.).
- **No textures**—use arrays of **childlike, rainbow colors** for variety.
- Multiple color options per object to keep visuals fun and unpredictable.

---

## **4. Gameplay Mechanics**

### **4.1 Core Mechanics**
- **Sticky Ball**: Absorbs smaller geometric items.
- **Growth**: The sphere’s diameter increases incrementally upon absorbing an object.
- **Obstacle vs. Collectible**: Larger objects remain uncollectable until the sphere is big enough.

### **4.2 Camera and Zoom Levels**
- **Phased Camera**: As the sphere grows, camera position/FOV is adjusted.
- **Size Thresholds** trigger new object spawns or remove tiny objects.

### **4.3 Environment / Level Design**
- Single ground plane with a uniform or gradient color.
- Scattered basic shapes (boxes, spheres, cones, cylinders) in playful rainbow hues.

### **4.4 Movement & Controls**
- **Desktop**: WASD/arrow keys for sphere movement.
- **Mobile**: Device tilt (via DeviceOrientation) or on-screen buttons as fallback.

### **4.5 Visuals & Presentation**
- **Pure Geometric Forms**: No textures, single or multiple color arrays per shape for random assignment.
- Optional: Display tiny shapes “attached” to the sphere’s surface to reflect collected items.
- Minimal HUD with sphere diameter (or a progress bar).

### **4.6 Progress & Win State**
- Infinite sandbox or a preset “target diameter.”
- Upon reaching the goal, optional “Victory” screen or continue playing freely.

---

## **5. Technical Implementation Details**

### **5.1 Main HTML Flow**
- `index.html` shows a “Start Game” button or menu.
- On click, it loads `main.js`, which initializes Three.js (`scene`, `camera`, `renderer`) and the game loop.

### **5.2 Modules & Class Structure**
- **`main.js`**
  - Orchestrates all modules.
  - Sets up lights, camera, scene, and starts the render loop.

- **`gameController.js`**
  - Oversees game states (start, pause, end).
  - Manages sphere size, triggers new spawns.

- **`objectManager.js`**
  - Reads shape definitions from JSON/JS data (with multiple color options).
  - Spawns objects based on size thresholds and game progress.

- **`physics.js`**
  - Collision detection (bounding sphere checks).
  - Absorption logic for smaller shapes.

- **`cameraController.js`**
  - Adjusts camera distance/FOV in response to sphere growth.

- **`inputHandler.js`**
  - Desktop keyboard events.
  - Mobile tilt or on-screen fallback.

### **5.3 Data Files**
- **`objectDefinitions.json`** example:
  ```json
  [
    {
      "id": "smallCube",
      "geometryType": "box",
      "sizeRange": [1, 3],
      "colors": ["#FF0000", "#FFA500", "#FFFF00"]
    },
    {
      "id": "smallSphere",
      "geometryType": "sphere",
      "sizeRange": [2, 4],
      "colors": ["#008000", "#0000FF", "#4B0082"]
    },
    {
      "id": "bigCone",
      "geometryType": "cone",
      "sizeRange": [50, 100],
      "colors": ["#EE82EE", "#FF1493", "#FFC0CB"]
    }
  ]
  ```
- **`levels.json`** example:
  ```json
  {
    "phases": [
      {
        "minSize": 0,
        "maxSize": 10,
        "spawnableObjects": ["smallCube", "smallSphere"]
      },
      {
        "minSize": 10,
        "maxSize": 50,
        "spawnableObjects": ["smallSphere", "bigCone"]
      }
    ]
  }
  ```
- Each shape has **multiple color entries** in a `colors` array so that every spawn can use a random (rainbow-themed) color.

### **5.4 Rendering & Performance**
- **Low-Poly Shapes**: Boxes, spheres, cones, cylinders.
- **Culling**: Remove or hide objects that are no longer relevant.
- Track object count for stable framerates (aim ~60 FPS).

### **5.5 Saving / State Management**
- **Optional**: Use `localStorage` for current size or unlocked phases.
- MVP: A single session with no persistent save.

### **5.6 Styling & UI**
- **CSS**: Vibrant, childlike colors, big playful fonts for UI.
- Keep the layout simple: Start screen, HUD overlay with the sphere’s size.

### **5.7 Mobile Support**
- **DeviceOrientation** for tilt control.
- Fallback: Touch-based direction buttons if sensor access is restricted.

### **5.8 Audio (Optional)**
- Whimsical sound effects or loops.
- Potential `soundManager.js` for loading local audio clips.

---

## **6. MVP Scope vs. Future Enhancements**

### **6.1 Minimum Viable Product (MVP)**
1. Single ground plane, one sticky sphere, 2–3 shape types (cube, sphere, cone) with random colors.
2. Absorption and growth mechanic + at least one camera zoom-out transition.
3. Desktop keyboard input and basic mobile tilt fallback.
4. Minimal UI showing sphere size.

### **6.2 Future / Nice-to-Have Features**
- More shape variety (pyramids, cylinders, etc.).
- Ramps or varied terrain.
- Sound/music for immersion.
- Visible shape attachments on the sphere.
- Missions, scoring, timers, or more advanced level structures.

---

## **7. Risks and Constraints**

1. **Performance**
   - Large numbers of objects can affect FPS, especially on mobile.
   - Implement culling and keep geometry simple.

2. **Cross-Browser Issues**
   - ES6 modules are standard in modern browsers; older browsers may need polyfills.
   - Validate in Chrome, Firefox, Edge, Safari.

3. **Mobile Sensor Permissions**
   - Some users deny orientation access; must ensure on-screen fallback.

4. **Scope Creep**
   - Limit new features so MVP remains achievable in the planned timeframe.

---

## **8. Project Management and Next Steps**

### **8.1 Phases & Task Breakdown**

1. **Phase 1**
   - Basic Three.js scene, keyboard controls, single shape.
   - Simple collision detection and sphere rolling.

2. **Phase 2**
   - Implement multiple shapes with random colors.
   - Camera zoom on size thresholds, mobile tilt input.

3. **Phase 3**
   - Add culling/performance optimizations, improved collision.
   - Basic UI/HUD for current sphere size and menu.

4. **Phase 4** (Optional)
   - Shape attachments, audio, advanced environment, or mission structure.

### **8.2 Key Deliverables**
- Working prototypes at each phase.
- Final `index.html` + `main.js`, along with CSS and data files (no server required).

### **8.3 Milestones**
- **M1**: Sphere rolling, collisions with at least one shape type.
- **M2**: Multi-shape spawns with random color assignment, camera resizing.
- **M3**: Mobile tilt controls, stable performance.
- **M4**: UI polish, optional sounds, final tests.

### **8.4 Team Roles (Optional)**
- **Lead Developer**: Implements core Three.js logic, collisions, camera, and geometry.
- **Front-End/UI**: Designs menu, HUD, and color scheme.
- **QA Tester**: Ensures cross-browser/device performance.

### **8.5 Testing & QA**
- Desktop (Chrome, Firefox, Edge, Safari).
- Mobile (Android, iOS) for tilt and performance checks.
- Monitor FPS when multiple objects spawn.

