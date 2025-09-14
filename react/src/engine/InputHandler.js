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
    // Handle keyboard input
    this.handleKeyboardInput(deltaTime);
    
    // Handle joystick input
    this.handleJoystickInput(deltaTime);
  }

  handleKeyboardInput(deltaTime) {
    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED;
    const dt = deltaTime / 16.67; // Normalize to ~60fps

    // Movement - W/S for forward/backward relative to facing direction
    if (this.keys.w || this.keys.ArrowUp) {
      this.movePlayerRelative(0, moveSpeed * dt); // Forward
    }
    if (this.keys.s || this.keys.ArrowDown) {
      this.movePlayerRelative(0, -moveSpeed * dt); // Backward
    }

    // Camera turning - A/D for left/right camera rotation
    if (this.keys.a || this.keys.ArrowLeft) {
      this.gameEngine.player.rotate(-turnSpeed * dt); // Turn left
    }
    if (this.keys.d || this.keys.ArrowRight) {
      this.gameEngine.player.rotate(turnSpeed * dt); // Turn right
    }

    // Strafing - Q/E for left/right movement (used in strafe mode)
    if (this.keys.q) {
      this.movePlayerRelative(-moveSpeed * dt, 0); // Strafe left
    }
    if (this.keys.e) {
      this.movePlayerRelative(moveSpeed * dt, 0); // Strafe right
    }

    // Shooting - Spacebar
    if (this.keys[' ']) {
      this.gameEngine.shoot();
    }
  }

  handleJoystickInput(deltaTime) {
    // Only clear joystick-related keys if joystick is active
    if (this.joystickState.active) {
      this.keys.w = false;
      this.keys.s = false;
      this.keys.a = false;
      this.keys.d = false;
      this.keys.q = false;
      this.keys.e = false;
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = false;
    }

    if (!this.joystickState.active) return;

    const { x, y } = this.joystickState;
    const deadzone = 0.15; // Smaller deadzone for more precision
    const sensitivity = 0.3; // Reduce sensitivity for touch controls
    const moveSpeed = GAME_CONSTANTS.MOVE_SPEED * sensitivity;
    const turnSpeed = GAME_CONSTANTS.TURN_SPEED * sensitivity;
    const dt = deltaTime / 16.67; // Normalize to ~60fps

    // Apply exponential scaling for better control at low speeds
    const applySensitivity = (value) => {
      const absValue = Math.abs(value);
      if (absValue < deadzone) return 0;
      // Apply exponential curve for better low-speed control
      const normalizedValue = (absValue - deadzone) / (1 - deadzone);
      const scaledValue = Math.pow(normalizedValue, 1.5) * Math.sign(value);
      return Math.max(-1, Math.min(1, scaledValue));
    };

    const scaledX = applySensitivity(x);
    const scaledY = applySensitivity(y);

    // Direct movement based on joystick position
    if (Math.abs(scaledY) > 0.01) {
      if (scaledY > 0) {
        // Forward movement - use same logic as W key
        this.movePlayerRelative(0, moveSpeed * dt * Math.abs(scaledY));
      } else {
        // Backward movement - use same logic as S key
        this.movePlayerRelative(0, -moveSpeed * dt * Math.abs(scaledY));
      }
    }

    if (Math.abs(scaledX) > 0.01) {
      if (this.gameEngine.strafeMode) {
        // Strafe mode
        if (scaledX < 0) {
          // Strafe left - use same logic as Q key
          this.movePlayerRelative(-moveSpeed * dt * Math.abs(scaledX), 0);
        } else {
          // Strafe right - use same logic as E key
          this.movePlayerRelative(moveSpeed * dt * Math.abs(scaledX), 0);
        }
      } else {
        // Normal mode - turn camera
        if (scaledX < 0) {
          this.gameEngine.player.rotate(-turnSpeed * dt * Math.abs(scaledX));
        } else {
          this.gameEngine.player.rotate(turnSpeed * dt * Math.abs(scaledX));
        }
      }
    }
  }

  movePlayerRelative(dx, dy) {
    // Convert relative movement to world coordinates based on player angle
    const angle = this.gameEngine.player.angle;

    // dx is strafe left/right, dy is forward/backward
    // Forward (dy > 0): move in direction of angle
    // Strafe right (dx > 0): move perpendicular to angle (angle + π/2)
    // Strafe left (dx < 0): move perpendicular to angle (angle - π/2)

    const worldDx = dy * Math.cos(angle) + dx * Math.sin(angle);
    const worldDy = dy * Math.sin(angle) - dx * Math.cos(angle);

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
