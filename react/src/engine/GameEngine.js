import { GAME_CONSTANTS } from './Constants.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { LevelManager } from './Level.js';
import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { GameState } from './GameState.js';
import { NetworkManager } from './NetworkManager.js';

export class GameEngine {
  constructor(canvas, setGameStateCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Initialize dimensions
    this.width = GAME_CONSTANTS.CANVAS_WIDTH;
    this.height = GAME_CONSTANTS.CANVAS_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game properties
    this.fov = GAME_CONSTANTS.FOV;
    this.rayCount = GAME_CONSTANTS.RAY_COUNT;
    this.maxDepth = GAME_CONSTANTS.MAX_DEPTH;
    this.frameInterval = 1000 / GAME_CONSTANTS.TARGET_FPS;

    // Game state
    this.currentLevel = 1;
    this.gameState = 'playing'; // 'menu', 'playing', 'levelComplete', 'gameOver'
    this.score = 0;
    this.strafeMode = false;

    // Initialize components
    this.levelManager = new LevelManager();
    this.gameStateManager = new GameState(setGameStateCallback);
    this.renderer = new Renderer(canvas, this);
    this.inputHandler = new InputHandler(this);
    this.networkManager = new NetworkManager(this);

    // Game objects
    this.enemies = [];
    this.bullets = [];
    this.ammoPickups = new Map(); // Store active ammo pickups

    // Load first level
    this.loadLevel(this.currentLevel);

    // Initialize player in a valid position after map is loaded
    this.player = new Player(1.5, 1.5);

    // Game loop
    this.lastTime = 0;
    this.running = false;
  }

  loadLevel(levelIndex) {
    const levelData = this.levelManager.getLevel(levelIndex - 1);
    this.map = levelData.map;
    this.mapWidth = this.map[0].length;
    this.mapHeight = this.map.length;

    // Spawn enemies
    this.enemies = [];
    levelData.enemySpawns.forEach(spawn => {
      this.enemies.push(new Enemy(spawn.x, spawn.y, this));
    });

    this.gameStateManager.updateEnemies(this.enemies.length);
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.networkManager.connect();
    this.gameLoop(this.lastTime);
  }

  stop() {
    this.running = false;
    this.inputHandler.cleanup();
    this.networkManager.disconnect();
  }

