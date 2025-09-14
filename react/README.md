# Rabbit-Raycast React

A React implementation of the classic Doom raycasting engine, optimized for the R1 device (240x320px portrait screen) with modern React hooks and components.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Vite](https://img.shields.io/badge/Vite-7.1.2-646CFF)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Overview

This React version of Rabbit-Raycast brings the classic 3D raycasting technology to modern React development. It features:

- **React Hooks Integration** - Modern state management with useState and useEffect
- **Component Architecture** - Modular, reusable React components
- **Real-time 3D Rendering** - Canvas-based raycasting engine
- **Touch & Keyboard Controls** - Multi-input support
- **Responsive Design** - Adapts to different screen sizes
- **Performance Optimized** - 30 FPS target for smooth gameplay

## ✨ Features

### React-Specific Features
- **Functional Components** - Modern React patterns
- **Custom Hooks** - Encapsulated game logic
- **State Management** - React state for game status
- **Event Handling** - React event system integration
- **Component Lifecycle** - Proper cleanup and initialization

### Core Engine Features
- **Raycasting Renderer** - Real-time 3D projection
- **Player Movement** - WASD/Arrow keys + touch controls
- **Collision Detection** - Wall collision and boundary checking
- **Dynamic Lighting** - Distance-based shading
- **Audio System** - Procedural sound generation with Web Audio API
- **Particle Effects** - Muzzle flash and blood splatter effects
- **Muzzle Flash** - Shooting effects with visual feedback

### Hardware Integration
- **R1 Device Support** - Optimized for 240x320px display
- **Touch Controls** - Virtual D-pad and action buttons
- **Orientation Detection** - Auto-adjusts for screen orientation
- **Hardware Events** - Scroll wheel and side button support

### Performance Features
- **Hyper-Optimized** - Designed for low-end embedded browsers
- **60 FPS Target** - Smooth gameplay on resource-constrained devices
- **Memory Efficient** - Object pooling and minimal allocations
- **Canvas 2D Rendering** - No external dependencies
- **Procedural Audio** - No audio file loading required

## � Documentation

For detailed engine documentation, see [ENGINE.md](docs/ENGINE.md).

## �🚀 Quick Start

### Prerequisites
- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Installation & Setup

1. **Navigate to React directory**
   ```bash
   cd react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎯 Usage

### Basic Implementation

```jsx
import React from 'react';
import RaycastingEngine from './components/RaycastingEngine';

function App() {
  return (
    <div className="app">
      <h1>Rabbit-Raycast React</h1>
      <RaycastingEngine />
    </div>
  );
}

export default App;
```

### Custom Configuration

```jsx
import React from 'react';
import RaycastingEngine from './components/RaycastingEngine';

function CustomGame() {
  return (
    <RaycastingEngine
      width={320}
      height={240}
      fov={Math.PI / 2}
      rayCount={160}
    />
  );
}
```

## 🏗️ Architecture

### Component Structure

```
src/
├── App.jsx                 # Main application component
├── App.css                 # Application styles
├── RaycastingEngine.jsx    # Main raycasting component
├── RaycastingEngine.css    # Game-specific styles
└── main.jsx               # React entry point
```

### Key Components

#### RaycastingEngine
The main game component that handles:
- Canvas rendering
- Game loop management
- Input handling
- State management

**Props:**
- `width` (number): Canvas width (default: 240)
- `height` (number): Canvas height (default: 320)
- `fov` (number): Field of view in radians (default: π/3)
- `rayCount` (number): Number of rays to cast (default: 120)

#### Game Engine Class
Internal class that manages:
- Raycasting calculations
- Player movement
- Collision detection
- Rendering pipeline

## 🎮 Controls

### Keyboard Controls
- **WASD** / **Arrow Keys** - Movement
- **Space** - Shoot
- **Shift** - Strafe mode

### Touch Controls
- **D-pad** - Movement (up, down, left, right)
- **FIRE Button** - Shoot
- **STRAFE Button** - Strafe mode

### Hardware Controls (R1 Device)
- **Scroll Wheel** - Turn left/right
- **Side Button** - Shoot

## 🔧 Customization

### Modifying Game Settings

```jsx
// In RaycastingEngine.jsx, modify the DoomEngine constructor
this.fov = Math.PI / 2;        // Wider field of view
this.rayCount = 160;          // Higher quality
this.moveSpeed = 0.15;        // Faster movement
this.maxDepth = 25;           // Longer view distance
```

### Custom Map Creation

```javascript
// Modify the map array in the DoomEngine constructor
this.map = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1]
];
```

### Styling Customization

```css
/* Modify RaycastingEngine.css */
.game-wrapper {
  border-color: #00FF00;  /* Green border */
}

