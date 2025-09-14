# Rabbit-Raycast Game Engine Documentation

## Overview

Rabbit-Raycast is a lightweight, high-performance 3D game engine optimized for low-end embedded browsers. Built with modern Ja### Rendering Optimizations
- Reduced ray count (45 rays)
- Canvas buffer reuse
- Minimal redraw operations
- Particle system with object pooling

### Audio Optimizations
- Procedural sound generation
- Web Audio API for low latency
- No external audio file dependencies
- Automatic context management

### Memory Optimizations
- Object pooling for particles
- Efficient array operations
- Cached raycast results
- Minimal DOM manipulationanvas 2D API, it provides essential game development features while maintaining excellent performance on resource-constrained devices.

## Architecture

### Core Systems

#### 1. Engine Core (`Engine.js`)
The main engine class that orchestrates all subsystems.

**Key Features:**
- Game loop management with `requestAnimationFrame`
- FPS monitoring and frame rate control
- System initialization and cleanup
- Scene management integration

**Performance Optimizations:**
- Fixed time step game loop
- Frame rate capping at 60 FPS
- Memory-efficient system management

#### 2. Rendering System (`Renderer.js`)
Canvas-based 3D raycasting renderer.

**Features:**
- Real-time raycasting with configurable FOV
- Distance-based shading and lighting
- Sprite rendering for enemies
- HUD overlay rendering
- Muzzle flash effects

**Optimizations:**
- Reduced ray count for performance (45 rays)
- Efficient canvas operations
- Minimal DOM manipulation

#### 3. Physics System (`PhysicsSystem.js`)
Collision detection and spatial queries.

**Features:**
- Wall collision detection
- Line-of-sight calculations
- Raycasting for spatial queries
- Movement validation

**Optimizations:**
- Cached raycast results
- Spatial partitioning (future enhancement)
- Efficient collision algorithms

#### 4. Input System (`InputSystem.js`)
Unified input handling for multiple devices.

**Features:**
- Keyboard, mouse, and touch support
- Action mapping system
- Hardware-specific controls
- Input state management

**Optimizations:**
- Event debouncing
- Minimal event listeners
- Efficient state updates

#### 6. Audio System (`AudioSystem.js`)
Web Audio API-based sound management.

**Features:**
- Procedural sound generation
- Sound effect playback
- Background music support
- Volume controls
- Memory-efficient audio

**Optimizations:**
- Procedural audio generation (no file loading)
- Web Audio API for low latency
- Automatic resource cleanup

#### 7. Particle System (`ParticleSystem.js`)
Lightweight particle effects.

**Features:**
- Object pooling for performance
- Configurable particle properties
- Muzzle flash and blood effects
- Gravity and fading support

**Optimizations:**
- Limited particle count
- Object reuse (pooling)
- Simple physics calculations

### Entity Component System

#### Base Entity Classes

##### Scene (`Scene.js`)
Base class for all game scenes.

**Methods:**
- `onEnter()` - Scene initialization
- `onUpdate(deltaTime)` - Frame updates
- `onRender(renderer)` - Rendering
- `addEntity(entity)` - Add entities to scene

##### Player (`Player.js`)
Player character with movement and combat.

**Features:**
- Position and rotation tracking
- Health and ammo management
- Shooting mechanics
- Collision response

##### Enemy (`Enemy.js`)
AI-controlled enemy entities.

**Features:**
- Pathfinding and movement
- Line-of-sight detection
- Combat behavior
- Health system

## API Reference

### Engine Class

```javascript
const engine = new Engine(canvas, {
  targetFPS: 60,
  enablePhysics: true,
  debug: false
});

engine.start();
engine.loadScene('MyScene');
```

### Scene Creation

```javascript
export class MyScene extends Scene {
  async onEnter() {
    // Initialize scene
    this.player = new Player(5, 5);
    this.addEntity(this.player);
  }

  onUpdate(deltaTime) {
    // Update logic
  }

  onRender(renderer) {
    // Render scene
  }
}
```

### Input Handling

```javascript
// Check for actions
if (engine.input.isActionActive('move_forward')) {
  // Move player
}

// Just pressed actions
if (engine.input.isActionJustTriggered('shoot')) {
  // Fire weapon
}
```

## Performance Optimizations

### Memory Management
- Object pooling for frequently created objects
- Efficient array operations
- Minimal DOM manipulation

### Rendering Optimizations
- Reduced ray count (45 instead of 120)
- Canvas buffer reuse
- Minimal redraw operations

### CPU Optimizations
- Fixed time step updates
- Cached calculations
- Efficient algorithms

### Browser-Specific Optimizations
- Touch event optimization with `{ passive: false }`
- Hardware acceleration hints
- Memory-efficient data structures

## Configuration

### Engine Settings

```javascript
const config = {
  targetFPS: 60,        // Target frame rate
  enablePhysics: true,  // Enable physics system
  debug: false,         // Debug mode
  rayCount: 45,         // Raycasting quality
  fov: Math.PI / 2.5    // Field of view
};
```

### Scene Configuration

```javascript
const sceneConfig = {
  width: 240,           // Canvas width
  height: 320,          // Canvas height
  maxDepth: 20,         // View distance
  moveSpeed: 0.2,       // Player speed
  turnSpeed: 0.1        // Turn speed
};
```

## Best Practices

### Performance
1. Keep ray count low on mobile devices
2. Use object pooling for particles/effects
3. Minimize canvas redraws
4. Cache expensive calculations

### Code Organization
1. Separate game logic from rendering
2. Use component-based architecture
3. Keep update loops efficient
4. Use async loading for assets

### Browser Compatibility
1. Test on target devices
2. Use feature detection
3. Provide fallbacks for unsupported features
4. Optimize for touch interfaces

## Troubleshooting

### Common Issues

#### Low Performance
- Reduce ray count
- Disable non-essential features
- Check for memory leaks
- Optimize rendering loops

#### Input Problems
- Verify event listeners are attached
- Check for passive event issues
- Test on actual devices
- Debug input state

#### Rendering Issues
- Check canvas dimensions
- Verify scene loading
- Check for WebGL context issues
- Debug rendering pipeline

## Future Enhancements

### Planned Features
- WebGL renderer for better performance
- Advanced particle effects
- Save/load system
- Multiplayer support (WebRTC)
- Advanced AI pathfinding
- Texture and sprite support

### Optimization Improvements
- Spatial partitioning (quadtree/octree)
- Level-of-detail rendering
- Advanced caching strategies
- WebAssembly integration
