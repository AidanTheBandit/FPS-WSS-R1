import { GAME_CONSTANTS } from './Constants.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.health = GAME_CONSTANTS.PLAYER_START_HEALTH;
    this.ammo = GAME_CONSTANTS.PLAYER_START_AMMO;
    this.invincible = false;
    this.invincibleTimer = 0;
  }

  // Scene system methods
  onAddedToScene() {
    // Called when entity is added to scene
  }

  onRemovedFromScene() {
    // Called when entity is removed from scene
  }

  update(deltaTime) {
    // Player update logic is handled in the scene
    // Handle invincibility timer
    if (this.invincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleTimer = 0;
      }
    }
  }

  move(dx, dy, scene) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    if (scene && scene.engine && scene.engine.physics.isValidPosition(newX, newY)) {
      this.x = newX;
      this.y = newY;
      return true;
    }
    return false;
  }

  rotate(deltaAngle) {
    this.angle += deltaAngle;
  }

  takeDamage(damage) {
    if (this.invincible) return; // No damage while invincible

    this.health -= damage;
    if (this.health < 0) this.health = 0;
  }

  shoot() {
    if (this.ammo > 0) {
      this.ammo--;
      return true;
    }
    return false;
  }

  isAlive() {
    return this.health > 0;
  }

  render(renderer) {
    // Player rendering is handled by the scene
  }
}
