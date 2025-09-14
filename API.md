# API Documentation

## Rabbit-Raycast Engine API

This document provides a complete API reference for the Rabbit-Raycast game engine.

## Classes

### DoomEngine

The main game engine class that handles rendering, input, and game logic.

#### Constructor

```javascript
new DoomEngine(canvas: HTMLCanvasElement)
```

Creates a new game engine instance.

**Parameters:**
- `canvas` - The HTML5 canvas element for rendering

**Example:**
```javascript
const canvas = document.getElementById('gameCanvas');
const game = new DoomEngine(canvas);
```

#### Properties

##### Player State
```javascript
game.player: {
  x: number,        // X position (world units)
  y: number,        // Y position (world units)
  angle: number,    // Facing angle (radians)
  health: number,   // Health points (0-100)
  ammo: number      // Ammunition count
}
```

##### Game Configuration
```javascript
game.width: number          // Canvas width (240 or 320)
game.height: number         // Canvas height (320 or 240)
game.fov: number           // Field of view (radians)
game.rayCount: number      // Number of rays to cast
game.maxDepth: number      // Maximum view distance
game.moveSpeed: number     // Player movement speed
game.turnSpeed: number     // Player turning speed
```

##### Game World
```javascript
game.map: number[][]       // 2D game world array
game.mapWidth: number      // Map width in tiles
game.mapHeight: number     // Map height in tiles
```

##### Input State
```javascript
game.keys: object         // Keyboard input state
game.touching: object     // Touch input state
```

##### Rendering
```javascript
game.canvas: HTMLCanvasElement  // Game canvas
game.ctx: CanvasRenderingContext2D  // Canvas 2D context
```

#### Methods

##### Core Engine Methods

```javascript
start(): void
```
Starts the game loop and rendering.

```javascript
stop(): void
```
Stops the game loop.

```javascript
gameLoop(currentTime: number): void
```
Main game loop function (called automatically).

**Parameters:**
- `currentTime` - Current timestamp from requestAnimationFrame

##### Rendering Methods

```javascript
render(): void
```
Renders the 3D view using raycasting.

```javascript
castRay(angle: number): number
```
Casts a single ray and returns distance to wall.

**Parameters:**
- `angle` - Ray angle in radians

**Returns:** Distance to nearest wall

**Example:**
```javascript
const distance = game.castRay(Math.PI / 4); // Cast ray at 45 degrees
console.log(`Wall distance: ${distance}`);
```

##### Game Logic Methods

```javascript
update(deltaTime: number): void
```
Updates game state (movement, collisions, etc.).

**Parameters:**
- `deltaTime` - Time elapsed since last update (milliseconds)

```javascript
shoot(): void
```
Fires the player's weapon.

##### Collision Detection

```javascript
isValidPosition(x: number, y: number): boolean
```
Checks if a position is valid (not inside walls).

**Parameters:**
- `x` - X coordinate to check
- `y` - Y coordinate to check

**Returns:** `true` if position is valid, `false` otherwise

**Example:**
```javascript
if (game.isValidPosition(5.5, 3.2)) {
  game.player.x = 5.5;
  game.player.y = 3.2;
}
```

## Global Functions

### Hardware Integration

```javascript
// R1 Device Event Listeners
window.addEventListener('scrollUp', callback: Function): void
window.addEventListener('scrollDown', callback: Function): void
window.addEventListener('sideClick', callback: Function): void
```

Hardware event listeners for R1 device integration.

**Examples:**
```javascript
// Scroll wheel for turning
window.addEventListener('scrollUp', () => {
  game.player.angle -= 0.1;
});

window.addEventListener('scrollDown', () => {
  game.player.angle += 0.1;
});

// Side button for shooting
window.addEventListener('sideClick', () => {
  game.shoot();
});
```

### Orientation Detection

```javascript
detectOrientation(): void
```
Detects device orientation and adjusts game settings.

```javascript
window.addEventListener('orientationchange', detectOrientation): void
window.addEventListener('resize', detectOrientation): void
```

### Touch Controls Setup

```javascript
setupTouchControls(): void
```
Initializes touch control event listeners.

