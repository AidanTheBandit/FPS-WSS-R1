# Development Guide

## Getting Started with Rabbit-Raycast Development

This guide will help you set up your development environment and start contributing to the Rabbit-Raycast project.

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Git**: Version 2.0 or higher
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Recommended Tools
- **VS Code**: With JavaScript extensions
- **Chrome DevTools**: For debugging
- **GitHub Desktop**: For version control
- **R1 Device**: For hardware testing (optional)

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AidanTheBandit/Rabbit-Raycast.git
cd Rabbit-Raycast
```

### 2. Install Dependencies

```bash
cd apps/app
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

This will start Vite's development server with hot reloading.

### 4. Open in Browser

Navigate to `http://localhost:5173` (or the port shown in terminal).

## Project Structure

```
Rabbit-Raycast/
├── apps/app/                 # Main application
│   ├── src/
│   │   ├── main.js          # Core game engine
│   │   ├── style.css        # UI styles
│   │   └── lib/             # Utility libraries
│   ├── index.html           # Main HTML file
│   ├── package.json         # Dependencies
│   ├── vite.config.js       # Build configuration
│   └── build.sh            # Build script
├── index.html               # Root redirect
├── README.md                # Project documentation
├── TECHNICAL.md             # Technical documentation
├── API.md                   # API reference
└── LICENSE                  # License file
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in `apps/app/src/` directory.

### 3. Test Changes

- Use browser developer tools
- Test on different screen sizes
- Test touch controls and keyboard controls
- Verify performance (target: 30 FPS)

### 4. Commit Changes

```bash
git add .
git commit -m "Add: Brief description of changes"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Core Development Concepts

### Game Loop Architecture

The engine uses a classic game loop pattern:

```javascript
class DoomEngine {
  constructor(canvas) {
    // Initialize game state
  }

  update(deltaTime) {
    // Update game logic
    // Handle input
    // Update player position
    // Check collisions
  }

  render() {
    // Clear screen
    // Cast rays for 3D view
    // Draw walls, floor, ceiling
    // Draw HUD
  }

  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.render();
      this.lastTime = currentTime;
    }

    requestAnimationFrame(time => this.gameLoop(time));
  }
}
```

### Raycasting Fundamentals

Understanding the core rendering algorithm:

```javascript
castRay(angle) {
  // Start from player position
  let x = this.player.x;
  let y = this.player.y;

  // March along ray path
  for (let depth = 0; depth < this.maxDepth; depth += 0.1) {
    const testX = Math.floor(x);
    const testY = Math.floor(y);

    // Check for wall
    if (this.map[testY][testX] === 1) {
      return depth; // Hit wall
    }

    // Move ray forward
    x += Math.cos(angle) * 0.1;
    y += Math.sin(angle) * 0.1;
  }

  return this.maxDepth; // No wall hit
}
```

### Input Handling

The engine supports multiple input methods:

```javascript
// Keyboard input
window.addEventListener('keydown', (event) => {
  switch(event.code) {
    case 'KeyW': game.keys.up = true; break;
    case 'KeyS': game.keys.down = true; break;
    // ... more keys
  }
});

// Touch input
button.addEventListener('touchstart', () => {
  game.touching.up = true;
});

// Hardware input (R1 device)
window.addEventListener('scrollUp', () => {
  game.player.angle -= game.turnSpeed;
});
```

## Common Development Tasks

### Adding New Controls

1. **Add to input state:**
```javascript
// In DoomEngine constructor
this.keys.newAction = false;
this.touching.newAction = false;
```

2. **Add keyboard handler:**
```javascript
case 'KeyN': game.keys.newAction = true; break;
```

3. **Add touch button:**
```javascript
// In setupTouchControls()
const newButton = document.getElementById('newAction');
newButton.addEventListener('touchstart', () => {
  game.touching.newAction = true;
});
```

4. **Handle in update():**
```javascript
if (this.keys.newAction || this.touching.newAction) {
  // Perform new action
}
```

### Modifying the Map

1. **Edit the map array:**
```javascript
this.map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  // Add your custom layout
];
```

2. **Update map dimensions:**
```javascript
this.mapWidth = this.map[0].length;
this.mapHeight = this.map.length;
```

### Adding Visual Effects

1. **Muzzle flash example:**
```javascript
shoot() {
  if (this.player.ammo > 0) {
    this.player.ammo--;
    this.muzzleFlash = 0.5; // Flash duration
    // ... shooting logic
  }
}
```

