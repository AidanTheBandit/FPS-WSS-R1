/**
 * Doom Demo Scene
 *
 * A complete Doom-like game demo built using the Advanced 3D Game Engine.
 * Demonstrates raycasting, enemy AI, level progression, and physics integration.
 */

import { Scene } from '../core/SceneManager.js';
import { Player } from '../Player.js';
import { Enemy } from '../Enemy.js';
import { LevelManager } from '../Level.js';
import { GAME_CONSTANTS } from '../Constants.js';

export class DoomDemoScene extends Scene {
  constructor(engine) {
    super(engine, 'Doom Demo');
    this.levelManager = new LevelManager();
    this.player = null;
    this.enemies = [];
    this.currentLevel = 1;
    this.gameState = 'playing'; // 'playing', 'levelComplete', 'gameOver'
    this.score = 0;
    this.gameStats = {
      health: GAME_CONSTANTS.PLAYER_START_HEALTH,
      ammo: GAME_CONSTANTS.PLAYER_START_AMMO,
      level: 1,
      enemies: 0,
      score: 0
    };

    // Initialize map data (will be set by loadLevel)
    this.map = [];
  }

  async onEnter(transitionData = {}) {
    console.log('🎮 Starting Doom Demo...');

    // Create player first
    this.player = new Player(8, 5);
    this.addEntity(this.player);

    // Initialize physics world
    this.loadLevel(this.currentLevel);

    // Setup input mappings
    this.setupInputMappings();

    // Setup HUD update callback
    this.engine.gameStateCallback = (stats) => {
      this.gameStats = { ...stats };
    };

    // Set rendering properties
    this.width = 240;
    this.height = 320;
    this.rayCount = 45;
    this.fov = Math.PI / 2.5;
    this.maxDepth = 20;

    console.log('✅ Doom Demo initialized');
  }

  async onExit() {
    console.log('🎮 Exiting Doom Demo...');
    this.cleanup();
  }

  onUpdate(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Update game logic
    this.updateGameLogic(deltaTime);

    // Check win/lose conditions
    this.checkGameConditions();
  }

  onRender(renderer) {
    // The renderer handles the main 3D scene rendering
    // We just need to render HUD and overlays on top
    this.renderHUD(renderer);
    this.renderGameStateOverlays(renderer);
  }

  /**
   * Setup input mappings for the demo
   */
  setupInputMappings() {
    // Movement
    this.engine.input.keyMappings.set('move_forward', ['KeyW', 'ArrowUp']);
    this.engine.input.keyMappings.set('move_backward', ['KeyS', 'ArrowDown']);
    this.engine.input.keyMappings.set('turn_left', ['KeyA', 'ArrowLeft']);
    this.engine.input.keyMappings.set('turn_right', ['KeyD', 'ArrowRight']);
    this.engine.input.keyMappings.set('strafe', ['ShiftLeft']);

    // Actions
    this.engine.input.keyMappings.set('shoot', ['Space']);
    this.engine.input.keyMappings.set('use', ['KeyE']);
  }

  /**
   * Load level data
   */
  loadLevel(levelIndex) {
    const levelData = this.levelManager.getLevel(levelIndex - 1);
    if (!levelData) return;

    // Store map data for renderer
    this.map = levelData.map;

    // Set physics world
    this.engine.physics.setWorld({
      map: levelData.map,
      width: levelData.map[0].length,
      height: levelData.map.length
    });

    // Clear existing enemies
    this.enemies.forEach(enemy => this.removeEntity(enemy));
    this.enemies = [];

    // Spawn enemies
    levelData.enemySpawns.forEach(spawn => {
      const enemy = new Enemy(spawn.x, spawn.y, this);
      this.enemies.push(enemy);
      this.addEntity(enemy);
    });

    this.gameStats.enemies = this.enemies.length;
    this.gameStats.level = levelIndex;

    console.log(`📍 Loaded level: ${levelData.name}`);
  }

  /**
   * Update game logic
   */
  updateGameLogic(deltaTime) {
    if (!this.player) return;

    // Handle player movement
    this.handlePlayerMovement(deltaTime);

    // Handle actions
    if (this.engine.input.isActionJustTriggered('shoot')) {
      this.handleShoot();
    }
    if (this.engine.input.isActionJustTriggered('use')) {
      // Placeholder for use action (e.g., open door, interact)
      console.log('Use action triggered');
    }

    // Check win/lose conditions
    this.checkGameConditions();
  }

