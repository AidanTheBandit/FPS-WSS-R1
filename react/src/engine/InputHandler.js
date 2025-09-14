import { GAME_CONSTANTS } from './Constants.js';

export class InputHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      ' ': false, // space for shoot
      Shift: false // shift for strafe
    };

    this.touchState = {
      moveForward: false,
      moveBackward: false,
      turnLeft: false,
      turnRight: false,
      strafe: false
    };

    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      if (this.keys.hasOwnProperty(event.key)) {
        this.keys[event.key] = true;
        event.preventDefault();
      }
    });

    document.addEventListener('keyup', (event) => {
      if (this.keys.hasOwnProperty(event.key)) {
        this.keys[event.key] = false;
        event.preventDefault();
      }
    });
  }

  setupTouchListeners() {
    // Touch listeners will be handled by the React component
    // This is a placeholder for future touch implementation
  }

  update(deltaTime) {
    // Handle keyboard input
    this.handleKeyboardInput(deltaTime);
  }

  handleKeyboardInput(deltaTime) {
    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED;

    // Movement - W/S for forward/backward relative to facing direction
    if (this.keys.w || this.keys.ArrowUp) {
      this.movePlayerRelative(0, -moveSpeed); // Forward
    }
    if (this.keys.s || this.keys.ArrowDown) {
      this.movePlayerRelative(0, moveSpeed); // Backward
    }

    // Strafing - A/D for left/right relative to facing direction
    if (this.keys.a || this.keys.ArrowLeft) {
      this.movePlayerRelative(-moveSpeed, 0); // Strafe left
    }
    if (this.keys.d || this.keys.ArrowRight) {
      this.movePlayerRelative(moveSpeed, 0); // Strafe right
    }

    // Shooting - Spacebar
    if (this.keys[' ']) {
      this.gameEngine.shoot();
    }
  }

  movePlayerRelative(dx, dy) {
    // Convert relative movement to world coordinates based on player angle
    const angle = this.gameEngine.player.angle;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Rotate the movement vector by the player's angle
    const worldDx = dx * cos - dy * sin;
    const worldDy = dx * sin + dy * cos;

    const newX = this.gameEngine.player.x + worldDx;
    const newY = this.gameEngine.player.y + worldDy;

    if (this.gameEngine.isValidPosition(newX, newY)) {
      this.gameEngine.player.x = newX;
      this.gameEngine.player.y = newY;
    }
  }

  // Methods for touch controls
  startMoving(direction) {
    switch (direction) {
      case 'forward':
        this.touchState.moveForward = true;
        break;
      case 'backward':
        this.touchState.moveBackward = true;
        break;
      case 'strafe':
        this.touchState.strafe = true;
        break;
    }
  }

  stopMoving(direction) {
    switch (direction) {
      case 'forward':
        this.touchState.moveForward = false;
        break;
      case 'backward':
        this.touchState.moveBackward = false;
        break;
      case 'strafe':
        this.touchState.strafe = false;
        break;
    }
  }

  startTurning(direction) {
    switch (direction) {
      case 'left':
        this.touchState.turnLeft = true;
        break;
      case 'right':
        this.touchState.turnRight = true;
        break;
    }
  }

  stopTurning(direction) {
    switch (direction) {
      case 'left':
        this.touchState.turnLeft = false;
        break;
      case 'right':
        this.touchState.turnRight = false;
        break;
    }
  }

  cleanup() {
    // Remove event listeners if needed
    // For now, we keep them as they're document-level
  }
}