2. **Render the effect:**
```javascript
// In render() method
if (this.muzzleFlash > 0) {
  this.ctx.fillStyle = `rgba(255, 255, 0, ${this.muzzleFlash})`;
  this.ctx.fillRect(0, 0, this.width, this.height);
  this.muzzleFlash -= 0.1; // Fade out
}
```

### Performance Optimization

1. **Profile with Chrome DevTools:**
   - Open DevTools (F12)
   - Go to Performance tab
   - Record a session
   - Analyze frame times

2. **Common optimizations:**
```javascript
// Reduce ray count for performance
this.rayCount = 80; // Instead of 120

// Limit frame rate
this.targetFPS = 25; // Instead of 30

// Cache calculations
const cos = Math.cos(angle);
const sin = Math.sin(angle);
```

## Testing and Debugging

### Browser Testing

1. **Chrome DevTools:**
   - Console for logging
   - Sources for debugging
   - Performance for profiling
   - Application for storage

2. **Responsive Testing:**
   - Use device emulation
   - Test different screen sizes
   - Verify touch targets

### R1 Device Testing

1. **Hardware Controls:**
   - Test scroll wheel events
   - Test side button
   - Test orientation changes

2. **Performance:**
   - Monitor frame rate
   - Check battery usage
   - Test in different lighting

### Automated Testing

```javascript
// Basic test setup
function testRaycasting() {
  const game = new DoomEngine(document.createElement('canvas'));

  // Test ray casting
  const distance = game.castRay(0);
  console.assert(distance > 0, 'Ray should hit wall');

  // Test movement
  const oldX = game.player.x;
  game.keys.up = true;
  game.update(16);
  console.assert(game.player.x > oldX, 'Player should move forward');
}
```

## Build and Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Deploying to R1 Device

1. **Build the project:**
```bash
npm run build
```

2. **Copy files to R1:**
   - Copy `dist/` contents to device
   - Ensure `index.html` is at root
   - Test hardware integration

## Code Style Guidelines

### JavaScript Style

1. **Use ES6+ features:**
```javascript
// ✅ Good
const { x, y } = player;
const distance = Math.sqrt(dx**2 + dy**2);

// ❌ Avoid
var player = { x: 0, y: 0 };
var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
```

2. **Consistent naming:**
```javascript
// Classes: PascalCase
class DoomEngine { }

// Methods: camelCase
updatePlayer() { }

// Constants: UPPER_SNAKE_CASE
const MAX_DEPTH = 20;

// Variables: camelCase
let playerPosition = 0;
```

3. **Comments for complex logic:**
```javascript
// Calculate wall height using perspective projection
const wallHeight = (this.height / 2) / distance;
```

### CSS Style

1. **Use viewport units for R1:**
```css
/* ✅ Good */
.button {
  width: 80vw;
  height: 15vw;
}

/* ❌ Avoid */
.button {
  width: 192px;
  height: 36px;
}
```

2. **Organize by component:**
```css
/* Game Canvas */
#gameCanvas { /* ... */ }

/* HUD Elements */
.hud { /* ... */ }

/* Touch Controls */
.touch-controls { /* ... */ }
```

## Troubleshooting

### Common Issues

1. **Game not starting:**
   - Check console for errors
   - Verify canvas element exists
   - Ensure proper initialization order

2. **Controls not working:**
   - Check event listeners are attached
   - Verify element IDs match
   - Test with keyboard first

3. **Performance issues:**
   - Reduce ray count
   - Lower target FPS
   - Check for memory leaks

4. **R1 hardware not responding:**
   - Verify plugin environment
   - Check event listener attachment
   - Test with browser fallbacks

### Debug Tools

```javascript
// Performance monitoring
console.log(`Frame time: ${deltaTime}ms`);
console.log(`FPS: ${1000 / deltaTime}`);

// State debugging
console.log('Player state:', game.player);
console.log('Input state:', game.keys);

// Ray debugging
console.log(`Ray distance: ${distance} at angle ${angle}`);
```

## Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Update documentation**
6. **Submit pull request**

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

**Examples:**
```
feat: add texture mapping for walls
fix: resolve collision detection bug
docs: update API documentation
```

## Resources

### Learning Materials
- [Raycasting Tutorial](https://lodev.org/cgtutor/raycasting.html)
- [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Game Development Patterns](https://gameprogrammingpatterns.com/)

### Tools and Libraries
- [Vite](https://vitejs.dev/) - Build tool
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

### Community
- [GitHub Issues](https://github.com/AidanTheBandit/Rabbit-Raycast/issues)
- [GitHub Discussions](https://github.com/AidanTheBandit/Rabbit-Raycast/discussions)

This development guide should help you get started with Rabbit-Raycast development. Happy coding! 🎮
