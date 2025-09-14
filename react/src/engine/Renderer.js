import { GAME_CONSTANTS } from './Constants.js';

export class Renderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;
    this.muzzleFlash = 0;

    // Canvas dimensions (will be set by scene)
    this.width = canvas.width || 240;
    this.height = canvas.height || 320;
  }

  render(scene) {
    if (!scene) return;

    // Set canvas dimensions from scene if available
    if (scene.width && scene.height) {
      this.width = scene.width;
      this.height = scene.height;
      this.canvas.width = scene.width;
      this.canvas.height = scene.height;
    }

    this.clearCanvas();
    this.renderBackground();
    this.renderScene(scene);
    this.renderMuzzleFlash();
    this.renderGameStateOverlays(scene);
    this.renderCrosshair();
  }

  clearCanvas() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderBackground() {
    // Sky
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height / 2);

    // Ground
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
  }

  renderScene(scene) {
    // Get game data from scene
    const { player, enemies, map, rayCount, fov, maxDepth } = scene;

    if (!player || !map || !Array.isArray(map) || map.length === 0) return;

    // Collect all renderable objects with their distances
    const renderQueue = [];

    // Add walls to render queue
    for (let x = 0; x < rayCount; x++) {
      const rayAngle = player.angle - fov / 2 + (x / rayCount) * fov;
      const distance = this.castRay(player.x, player.y, rayAngle, map, maxDepth);

      renderQueue.push({
        type: 'wall',
        x: x,
        distance: distance,
        rayAngle: rayAngle
      });
    }

    // Add enemies to render queue
    if (enemies && Array.isArray(enemies)) {
      enemies.forEach((enemy, index) => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle relative to player
        const angle = Math.atan2(dy, dx) - player.angle;

        // Normalize angle to -PI to PI
        let normalizedAngle = angle;
        while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
        while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

        // Check if enemy is in field of view
        if (Math.abs(normalizedAngle) < fov / 2) {
          // Check line of sight (not behind walls)
          const rayDistance = this.castRay(player.x, player.y, Math.atan2(dy, dx), map, maxDepth);
          if (rayDistance >= distance) {
            renderQueue.push({
              type: 'enemy',
              enemy: enemy,
              distance: distance,
              angle: normalizedAngle,
              index: index
            });
          }
        }
      });
    }

    // Sort by distance (closest first for proper depth - render far to near)
    renderQueue.sort((a, b) => b.distance - a.distance);

    // Render in depth order
    renderQueue.forEach(item => {
      if (item.type === 'wall') {
        this.renderWallColumn(item.x, item.distance, item.rayAngle, rayCount, maxDepth);
      } else if (item.type === 'enemy') {
        this.renderEnemySprite(item.enemy, item.distance, item.angle, fov);
      }
    });
  }

  renderWallColumn(x, distance, rayAngle, rayCount, maxDepth) {
    const wallHeight = (this.height / 2) / distance;
    const wallTop = (this.height / 2) - wallHeight;
    const wallBottom = (this.height / 2) + wallHeight;
    const shade = 0.7 + 0.3 * (1 - distance / maxDepth);
    const color = Math.floor(255 * shade);

    this.ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.8)}, ${Math.floor(color * 0.5)})`;
    this.ctx.fillRect(
      (x / rayCount) * this.width,
      wallTop,
      this.width / rayCount + 1,
      wallBottom - wallTop
    );
  }

  renderEnemySprite(enemy, distance, angle, fov) {
    if (!enemy || typeof enemy.health === 'undefined' || typeof enemy.state === 'undefined') return;

    // Calculate screen position
    const screenX = (angle / (fov / 2)) * (this.width / 2) + this.width / 2;
    const wallHeight = (this.height / 2) / distance;
    const enemyHeight = wallHeight * (enemy.size || 0.5);
    const enemyTop = (this.height / 2) - enemyHeight / 2;
    const enemyBottom = (this.height / 2) + enemyHeight / 2;

    // Draw enemy sprite
    const color = enemy.state === 'chasing' ? GAME_CONSTANTS.ENEMY_COLOR_CHASING : GAME_CONSTANTS.ENEMY_COLOR_IDLE;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      screenX - enemyHeight / 4,
      enemyTop,
      enemyHeight / 2,
      enemyHeight
    );

    // Draw health bar
    const barWidth = enemyHeight / 2;
    const barHeight = 4;
    const healthPercent = enemy.health / GAME_CONSTANTS.ENEMY_HEALTH;

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth, barHeight);

    this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
    this.ctx.fillRect(screenX - barWidth / 2, enemyTop - 8, barWidth * healthPercent, barHeight);
  }

  castRay(originX, originY, angle, map, maxDepth) {
    if (!map || !Array.isArray(map) || map.length === 0 || !Array.isArray(map[0])) {
      return maxDepth;
    }

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let x = originX;
    let y = originY;
    const mapWidth = map[0].length;
    const mapHeight = map.length;

    for (let depth = 0; depth < maxDepth; depth += 0.1) {
      const testX = Math.floor(x);
      const testY = Math.floor(y);

      if (testX < 0 || testX >= mapWidth ||
          testY < 0 || testY >= mapHeight ||
          map[testY][testX] === 1) {
        return depth;
      }

      x += cos * 0.1;
      y += sin * 0.1;
    }

    return maxDepth;
  }

  renderGameStateOverlays(scene) {
    if (scene.gameState === 'levelComplete') {
      this.renderLevelComplete(scene);
    } else if (scene.gameState === 'gameOver') {
      this.renderGameOver(scene);
    }
  }

  renderLevelComplete(scene) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('LEVEL COMPLETE!', this.width / 2, this.height / 2 - 20);
    this.ctx.fillText(`Level ${scene.currentLevel}`, this.width / 2, this.height / 2 + 20);
  }

  renderGameOver(scene) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = (scene.enemies && Array.isArray(scene.enemies) && scene.enemies.length === 0) ? '#0f0' : '#f00';
    this.ctx.font = '20px monospace';
    this.ctx.textAlign = 'center';
    const message = (scene.enemies && Array.isArray(scene.enemies) && scene.enemies.length === 0) ? 'GAME COMPLETED!' : 'GAME OVER';
    this.ctx.fillText(message, this.width / 2, this.height / 2);
  }

  renderCrosshair() {
    this.ctx.strokeStyle = GAME_CONSTANTS.CROSSHAIR_COLOR;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2 - 10, this.height / 2);
    this.ctx.lineTo(this.width / 2 + 10, this.height / 2);
    this.ctx.moveTo(this.width / 2, this.height / 2 - 10);
    this.ctx.lineTo(this.width / 2, this.height / 2 + 10);
    this.ctx.stroke();
  }

  renderMuzzleFlash() {
    if (this.muzzleFlash > 0) {
      // Render muzzle flash as a white overlay fading out
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.muzzleFlash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.muzzleFlash -= 0.05; // Fade out over time
    }
  }

  triggerMuzzleFlash() {
    this.muzzleFlash = 0.5;
  }
}
