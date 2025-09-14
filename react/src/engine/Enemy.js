import { GAME_CONSTANTS } from './Constants.js';

export class Enemy {
  constructor(x, y, scene) {
    this.x = x;
    this.y = y;
    this.scene = scene;
    this.health = GAME_CONSTANTS.ENEMY_HEALTH;
    this.speed = GAME_CONSTANTS.ENEMY_SPEED;
    this.angle = Math.random() * Math.PI * 2;
    this.state = 'idle'; // 'idle', 'chasing', 'attacking'
    this.lastAttack = 0;
    this.attackCooldown = GAME_CONSTANTS.ENEMY_ATTACK_COOLDOWN;
    this.size = GAME_CONSTANTS.ENEMY_SIZE;
  }

  // Scene system methods
  onAddedToScene() {
    // Called when entity is added to scene
  }

  onRemovedFromScene() {
    // Called when entity is removed from scene
  }

  update(deltaTime) {
    if (!this.scene || !this.scene.player || !this.scene.engine) return;

    const dx = this.scene.player.x - this.x;
    const dy = this.scene.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Line of sight check
    if (this.hasLineOfSight()) {
      this.state = 'chasing';
      // Move towards player
      if (distance > 1) {
        const moveAngle = Math.atan2(dy, dx);
        const newX = this.x + Math.cos(moveAngle) * this.speed * (deltaTime / 16.67);
        const newY = this.y + Math.sin(moveAngle) * this.speed * (deltaTime / 16.67);

        if (this.scene.engine.physics.isValidPosition(newX, newY)) {
          this.x = newX;
          this.y = newY;
        }
      } else {
        // Attack player
        this.state = 'attacking';
        if (Date.now() - this.lastAttack > this.attackCooldown) {
          this.attackPlayer();
          this.lastAttack = Date.now();
        }
      }
    } else {
      this.state = 'idle';
      // Random movement when not chasing
      this.angle += (Math.random() - 0.5) * 0.1;
      const newX = this.x + Math.cos(this.angle) * this.speed * 0.5 * (deltaTime / 16.67);
      const newY = this.y + Math.sin(this.angle) * this.speed * 0.5 * (deltaTime / 16.67);

      if (this.scene.engine.physics.isValidPosition(newX, newY)) {
        this.x = newX;
        this.y = newY;
      }
    }
  }

  hasLineOfSight() {
    if (!this.scene || !this.scene.player) return false;

    const dx = this.scene.player.x - this.x;
    const dy = this.scene.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Cast ray from enemy to player to check for walls
    const angle = Math.atan2(dy, dx);
    const rayDistance = this.scene.engine.physics.castRay(this.x, this.y, angle, distance + 1);

    return rayDistance >= distance;
  }

  attackPlayer() {
    if (!this.scene || !this.scene.player) return;

    // Deal damage to player
    this.scene.player.takeDamage(GAME_CONSTANTS.ENEMY_ATTACK_DAMAGE);
    if (!this.scene.player.isAlive()) {
      this.scene.gameState = 'gameOver';
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      // Enemy dies
      if (this.scene) {
        this.scene.enemies = this.scene.enemies.filter(e => e !== this);
        this.scene.score += GAME_CONSTANTS.SCORE_PER_ENEMY;
        this.scene.player.ammo = Math.min(this.scene.player.ammo + GAME_CONSTANTS.AMMO_DROP, GAME_CONSTANTS.MAX_AMMO); // Drop ammo

        // Check if level is complete
        if (this.scene.enemies.length === 0) {
          this.scene.nextLevel();
        }
      }
    }
  }

  render(renderer) {
    // This method is no longer used since rendering is handled by the Renderer
    // But keeping it for compatibility
  }
}