**Sets up event listeners for:**
- D-pad buttons (up, down, left, right)
- Action buttons (shoot, use, strafe)
- Touch start/end events

### Plugin Communication

```javascript
window.onPluginMessage(data: object): void
```
Handles messages from the R1 plugin system.

**Parameters:**
- `data` - Message data object

**Example:**
```javascript
window.onPluginMessage = function(data) {
  console.log('Plugin message:', data);
  if (data.type === 'multiplayer') {
    // Handle multiplayer data
  }
};
```

## Data Structures

### Map Format

The game world is represented as a 2D array:

```javascript
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 1 = wall
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 0 = empty space
  [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1], // Complex geometry
  // ... more rows
];
```

- `0` - Empty space (player can move through)
- `1` - Wall (blocks movement and vision)

### Input State Objects

```javascript
// Keyboard state
{
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
  strafe: boolean
}

// Touch state
{
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
  shoot: boolean,
  use: boolean,
  strafe: boolean
}
```

## Constants

### Performance Settings
```javascript
const TARGET_FPS = 30;
const MAX_DEPTH = 20;
const RAY_COUNT_PORTRAIT = 120;
const RAY_COUNT_LANDSCAPE = 160;
```

### Control Settings
```javascript
const MOVE_SPEED = 0.1;
const TURN_SPEED = 0.05;
const MOUSE_SENSITIVITY = 0.002;
```

### Rendering Settings
```javascript
const WALL_COLOR = [255, 128, 0];  // Orange walls
const FLOOR_COLOR = '#666666';
const CEILING_COLOR = '#333333';
const HUD_COLOR = '#FE5F00';
```

## Events

### Game Events
- `game.start` - Fired when game loop starts
- `game.stop` - Fired when game loop stops
- `player.shoot` - Fired when player shoots
- `player.move` - Fired when player moves
- `orientation.change` - Fired when device orientation changes

### Input Events
- `keydown` - Keyboard key pressed
- `keyup` - Keyboard key released
- `touchstart` - Touch begins
- `touchend` - Touch ends
- `scrollUp` - Hardware scroll wheel up
- `scrollDown` - Hardware scroll wheel down
- `sideClick` - Hardware side button pressed

## Error Handling

The engine includes basic error handling:

```javascript
try {
  const game = new DoomEngine(canvas);
  game.start();
} catch (error) {
  console.error('Failed to initialize game:', error);
  // Fallback to error screen
}
```

## Browser Compatibility

### Supported Features
- ES6+ JavaScript
- HTML5 Canvas 2D
- requestAnimationFrame
- Touch events
- Device orientation events

### Fallbacks
- Touch events fall back to mouse events
- Hardware events are optional (graceful degradation)
- Canvas rendering falls back to basic 2D context

## Examples

### Basic Game Setup
```javascript
// Initialize game
const canvas = document.getElementById('gameCanvas');
const game = new DoomEngine(canvas);

// Setup controls
setupTouchControls();

// Start game
game.start();

// Handle orientation changes
window.addEventListener('orientationchange', () => {
  detectOrientation();
});
```

### Custom Map Creation
```javascript
// Create custom map
const customMap = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1]
];

// Apply to game
game.map = customMap;
game.mapWidth = customMap[0].length;
game.mapHeight = customMap.length;
```

### Custom Controls
```javascript
// Add custom keyboard controls
window.addEventListener('keydown', (event) => {
  switch(event.code) {
    case 'KeyR':
      // Reload weapon
      game.player.ammo = 50;
      break;
    case 'KeyH':
      // Heal player
      game.player.health = Math.min(100, game.player.health + 25);
      break;
  }
});
```

### Performance Monitoring
```javascript
// Monitor frame rate
let frameCount = 0;
let lastTime = performance.now();

function monitorPerformance(currentTime) {
  frameCount++;
  if (currentTime - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = currentTime;
  }
}

// Add to game loop
const originalGameLoop = game.gameLoop;
game.gameLoop = function(time) {
  monitorPerformance(time);
  originalGameLoop.call(this, time);
};
```

This API documentation provides everything needed to understand, use, and extend the Rabbit-Raycast engine.
