import { GAME_CONSTANTS } from './Constants.js';

export class InputHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      q: false,
      e: false,
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

    this.joystickState = {
      active: false,
      x: 0, // -1 to 1
      y: 0  // -1 to 1
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
    // Validate delta time
    if (!isFinite(deltaTime) || deltaTime <= 0) {
      console.warn('Invalid delta time:', deltaTime);
      return;
    }

    // Handle keyboard input
    this.handleKeyboardInput(deltaTime);

    // Handle joystick input
    this.handleJoystickInput(deltaTime);
  }  handleKeyboardInput(deltaTime) {
    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED;

    // Use actual delta time but clamp it to prevent large jumps
    const dt = Math.min(deltaTime / 16.67, 2.0); // Cap at 2x normal speed to prevent large jumps

    // Movement - W/S for forward/backward relative to facing direction
    if (this.keys.w || this.keys.ArrowUp) {
      this.movePlayerRelative(0, moveSpeed * dt);
    }
    if (this.keys.s || this.keys.ArrowDown) {
      this.movePlayerRelative(0, -moveSpeed * dt);
    }

    // Camera turning - A/D for left/right camera rotation
    if (this.keys.a || this.keys.ArrowLeft) {
      this.gameEngine.player.rotate(-turnSpeed * dt);
    }
    if (this.keys.d || this.keys.ArrowRight) {
      this.gameEngine.player.rotate(turnSpeed * dt);
    }

    // Strafing - Q/E for left/right movement (removed - strafe button removed)
    // if (this.keys.q) {
    //   this.movePlayerRelative(-moveSpeed * dt, 0);
    // }
    // if (this.keys.e) {
    //   this.movePlayerRelative(moveSpeed * dt, 0);
    // }

    // Shooting - Spacebar (only trigger once per press)
    if (this.keys[' ']) {
      this.gameEngine.shoot();
      // Prevent continuous shooting by temporarily disabling
      this.keys[' '] = false;
    }
  }

  handleJoystickInput(deltaTime) {
    // Don't clear keyboard keys when joystick is active - let both work together
    // Only override movement keys if joystick has significant input
    const { x, y } = this.joystickState;
    const deadzone = 0.15;
    const sensitivity = 0.3;
    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED * sensitivity;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED * sensitivity;

    // Apply exponential scaling for better control at low speeds
    const applySensitivity = (value) => {
      const absValue = Math.abs(value);
      if (absValue < deadzone) return 0;
      const normalizedValue = (absValue - deadzone) / (1 - deadzone);
      const scaledValue = Math.pow(normalizedValue, 1.5) * Math.sign(value);
      return Math.max(-1, Math.min(1, scaledValue));
    };

    const scaledX = applySensitivity(x);
    const scaledY = applySensitivity(y);

    // Only apply joystick movement if it has significant input
    if (this.joystickState.active && (Math.abs(scaledX) > 0.01 || Math.abs(scaledY) > 0.01)) {
      // Override keyboard movement keys when joystick is providing input
      this.keys.w = false;
      this.keys.s = false;
      this.keys.a = false;
      this.keys.d = false;
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = false;

      // Use actual delta time but clamp it to prevent large jumps
      const dt = Math.min(deltaTime / 16.67, 2.0);

      // Apply joystick movement
      if (Math.abs(scaledY) > 0.01) {
        if (scaledY > 0) {
          this.movePlayerRelative(0, moveSpeed * dt * Math.abs(scaledY));
        } else {
          this.movePlayerRelative(0, -moveSpeed * dt * Math.abs(scaledY));
        }
      }

      if (Math.abs(scaledX) > 0.01) {
        // Always use turn mode for joystick (strafe mode removed)
        if (scaledX < 0) {
          this.gameEngine.player.rotate(-turnSpeed * dt * Math.abs(scaledX));
        } else {
          this.gameEngine.player.rotate(turnSpeed * dt * Math.abs(scaledX));
        }
      }
    }
  }

  movePlayerRelative(dx, dy) {
    // Validate input parameters
    if (!isFinite(dx) || !isFinite(dy)) {
      console.warn('Invalid movement parameters:', dx, dy);
      return;
    }

    // Convert relative movement to world coordinates based on player angle
    const angle = this.gameEngine.player.angle;

    // Validate player angle
    if (!isFinite(angle)) {
      console.warn('Invalid player angle:', angle);
      return;
    }

    // dx is strafe left/right, dy is forward/backward
    // Forward (dy > 0): move in direction of angle
    // Strafe right (dx > 0): move perpendicular to angle (angle + π/2)
    // Strafe left (dx < 0): move perpendicular to angle (angle - π/2)

    const worldDx = dy * Math.cos(angle) + dx * Math.sin(angle);
    const worldDy = dy * Math.sin(angle) - dx * Math.cos(angle);

    // Validate world movement
    if (!isFinite(worldDx) || !isFinite(worldDy)) {
      console.warn('Invalid world movement:', worldDx, worldDy);
      return;
    }

    const newX = this.gameEngine.player.x + worldDx;
    const newY = this.gameEngine.player.y + worldDy;

    // Validate new position
    if (!isFinite(newX) || !isFinite(newY)) {
      console.warn('Invalid new position:', newX, newY);
      return;
    }

    // Try to move to the new position
    if (this.gameEngine.isValidPosition(newX, newY)) {
      this.gameEngine.player.x = newX;
      this.gameEngine.player.y = newY;
    } else {
      // If direct movement fails, try smaller steps to slide along walls
      this.trySlideMovement(worldDx, worldDy);
    }
  }

  trySlideMovement(worldDx, worldDy) {
    const originalX = this.gameEngine.player.x;
    const originalY = this.gameEngine.player.y;

    // Try moving only in X direction
    const newX = originalX + worldDx;
    if (this.gameEngine.isValidPosition(newX, originalY)) {
      this.gameEngine.player.x = newX;
      return;
    }

    // Try moving only in Y direction
    const newY = originalY + worldDy;
    if (this.gameEngine.isValidPosition(originalX, newY)) {
      this.gameEngine.player.y = newY;
      return;
    }

    // If both fail, try smaller movements
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      const partialX = originalX + (worldDx * i / steps);
      const partialY = originalY + (worldDy * i / steps);

      if (this.gameEngine.isValidPosition(partialX, partialY)) {
        this.gameEngine.player.x = partialX;
        this.gameEngine.player.y = partialY;
        return;
      }
    }

    // If all else fails, don't move (player is stuck against wall)
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

  setJoystickState(active, x, y) {
    this.joystickState.active = active;
    this.joystickState.x = x;
    this.joystickState.y = y;
  }

  cleanup() {
    // Remove event listeners if needed
    // For now, we keep them as they're document-level
  }
}
