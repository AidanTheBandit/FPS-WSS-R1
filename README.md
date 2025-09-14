# Rabbit-Raycast

A complete JavaScript implementation of a Doom-like 3D raycasting engine, optimized for the R1 device (240x320px portrait screen) with hardware integration and touch controls.

![Rabbit-Raycast Demo](https://img.shields.io/badge/Demo-Raycasting-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Overview

Rabbit-Raycast is a from-scratch implementation of classic 3D raycasting technology, similar to the rendering engine used in Wolfenstein 3D and Doom. This demo showcases:

- **Real-time 3D rendering** using raycasting algorithm
- **Hardware-optimized** for R1 device (240x320px)
- **Touch controls** with virtual D-pad and action buttons
- **Physical controls** integration (scroll wheel, side button)
- **Responsive design** supporting portrait/landscape orientations
- **Performance optimizations** for mobile webview environment

## ✨ Features

### Core Engine
- **Raycasting Renderer**: Real-time 3D projection using distance calculations
- **Player Movement**: WASD/Arrow keys + touch controls
- **Collision Detection**: Wall collision and boundary checking
- **Dynamic Lighting**: Distance-based shading for depth perception
- **Muzzle Flash**: Shooting effects with visual feedback

### Hardware Integration
- **R1 Device Support**: Optimized for 240x320px portrait display
- **Scroll Wheel Controls**: Hardware scroll wheel for turning
- **Side Button**: Physical button for shooting
- **Orientation Detection**: Auto-adjusts for portrait/landscape modes

### Controls & UI
- **Touch Controls**: Virtual D-pad with movement and strafe
- **Keyboard Support**: Full keyboard controls for development
- **HUD Display**: Health and ammo counters
- **Responsive Layout**: Adapts to screen orientation changes

## 🚀 Quick Start

### Prerequisites
- Modern web browser with ES6+ support
- Node.js 16+ (for development)
- Vite (build tool)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AidanTheBandit/Rabbit-Raycast.git
   cd Rabbit-Raycast
   ```

2. **Install dependencies**
   ```bash
   cd apps/app
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Running the Demo

- **Web Browser**: Open `index.html` in your browser
- **R1 Device**: Deploy as a webview plugin
- **Development**: Use `npm run dev` for hot reloading

## 🎯 Controls

### Touch Controls (Primary)
- **D-Pad**: Move forward/backward, strafe left/right
- **FIRE Button**: Shoot (with muzzle flash effect)
- **USE Button**: Reserved for future features
- **STRAFE Button**: Toggle strafe mode

### Hardware Controls (R1 Device)
- **Scroll Wheel**: Turn left/right (80px auto-scroll + custom handling)
- **Side Button**: Shoot action
- **Orientation**: Auto-detects portrait/landscape

### Keyboard Controls (Development)
- **WASD / Arrow Keys**: Movement
- **Space**: Shoot
- **Shift**: Strafe mode
- **Mouse**: (Future feature)

## 🏗️ Architecture

### Core Components

```
Rabbit-Raycast/
├── main.js              # Main game engine and initialization
├── style.css            # Responsive UI styles
├── index.html           # Main HTML structure
└── lib/
    ├── device-controls.js   # Hardware control handlers
    ├── device-controls.md   # Control documentation
    ├── ui-design.js         # UI component utilities
    └── ui-design.md         # Design system guide
```

### Engine Architecture

```javascript
class DoomEngine {
  constructor(canvas) {
    // Canvas and rendering setup
    // Player state management
    // Input handling
    // Game world data
  }

  castRay(angle)        // Core raycasting algorithm
  render()             // 3D projection rendering
  update(deltaTime)    // Game logic updates
  gameLoop()           // Main game loop
}
```

## 🔧 Technical Details

### Raycasting Algorithm

The engine uses a simplified raycasting approach:

1. **Ray Casting**: For each vertical screen column, cast a ray from player position
2. **Distance Calculation**: Calculate distance to nearest wall intersection
3. **Wall Height**: Project wall height based on distance (closer = taller)
4. **Shading**: Apply distance-based shading for depth perception

```javascript
castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let x = this.player.x;
  let y = this.player.y;

  for (let depth = 0; depth < this.maxDepth; depth += 0.1) {
    const testX = Math.floor(x);
    const testY = Math.floor(y);

    if (this.map[testY][testX] === 1) {
      return depth; // Hit wall
    }

    x += cos * 0.1;
    y += sin * 0.1;
  }

  return this.maxDepth; // No wall hit
}
```

### Performance Optimizations

- **Reduced Ray Count**: 120 rays for 240px width (vs 320 for full HD)
- **Target FPS**: 30 FPS for mobile performance
- **Frame Skipping**: Delta-time based updates
- **Pixel Rendering**: Direct canvas manipulation

### Map System

Simple 2D array representation:
```javascript
this.map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1 = wall
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 0 = empty
  [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1], // Complex layout
  // ... more rows
];
```

## 📱 R1 Device Integration

### Hardware Events

The engine integrates with R1 device hardware:

```javascript
// Scroll wheel for turning
window.addEventListener('scrollUp', () => {
  game.player.angle -= game.turnSpeed * 2;
});

window.addEventListener('scrollDown', () => {
  game.player.angle += game.turnSpeed * 2;
});

// Side button for shooting
window.addEventListener('sideClick', () => {
  game.shoot();
});
```

### Orientation Handling

Auto-detects and adapts to device orientation:

```javascript
function detectOrientation() {
  const mode = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  if (mode !== orientationMode) {
    // Adjust canvas size and ray count
    game.width = mode === 'landscape' ? 320 : 240;
    game.height = mode === 'landscape' ? 240 : 320;
    game.rayCount = mode === 'landscape' ? 160 : 120;
  }
}
```

## 🎨 Customization

### Modifying the Map

Edit the `map` array in `DoomEngine` constructor:

```javascript
this.map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // Add your custom layout
];
```

### Adjusting Performance

Modify these values in the constructor:

```javascript
this.targetFPS = 30;        // Target frame rate
this.rayCount = 120;        // Number of rays (affects quality)
this.maxDepth = 20;         // Maximum view distance
this.moveSpeed = 0.1;       // Player movement speed
```

### Visual Customization

Modify colors and rendering in the `render()` method:

```javascript
// Wall colors
this.ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.5)}, 0)`;

// Floor/ceiling colors
this.ctx.fillStyle = '#333'; // Ceiling
this.ctx.fillStyle = '#666'; // Floor
```

## 🛠️ Development

### Project Structure

```
apps/app/
├── src/
│   ├── main.js          # Main game engine
│   ├── style.css        # UI styles
│   └── lib/             # Utility libraries
├── index.html           # Main HTML
├── package.json         # Dependencies
├── vite.config.js       # Build configuration
└── build.sh            # Build script
```

### Build System

Uses Vite for fast development and optimized builds:

```javascript
// vite.config.js
export default {
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}
```

### Adding Features

1. **New Controls**: Add to `setupTouchControls()` and keyboard handlers
2. **Game Objects**: Extend the map system or add sprite rendering
3. **Audio**: Integrate Web Audio API for sound effects
4. **Multiplayer**: Add WebSocket communication

## 📚 API Reference

### DoomEngine Class

#### Constructor
```javascript
new DoomEngine(canvas)
```

#### Methods
- `start()` - Begin the game loop
- `stop()` - Stop the game loop
- `shoot()` - Fire weapon
- `castRay(angle)` - Cast single ray
- `render()` - Render 3D view
- `update(deltaTime)` - Update game state

#### Properties
- `player` - Player state object
- `map` - 2D game world array
- `keys` - Keyboard input state
- `touching` - Touch input state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple devices
5. Submit a pull request

### Development Guidelines

- Maintain 30 FPS performance target
- Test on actual R1 device when possible
- Follow ES6+ best practices
- Add JSDoc comments for new functions
- Update documentation for new features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by John Carmack's raycasting work in Doom
- R1 device hardware integration
- Classic FPS gaming heritage

## 🔗 Links

- [Live Demo](https://aidanthebandit.github.io/Rabbit-Raycast/)
- [R1 Device Documentation](https://r1-device-docs.example.com)
- [Raycasting Tutorial](https://lodev.org/cgtutor/raycasting.html)

---

**Rabbit-Raycast** - Bringing classic 3D gaming to modern hardware! 🎮✨