.dpad-btn {
  background-color: rgba(0, 255, 0, 0.8);  /* Green buttons */
}
```

## 🔌 API Reference

### RaycastingEngine Component

#### Props
```typescript
interface RaycastingEngineProps {
  width?: number;
  height?: number;
  fov?: number;
  rayCount?: number;
}
```

#### State
```typescript
interface GameState {
  health: number;
  ammo: number;
  isRunning: boolean;
}
```

#### Methods
- `handleTouchStart(action: string)` - Handle touch start events
- `handleTouchEnd(action: string)` - Handle touch end events

### DoomEngine Class

#### Constructor
```javascript
new DoomEngine(canvas: HTMLCanvasElement)
```

#### Methods
- `start()` - Start the game loop
- `stop()` - Stop the game loop
- `render()` - Render the 3D view
- `update(deltaTime: number)` - Update game state
- `castRay(angle: number)` - Cast a single ray
- `shoot()` - Fire weapon

## 🎨 Styling

### CSS Classes

```css
.raycasting-container  /* Main container */
.game-wrapper          /* Game canvas wrapper */
.game-canvas          /* Canvas element */
.touch-controls       /* Touch control panel */
.dpad                 /* Directional pad */
.dpad-btn             /* D-pad buttons */
.action-buttons       /* Action buttons */
.hud                  /* Heads-up display */
.controls-info        /* Control instructions */
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { ... }

/* Tablet */
@media (min-width: 768px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }
```

## 🧪 Development

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

### Code Structure

```jsx
// Example of extending the component
import React, { useState } from 'react';
import RaycastingEngine from './RaycastingEngine';

function EnhancedGame() {
  const [score, setScore] = useState(0);

  return (
    <div className="enhanced-game">
      <div className="score-display">Score: {score}</div>
      <RaycastingEngine />
    </div>
  );
}
```

### Performance Monitoring

```jsx
// Add performance tracking
useEffect(() => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    console.log(`Component render time: ${endTime - startTime}ms`);
  };
}, []);
```

## 🐛 Troubleshooting

### Common Issues

1. **Canvas not rendering**
   - Check canvas dimensions
   - Verify React ref is attached
   - Check browser console for errors

2. **Controls not working**
   - Verify event listeners are attached
   - Check for conflicting event handlers
   - Test with browser developer tools

3. **Performance issues**
   - Reduce ray count for lower-end devices
   - Check frame rate with browser dev tools
   - Optimize render loop

### Debug Mode

```jsx
// Enable debug mode
const DEBUG = true;

if (DEBUG) {
  console.log('Player position:', game.player);
  console.log('Render time:', deltaTime);
}
```

## 📱 Browser Support

### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Mobile Support
- **iOS Safari**: 14+
- **Chrome Mobile**: 90+
- **Samsung Internet**: 15+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple browsers
5. Submit a pull request

### Development Guidelines

- Use functional components with hooks
- Follow React best practices
- Add TypeScript types for props
- Test on actual R1 device when possible
- Maintain 30 FPS performance target

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Rabbit-Raycast** - Core raycasting algorithm
- **React Team** - Modern React framework
- **Vite** - Fast build tool
- **R1 Device** - Hardware inspiration

---

**Rabbit-Raycast React** - Bringing classic 3D gaming to modern web development! 🎮⚛️
