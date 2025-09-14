/**
 * Advanced 3D Game Engine Core
 *
 * This is the main engine class that manages all core systems:
 * - Rendering System
 * - Physics System
 * - Input System
 * - Scene Management
 * - Asset Management
 * - Audio System (future)
 *
 * The engine provides a component-based architecture for building 3D games.
 */

import { GAME_CONSTANTS } from '../Constants.js';
import { Renderer } from '../Renderer.js';
import { PhysicsSystem } from './PhysicsSystem.js';
import { InputSystem } from './InputSystem.js';
import { SceneManager } from './SceneManager.js';
import { AssetManager } from './AssetManager.js';
import { AudioSystem } from './AudioSystem.js';
import { ParticleSystem } from './ParticleSystem.js';

export class Engine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      targetFPS: GAME_CONSTANTS.TARGET_FPS,
      enablePhysics: true,
      enableAudio: false,
      debug: false,
      ...config
    };

    // Core systems
    this.renderer = new Renderer(canvas, this);
    this.physics = new PhysicsSystem(this);
    this.input = new InputSystem(this);
    this.sceneManager = new SceneManager(this);
    this.assetManager = new AssetManager(this);
    this.audio = new AudioSystem(this);
    this.particles = new ParticleSystem(this);

    // Engine state
    this.isRunning = false;
    this.lastTime = 0;
    this.frameInterval = 1000 / this.config.targetFPS;
    this.deltaTime = 0;

    // Performance monitoring
    this.frameCount = 0;
    this.fps = 0;
    this.lastFPSUpdate = 0;

    console.log('🚀 Advanced 3D Game Engine initialized');
  }

  /**
   * Start the engine
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);

    console.log('▶️ Engine started');
  }

  /**
   * Stop the engine
   */
  stop() {
    this.isRunning = false;
    this.input.cleanup();
    this.audio.cleanup();
    console.log('⏹️ Engine stopped');
  }

  /**
   * Main game loop
   */
  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= this.frameInterval) {
      this.deltaTime = deltaTime;
      this.update(deltaTime);
      this.render();
      this.lastTime = currentTime;

      // Update FPS counter
      this.frameCount++;
      if (currentTime - this.lastFPSUpdate >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSUpdate));
        this.frameCount = 0;
        this.lastFPSUpdate = currentTime;
      }
    }

    requestAnimationFrame(time => this.gameLoop(time));
  }

  /**
   * Update all systems
   */
  update(deltaTime) {
    // Update input system
    this.input.update(deltaTime);

    // Update physics system
    if (this.config.enablePhysics) {
      this.physics.update(deltaTime);
    }

    // Update particle system
    this.particles.update(deltaTime);

    // Update current scene
    if (this.sceneManager.currentScene) {
      this.sceneManager.currentScene.update(deltaTime);
    }

    // Update asset manager (for streaming, etc.)
    this.assetManager.update(deltaTime);
  }

  /**
   * Render the current scene
   */
  render() {
    if (this.sceneManager.currentScene) {
      // First render the 3D scene
      this.renderer.render(this.sceneManager.currentScene);

      // Render particles
      this.particles.render(this.renderer.ctx);

      // Then let the scene render its overlays/HUD
      this.sceneManager.currentScene.render(this.renderer);
    }

    // Render debug info if enabled
    if (this.config.debug) {
      this.renderDebugInfo();
    }
  }

  /**
   * Render debug information
   */
  renderDebugInfo() {
    const ctx = this.canvas.getContext('2d');
    ctx.save();

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    ctx.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 10, 35);
    ctx.fillText(`Scene: ${this.sceneManager.currentScene?.name || 'None'}`, 10, 50);

    ctx.restore();
  }

  /**
   * Load a scene by name
   */
  loadScene(sceneName) {
    return this.sceneManager.loadScene(sceneName);
  }

  /**
   * Get the current scene
   */
  getCurrentScene() {
    return this.sceneManager.currentScene;
  }

  /**
   * Add a system to the engine
   */
  addSystem(system) {
    if (system.init) {
      system.init(this);
    }
    // Store system for management
    this[system.constructor.name.toLowerCase()] = system;
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      fps: this.fps,
      deltaTime: this.deltaTime,
      isRunning: this.isRunning,
      currentScene: this.sceneManager.currentScene?.name,
      physicsEnabled: this.config.enablePhysics,
      debugEnabled: this.config.debug,
      audioEnabled: this.audio.enabled,
      particleCount: this.particles.getParticleCount()
    };
  }

  /**
   * Set engine configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.targetFPS) {
      this.frameInterval = 1000 / this.config.targetFPS;
    }
  }
}