  gameLoop(currentTime) {
    if (!this.running) return;

    const deltaTime = currentTime - this.lastTime;
    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.renderer.render(this.getSceneData());
      this.lastTime = currentTime;
    }
    requestAnimationFrame(time => this.gameLoop(time));
  }

  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Update input
    this.inputHandler.update(deltaTime);

    // Update bullets
    this.updateBullets(deltaTime);

    // Update enemies
    this.enemies.forEach(enemy => enemy.update(deltaTime));

    // Send player position to server
    if (this.networkManager.isConnected()) {
      this.networkManager.sendPlayerMove(this.player.x, this.player.y, this.player.angle);
    }

    // Update game state
    this.gameStateManager.updateHealth(this.player.health);
    this.gameStateManager.updateAmmo(this.player.ammo);
    this.gameStateManager.updateScore(this.score);
  }

  updateBullets(deltaTime) {
    // Update bullet positions and check for collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Update bullet position
      bullet.x += bullet.velocityX * deltaTime / 16.67; // Normalize to ~60fps
      bullet.y += bullet.velocityY * deltaTime / 16.67;

      // Update lifetime
      bullet.lifetime -= deltaTime;

      // Check wall collision
      const mapX = Math.floor(bullet.x);
      const mapY = Math.floor(bullet.y);
      if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight ||
          this.map[mapY][mapX] === 1) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check enemy collision
      for (const enemy of this.enemies) {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.5) { // Bullet hit radius
          enemy.takeDamage(GAME_CONSTANTS.SHOOT_DAMAGE);
          this.bullets.splice(i, 1);
          break;
        }
      }

      // Remove old bullets
      if (bullet.lifetime <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  castRay(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let x = this.player.x;
    let y = this.player.y;

    for (let depth = 0; depth < this.maxDepth; depth += 0.1) {
      const testX = Math.floor(x);
      const testY = Math.floor(y);

      if (testX < 0 || testX >= this.mapWidth ||
          testY < 0 || testY >= this.mapHeight ||
          this.map[testY][testX] === 1) {
        return depth;
      }

      x += cos * 0.1;
      y += sin * 0.1;
    }

    return this.maxDepth;
  }

  isValidPosition(x, y) {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);
    if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
      return false;
    }
    return this.map[mapY][mapX] === 0;
  }

  shoot() {
    if (this.player.shoot() && this.gameState === 'playing') {
      this.renderer.triggerMuzzleFlash();

      // Create bullet for visual feedback
      const bulletSpeed = 1.0; // Units per frame at 60fps
      const bullet = {
        x: this.player.x,
        y: this.player.y,
        velocityX: Math.cos(this.player.angle) * bulletSpeed,
        velocityY: Math.sin(this.player.angle) * bulletSpeed,
        lifetime: 2000, // 2 seconds
        playerId: 'local' // For identification
      };

      this.bullets.push(bullet);

      // Send shoot event to server for multiplayer logic
      if (this.networkManager.isConnected()) {
        this.networkManager.sendPlayerShoot(this.player.angle);
      } else {
        // Single-player mode: handle local shooting
        this.handleLocalShoot();
      }
    }
  }

  handleLocalShoot() {
    // Check for enemy hits with proper line-of-sight
    const shootAngle = this.player.angle;
    const maxShootDistance = GAME_CONSTANTS.SHOOT_DISTANCE;

    // Find all enemies in shooting range and check line of sight
    const visibleEnemies = this.enemies.filter(enemy => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if enemy is within shooting distance
      if (distance > maxShootDistance) return false;

      // Check if enemy is in front (within reasonable angle)
      const angleToEnemy = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToEnemy - shootAngle);
      const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      if (normalizedAngleDiff > Math.PI / 6) return false; // 30 degree cone

      // Check line of sight - cast ray to enemy position
      const rayDistance = this.castRay(angleToEnemy);
      return rayDistance >= distance;
    });

    // Hit the closest visible enemy
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
    }
  }

  nextLevel() {
    if (this.currentLevel < this.levelManager.getTotalLevels()) {
      this.currentLevel++;
      this.gameState = 'levelComplete';
      this.gameStateManager.updateLevel(this.currentLevel);

      setTimeout(() => {
        this.gameState = 'playing';
        this.loadLevel(this.currentLevel);
      }, 2000);
    } else {
      this.gameState = 'gameOver'; // Game completed
    }
  }

  respawn() {
    if (this.gameState === 'gameOver' && this.networkManager.isConnected()) {
      this.networkManager.sendPlayerRespawn();
    } else {
      // Local respawn for single-player fallback
      this.player.health = GAME_CONSTANTS.PLAYER_START_HEALTH;
      this.player.ammo = GAME_CONSTANTS.PLAYER_START_AMMO;

      // Find a valid spawn position
      let spawnX, spawnY;
      let attempts = 0;
      do {
        spawnX = 1.5 + Math.random() * 13;
        spawnY = 1.5 + Math.random() * 9;
        attempts++;
      } while (!this.isValidPosition(spawnX, spawnY) && attempts < 50);

      this.player.x = spawnX;
      this.player.y = spawnY;
      this.gameState = 'playing';
    }
  }

  getSceneData() {
    return {
      player: this.player,
      enemies: this.enemies,
      bullets: this.bullets,
      ammoPickups: Array.from(this.ammoPickups.values()),
      map: this.map,
      rayCount: this.rayCount,
      fov: this.fov,
      maxDepth: this.maxDepth,
      width: this.width,
      height: this.height,
      currentLevel: this.currentLevel,
      gameState: this.gameState
    };
  }
}
