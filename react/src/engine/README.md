# Advanced 3D Game Engine Documentation

## Overview

This is a comprehensive 3D game engine built for modern web browsers, featuring raycasting-based rendering, physics simulation, and a component-based architecture. The engine is designed to be modular, extensible, and performant.

## Architecture

### Core Systems

#### 1. Engine (`Engine.js`)
The main orchestrator that manages all core systems and the game loop.

**Key Features:**
- Game loop management with FPS control
- System coordination and updates
- Performance monitoring
- Configuration management

**Usage:**
```javascript
import { Engine } from './engine/core/Engine.js';

const engine = new Engine(canvas, {
  targetFPS: 60,
  enablePhysics: true,
  debug: true
});

engine.start();
```

#### 2. Physics System (`PhysicsSystem.js`)
Handles collision detection, raycasting, and physics simulation.

**Key Features:**
- Raycasting for line-of-sight calculations
- Collision detection (walls, entities)
- Sphere casting for radius-based checks
- Performance-optimized caching

**API:**
```javascript
// Check if position is valid
const isValid = engine.physics.isValidPosition(x, y, radius);

// Cast a ray
const distance = engine.physics.castRay(fromX, fromY, angle, maxDistance);

// Check line of sight
const hasLOS = engine.physics.hasLineOfSight(fromX, fromY, toX, toY);
```

#### 3. Input System (`InputSystem.js`)
Unified input handling for keyboard, mouse, touch, and gamepad.

**Key Features:**
- Cross-platform input support
- Input mapping system
- Event-driven architecture
- State tracking (pressed, just pressed, just released)

**API:**
```javascript
// Check key state
if (engine.input.isKeyPressed('KeyW')) {
  // Move forward
}

// Check action (mapped input)
if (engine.input.isActionActive('shoot')) {
  // Fire weapon
}

// Listen for events
engine.input.addEventListener('keydown', (data) => {
  console.log('Key pressed:', data.key);
});
```

#### 4. Scene Manager (`SceneManager.js`)
Manages game scenes, entities, and scene transitions.

**Key Features:**
- Scene lifecycle management
- Entity organization
- Scene stacking for navigation
- Async scene loading

**API:**
```javascript
// Register a scene
engine.sceneManager.registerScene('MainMenu', MainMenuScene);

// Load a scene
await engine.sceneManager.loadScene('GameLevel');

// Create a custom scene
class MyScene extends Scene {
  async onEnter() {
    // Initialize scene
  }

  onUpdate(deltaTime) {
    // Update logic
  }

  onRender(renderer) {
    // Render scene
  }
}
```

#### 5. Asset Manager (`AssetManager.js`)
Handles loading, caching, and management of game assets.

**Key Features:**
- Async asset loading
- Automatic type detection
- Memory management
- Loading progress tracking

**API:**
```javascript
// Load assets
await engine.assetManager.loadAsset('playerTexture', '/assets/player.png');
await engine.assetManager.loadAsset('levelData', '/assets/level.json');

// Get loaded asset
const texture = engine.assetManager.getAsset('playerTexture');
```

#### 6. Renderer (`Renderer.js`)
Handles all rendering operations with depth-sorted sprites.

**Key Features:**
- Raycasting-based 3D rendering
- Depth-sorted sprite rendering
- Muzzle flash effects
- Game state overlays

## Component System

The engine uses a component-based architecture for entities:

```javascript
class Player extends Entity {
  constructor() {
    super();
    this.addComponent(new TransformComponent());
    this.addComponent(new PhysicsComponent());
    this.addComponent(new RenderComponent());
  }
}
```

## Scene System

### Creating a Scene

```javascript
import { Scene } from './engine/core/SceneManager.js';

class GameScene extends Scene {
  constructor(engine) {
    super(engine, 'Game Scene');
  }

  async onEnter(transitionData) {
    // Initialize scene
    this.player = new Player();
    this.addEntity(this.player);

    // Setup world
    this.engine.physics.setWorld(levelData);
  }

  onUpdate(deltaTime) {
    // Game logic
    if (this.engine.input.isActionJustTriggered('shoot')) {
      this.player.shoot();
    }
  }

  onRender(renderer) {
    // Additional rendering
    renderer.renderHUD();
  }
}
```

## Entity System

### Creating Entities

```javascript
import { Entity } from './engine/Entity.js';

class Enemy extends Entity {
  constructor(x, y) {
    super();
    this.transform.position.set(x, y);
    this.health = 100;
  }

  update(deltaTime) {
    // AI logic
    this.patrol();
    this.checkPlayerDistance();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
}
```

## Physics Integration

### Collision Detection

