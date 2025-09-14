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
    this.initializePlayer();

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

  validatePlayerPosition() {
    // Check if player position is valid
    if (!this.isValidPosition(this.player.x, this.player.y)) {
      console.warn('Player in invalid position, attempting to fix:', this.player.x, this.player.y);

      // Try to find a nearby valid position
      const searchRadius = 2;
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          const testX = this.player.x + dx * 0.5;
          const testY = this.player.y + dy * 0.5;

          if (this.isValidPosition(testX, testY)) {
            console.log('Moving player to valid position:', testX, testY);
            this.player.x = testX;
            this.player.y = testY;
            return;
          }
        }
      }

      // If no valid position found, reset to a safe default
      console.error('No valid position found, resetting player position');
      this.player.x = 2;
      this.player.y = 2;
    }

    // Validate player properties
    if (!isFinite(this.player.x) || !isFinite(this.player.y)) {
      console.error('Player position is NaN, resetting');
      this.player.x = 2;
      this.player.y = 2;
    }

    if (!isFinite(this.player.angle)) {
      console.error('Player angle is NaN, resetting');
      this.player.angle = 0;
    }
  }

  initializePlayer() {
    // Find a safe initial spawn position
    let spawnX, spawnY;
    let attempts = 0;
    const minDistanceFromEnemies = 3.0;

    do {
      spawnX = 1.5 + Math.random() * 13;
      spawnY = 1.5 + Math.random() * 9;
      attempts++;

      // Check if position is valid and far enough from enemies
      if (this.isValidPosition(spawnX, spawnY)) {
        let tooCloseToEnemy = false;
        for (const enemy of this.enemies) {
          const dx = spawnX - enemy.x;
          const dy = spawnY - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistanceFromEnemies) {
            tooCloseToEnemy = true;
            break;
          }
        }
        if (!tooCloseToEnemy) {
          break; // Found a good spawn position
        }
      }
    } while (attempts < 100);

    // Fallback to basic valid position if needed
    if (attempts >= 100) {
      spawnX = 1.5;
      spawnY = 1.5;
      if (!this.isValidPosition(spawnX, spawnY)) {
        // Find any valid position
        for (let y = 1; y < this.mapHeight - 1; y++) {
          for (let x = 1; x < this.mapWidth - 1; x++) {
            if (this.map[y][x] === 0) {
              spawnX = x + 0.5;
              spawnY = y + 0.5;
              break;
            }
          }
          if (spawnX !== 1.5 || spawnY !== 1.5) break;
        }
      }
    }

    this.player = new Player(spawnX, spawnY);

    // Add temporary invincibility for initial spawn
    this.player.invincible = true;
    this.player.invincibleTimer = 4000; // 4 seconds for initial spawn (longer than respawn)

    console.log(`Player initialized at (${spawnX.toFixed(2)}, ${spawnY.toFixed(2)}) with ${this.player.invincibleTimer}ms invincibility`);
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

    // Validate player position before updating
    this.validatePlayerPosition();

    // Update input
    this.inputHandler.update(deltaTime);

    // Update player (for invincibility timer, etc.)
    this.player.update(deltaTime);

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

    // Check if player is dead and set game over state
    if (this.player.health <= 0 && this.gameState === 'playing') {
      console.log('Player died! Health:', this.player.health);
      this.gameState = 'gameOver';
      // Force update the game state to show respawn button
      this.gameStateManager.updateHealth(this.player.health);
    }
  }

  updateBullets(deltaTime) {
    // Update bullet positions and check for collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Store previous position for trail
      const prevX = bullet.x;
      const prevY = bullet.y;

      // Calculate new position with physics
      const timeStep = deltaTime / 16.67; // Normalize to ~60fps

      // Apply gravity to vertical velocity
      bullet.velocityY += bullet.gravity * timeStep;

      // Apply air resistance
      bullet.velocityX *= bullet.airResistance;
      bullet.velocityY *= bullet.airResistance;

      // Calculate movement vector
      const moveX = bullet.velocityX * timeStep;
      const moveY = bullet.velocityY * timeStep;

      // Check for wall collision along the movement path
      const steps = Math.max(1, Math.ceil(Math.sqrt(moveX * moveX + moveY * moveY) * 10)); // Subdivide movement for accurate collision
      let hitWall = false;
      let finalX = bullet.x;
      let finalY = bullet.y;

      for (let step = 1; step <= steps; step++) {
        const testX = bullet.x + (moveX * step / steps);
        const testY = bullet.y + (moveY * step / steps);

        const mapX = Math.floor(testX);
        const mapY = Math.floor(testY);

        if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight ||
            this.map[mapY][mapX] === 1) {
          hitWall = true;
          break;
        }

        finalX = testX;
        finalY = testY;
      }

      if (hitWall) {
        // Bullet hit a wall, remove it
        this.bullets.splice(i, 1);
        continue;
      }

      // Update bullet position
      bullet.x = finalX;
      bullet.y = finalY;

      // Update distance traveled
      const distanceThisFrame = Math.sqrt(moveX * moveX + moveY * moveY);
      bullet.distanceTraveled += distanceThisFrame;

      // Add to trail for visual effect (keep last 5 positions)
      if (!bullet.trail) {
        bullet.trail = [];
      }
      bullet.trail.push({ x: prevX, y: prevY });
      if (bullet.trail.length > 5) {
        bullet.trail.shift();
      }

      // Check enemy collision
      for (const enemy of this.enemies) {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.8) { // Increased bullet hit radius
          enemy.takeDamage(GAME_CONSTANTS.SHOOT_DAMAGE);
          this.bullets.splice(i, 1);
          break;
        }
      }

      // Remove bullets that have traveled too far
      if (bullet.distanceTraveled >= bullet.maxDistance) {
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

    // Check bounds
    if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
      return false;
    }

    // Check if the tile is walkable
    if (this.map[mapY][mapX] !== 0) {
      return false;
    }

    // Additional check: ensure we're not too close to walls (prevent getting stuck)
    const playerRadius = 0.3; // Player collision radius
    const checkPoints = [
      [x, y], // Center
      [x + playerRadius, y], // Right
      [x - playerRadius, y], // Left
      [x, y + playerRadius], // Down
      [x, y - playerRadius], // Up
      [x + playerRadius * 0.7, y + playerRadius * 0.7], // Diagonal
      [x - playerRadius * 0.7, y + playerRadius * 0.7], // Diagonal
      [x + playerRadius * 0.7, y - playerRadius * 0.7], // Diagonal
      [x - playerRadius * 0.7, y - playerRadius * 0.7]  // Diagonal
    ];

    for (const [checkX, checkY] of checkPoints) {
      const checkMapX = Math.floor(checkX);
      const checkMapY = Math.floor(checkY);

      if (checkMapX < 0 || checkMapX >= this.mapWidth ||
          checkMapY < 0 || checkMapY >= this.mapHeight ||
          this.map[checkMapY][checkMapX] !== 0) {
        return false;
      }
    }

    return true;
  }

  shoot() {
    if (this.player.shoot() && this.gameState === 'playing') {
      this.renderer.triggerMuzzleFlash();

      // Add bullet spread (inaccuracy)
      const spread = GAME_CONSTANTS.BULLET_SPREAD;
      const actualAngle = this.player.angle + (Math.random() - 0.5) * spread;

      // Create bullet with improved physics
      const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED;
      const bullet = {
        x: this.player.x,
        y: this.player.y,
        velocityX: Math.cos(actualAngle) * bulletSpeed,
        velocityY: Math.sin(actualAngle) * bulletSpeed,
        gravity: GAME_CONSTANTS.BULLET_GRAVITY,
        airResistance: GAME_CONSTANTS.BULLET_AIR_RESISTANCE,
        maxDistance: GAME_CONSTANTS.BULLET_LIFETIME_DISTANCE,
        distanceTraveled: 0,
        playerId: 'local',
        trail: [] // Store trail positions for visual effect
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
    // Always allow respawn if player is dead (health <= 0) or game is over
    if (this.gameState === 'gameOver' && this.networkManager.isConnected()) {
      this.networkManager.sendPlayerRespawn();
    } else {
      // Local respawn for single-player or when not connected
      console.log('Respawning player...');

      // Reset player stats
      this.player.health = GAME_CONSTANTS.PLAYER_START_HEALTH;
      this.player.ammo = GAME_CONSTANTS.PLAYER_START_AMMO;

      // Find a valid spawn position away from enemies
      let spawnX, spawnY;
      let attempts = 0;
      const minDistanceFromEnemies = 4.0; // Increased minimum distance from enemies

      do {
        spawnX = 1.5 + Math.random() * 13;
        spawnY = 1.5 + Math.random() * 9;
        attempts++;

        // Check if position is valid and far enough from enemies
        if (this.isValidPosition(spawnX, spawnY)) {
          let tooCloseToEnemy = false;
          for (const enemy of this.enemies) {
            const dx = spawnX - enemy.x;
            const dy = spawnY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistanceFromEnemies) {
              tooCloseToEnemy = true;
              break;
            }
          }
          if (!tooCloseToEnemy) {
            break; // Found a good spawn position
          }
        }
      } while (attempts < 100); // Increased attempts for better spawn finding

      // If we couldn't find a good position, use the basic valid position check
      if (attempts >= 100) {
        console.warn('Could not find safe spawn position, using fallback');
        attempts = 0;
        do {
          spawnX = 1.5 + Math.random() * 13;
          spawnY = 1.5 + Math.random() * 9;
          attempts++;
        } while (!this.isValidPosition(spawnX, spawnY) && attempts < 50);
      }

      // Ensure we have valid coordinates
      if (!isFinite(spawnX) || !isFinite(spawnY)) {
        console.error('Invalid spawn coordinates, using default');
        spawnX = 2;
        spawnY = 2;
      }

      this.player.x = spawnX;
      this.player.y = spawnY;
      this.gameState = 'playing';

      // Add temporary invincibility after respawn
      this.player.invincible = true;
      this.player.invincibleTimer = 3000; // 3 seconds of invincibility

      console.log(`Player respawned at (${spawnX.toFixed(2)}, ${spawnY.toFixed(2)}) with ${this.player.invincibleTimer}ms invincibility`);

      // Update game state immediately and force a render
      this.gameStateManager.updateHealth(this.player.health);
      this.gameStateManager.updateAmmo(this.player.ammo);
      this.gameStateManager.updateLevel(this.currentLevel);

      // Ensure input handler is ready
      if (this.inputHandler) {
        console.log('Input handler is active after respawn');
        // Reset joystick state to prevent stuck inputs
        this.inputHandler.setJoystickState(false, 0, 0);
      }
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