  /**
   * Handle player movement
   */
  handlePlayerMovement(deltaTime) {
    if (!this.player) return;

    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED;
    const dt = deltaTime / 16.67;

    // Movement
    if (this.engine.input.isActionActive('move_forward')) {
      const newX = this.player.x + Math.cos(this.player.angle) * moveSpeed * dt;
      const newY = this.player.y + Math.sin(this.player.angle) * moveSpeed * dt;
      if (this.engine.physics.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }

    if (this.engine.input.isActionActive('move_backward')) {
      const newX = this.player.x - Math.cos(this.player.angle) * moveSpeed * dt;
      const newY = this.player.y - Math.sin(this.player.angle) * moveSpeed * dt;
      if (this.engine.physics.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }

    // Turning
    if (this.engine.input.isActionActive('turn_left')) {
      this.player.angle -= turnSpeed * dt;
    }

    if (this.engine.input.isActionActive('turn_right')) {
      this.player.angle += turnSpeed * dt;
    }

    // Strafing
    if (this.engine.input.isActionActive('strafe')) {
      const strafeAngle = this.player.angle + Math.PI / 2;
      const newX = this.player.x + Math.cos(strafeAngle) * moveSpeed * dt;
      const newY = this.player.y + Math.sin(strafeAngle) * moveSpeed * dt;
      if (this.engine.physics.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }
  }

  /**
   * Handle shooting
   */
  handleShoot() {
    if (!this.player || this.player.ammo <= 0 || this.gameState !== 'playing') return;

    this.player.shoot();

    // Create muzzle flash particles
    this.engine.particles.createMuzzleFlash(
      this.player.x + Math.cos(this.player.angle) * 0.5,
      this.player.y + Math.sin(this.player.angle) * 0.5,
      this.player.angle
    );

    // Play shooting sound
    this.engine.audio.playProceduralSound(800, 0.1, 'square', 0.3);

    // Find enemies in shooting range with line of sight
    const visibleEnemies = this.enemies.filter(enemy => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check distance
      if (distance > GAME_CONSTANTS.SHOOT_DISTANCE) return false;

      // Check shooting cone (30 degrees)
      const angleToEnemy = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToEnemy - this.player.angle);
      const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      if (normalizedAngleDiff > Math.PI / 6) return false;

      // Check line of sight
      return this.engine.physics.hasLineOfSight(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
    });

    // Hit closest enemy
    if (visibleEnemies.length > 0) {
      const closestEnemy = visibleEnemies.reduce((closest, enemy) => {
        const distClosest = Math.sqrt(
          (closest.x - this.player.x) ** 2 + (closest.y - this.player.y) ** 2
        );
        const distCurrent = Math.sqrt(
          (enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2
        );
        return distCurrent < distClosest ? enemy : closest;
      });

      closestEnemy.takeDamage(GAME_CONSTANTS.SHOOT_DAMAGE);
      // Create blood particles
      this.engine.particles.createBloodSplatter(closestEnemy.x, closestEnemy.y);
      // Play hit sound
      this.engine.audio.playProceduralSound(200, 0.05, 'sawtooth', 0.2);
    }

    this.gameStats.ammo = this.player.ammo;
  }

  /**
   * Check win/lose conditions
   */
  checkGameConditions() {
    if (!this.player) return;

    // Check if player is dead
    if (this.player.health <= 0) {
      this.gameState = 'gameOver';
      return;
    }

    // Check if level is complete
    if (this.enemies.length === 0 && this.gameState === 'playing') {
      this.nextLevel();
    }
  }

  /**
   * Progress to next level
   */
  nextLevel() {
    if (this.currentLevel < this.levelManager.getTotalLevels()) {
      this.currentLevel++;
      this.gameState = 'levelComplete';

      setTimeout(() => {
        this.gameState = 'playing';
        this.loadLevel(this.currentLevel);
      }, 2000);
    } else {
      this.gameState = 'gameOver'; // Game completed
    }
  }

  /**
   * Render HUD
   */
  renderHUD(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    const fontSize = Math.max(12, renderer.width / 20);
    ctx.font = `${fontSize}px monospace`;
    const lineHeight = fontSize + 5;
    let y = 20;

    // Calculate background height
    const bgHeight = y + lineHeight * 5 + 10;

    // HUD background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, renderer.width, bgHeight);

    // HUD text
    ctx.fillStyle = '#fff';
    ctx.fillText(`Health: ${this.gameStats.health}`, 10, y);
    y += lineHeight;
    ctx.fillText(`Ammo: ${this.gameStats.ammo}`, 10, y);
    y += lineHeight;
    ctx.fillText(`Level: ${this.gameStats.level}`, 10, y);
    y += lineHeight;
    ctx.fillText(`Enemies: ${this.gameStats.enemies}`, 10, y);
    y += lineHeight;
    ctx.fillText(`Score: ${this.gameStats.score}`, 10, y);

    ctx.restore();
  }

  /**
   * Render game state overlays
   */
  renderGameStateOverlays(renderer) {
    const ctx = renderer.ctx;
    ctx.save();

    if (this.gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', renderer.width / 2, renderer.height / 2 - 30);
      ctx.fillText(`Level ${this.currentLevel}`, renderer.width / 2, renderer.height / 2 + 10);
    } else if (this.gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, renderer.width, renderer.height);
      ctx.fillStyle = this.enemies.length === 0 ? '#0f0' : '#f00';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      const message = this.enemies.length === 0 ? 'GAME COMPLETED!' : 'GAME OVER';
      ctx.fillText(message, renderer.width / 2, renderer.height / 2);
    }

    ctx.restore();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.enemies = [];
    this.player = null;
    this.engine.input.cleanup();
  }

  /**
   * Get demo statistics
   */
  getStats() {
    return {
      ...super.getStats(),
      gameState: this.gameState,
      currentLevel: this.currentLevel,
      playerHealth: this.player?.health || 0,
      enemyCount: this.enemies.length,
      score: this.score
    };
  }
}