```javascript
// Check movement validity
if (this.engine.physics.isValidPosition(newX, newY, 0.3)) {
  this.transform.position.x = newX;
  this.transform.position.y = newY;
}

// Raycasting for shooting
const hitDistance = this.engine.physics.castRay(
  this.transform.position.x,
  this.transform.position.y,
  this.transform.rotation,
  20
);
```

## Input Handling

### Action Mapping

```javascript
// Setup custom mappings
engine.input.keyMappings.set('jump', ['Space', 'KeyX']);
engine.input.mouseMappings.set('aim', 1); // Right mouse button

// Use in game logic
if (engine.input.isActionActive('jump')) {
  this.velocity.y = -jumpForce;
}
```

## Asset Management

### Loading Assets

```javascript
// Load multiple assets
await engine.assetManager.loadAssets([
  { key: 'background', url: '/assets/bg.png', type: 'image' },
  { key: 'music', url: '/assets/bgm.mp3', type: 'audio' },
  { key: 'config', url: '/assets/config.json', type: 'json' }
]);

// Use loaded assets
const bgImage = engine.assetManager.getAsset('background');
renderer.drawImage(bgImage, 0, 0);
```

## Performance Optimization

### Best Practices

1. **Use object pooling** for frequently created/destroyed objects
2. **Implement frustum culling** for off-screen objects
3. **Use spatial partitioning** for large worlds
4. **Cache raycast results** when possible
5. **Batch rendering operations**

### Profiling

```javascript
// Get engine statistics
const stats = engine.getStats();
console.log('FPS:', stats.fps);
console.log('Delta Time:', stats.deltaTime);

// Get system-specific stats
const physicsStats = engine.physics.getStats();
const inputStats = engine.input.getStats();
```

## Demo: Doom-like Game

The included Doom demo showcases:

- Raycasting-based 3D rendering
- Enemy AI with line-of-sight detection
- Physics-based collision detection
- Multiple levels with progression
- Touch and keyboard controls

### Running the Demo

```javascript
import { Engine } from './engine/core/Engine.js';
import { DoomDemoScene } from './demos/DoomDemo.js';

const engine = new Engine(canvas);
engine.sceneManager.registerScene('DoomDemo', DoomDemoScene);
await engine.sceneManager.loadScene('DoomDemo');
engine.start();
```

## API Reference

### Engine Methods

- `start()` - Start the engine
- `stop()` - Stop the engine
- `loadScene(name)` - Load a scene
- `getStats()` - Get performance statistics
- `setConfig(config)` - Update engine configuration

### Physics Methods

- `isValidPosition(x, y, radius)` - Check collision
- `castRay(originX, originY, angle, maxDistance)` - Cast ray
- `hasLineOfSight(fromX, fromY, toX, toY)` - Check visibility
- `sphereCast(originX, originY, angle, radius, maxDistance)` - Sphere cast

### Input Methods

- `isKeyPressed(keyCode)` - Check key state
- `isActionActive(action)` - Check mapped action
- `addEventListener(event, callback)` - Add input listener
- `getMousePosition()` - Get mouse position

### Scene Methods

- `addEntity(entity)` - Add entity to scene
- `removeEntity(entity)` - Remove entity from scene
- `findEntitiesWithComponent(type)` - Find entities by component

### Asset Methods

- `loadAsset(key, url, type)` - Load single asset
- `loadAssets(assetList)` - Load multiple assets
- `getAsset(key)` - Get loaded asset
- `hasAsset(key)` - Check if asset exists

## Extending the Engine

### Adding Custom Systems

```javascript
class AudioSystem {
  constructor(engine) {
    this.engine = engine;
  }

  init(engine) {
    // Initialize audio context
  }

  update(deltaTime) {
    // Update audio
  }

  playSound(soundKey) {
    // Play sound logic
  }
}

// Add to engine
engine.addSystem(new AudioSystem(engine));
```

### Creating Custom Components

```javascript
class HealthComponent {
  constructor(maxHealth = 100) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  takeDamage(amount) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  isAlive() {
    return this.currentHealth > 0;
  }
}
```

## Troubleshooting

### Common Issues

1. **Low FPS**: Check `engine.getStats()` for performance bottlenecks
2. **Input not working**: Ensure event listeners are properly bound
3. **Assets not loading**: Check network requests and file paths
4. **Physics glitches**: Verify collision detection parameters

### Debug Mode

Enable debug mode for additional logging and performance metrics:

```javascript
const engine = new Engine(canvas, { debug: true });
```

## Future Enhancements

- WebGL renderer for better performance
- Advanced AI pathfinding
- Multiplayer networking
- Particle systems
- Advanced audio spatialization
- Save/load system
- Level editor integration

---

This engine provides a solid foundation for building 3D web games with modern architecture and performance optimizations.
