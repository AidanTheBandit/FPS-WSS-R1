export class GameState {
  constructor(setGameStateCallback) {
    this.setGameStateCallback = setGameStateCallback;
    this.state = {
      health: 100,
      ammo: 50,
      level: 1,
      enemies: 0,
      score: 0
    };
  }

  updateHealth(health) {
    this.state.health = health;
    this.notifyUpdate();
  }

  updateAmmo(ammo) {
    this.state.ammo = ammo;
    this.notifyUpdate();
  }

  updateLevel(level) {
    this.state.level = level;
    this.notifyUpdate();
  }

  updateEnemies(count) {
    this.state.enemies = count;
    this.notifyUpdate();
  }

  updateScore(score) {
    this.state.score = score;
    this.notifyUpdate();
  }

  getState() {
    return { ...this.state };
  }

  notifyUpdate() {
    if (this.setGameStateCallback) {
      this.setGameStateCallback(this.getState());
    }
  }
}
