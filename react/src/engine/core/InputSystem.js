/**
 * Input System
 *
 * Handles all input devices: keyboard, mouse, touch, and gamepad.
 * Provides unified input API with event system and input mapping.
 */

export class InputSystem {
  constructor(engine) {
    this.engine = engine;

    // Input state
    this.keys = new Map();
    this.previousKeys = new Map();
    this.mouse = {
      x: 0,
      y: 0,
      buttons: new Map(),
      previousButtons: new Map()
    };
    this.touch = {
      touches: new Map(),
      previousTouches: new Map()
    };

    // Input mappings
    this.keyMappings = new Map();
    this.mouseMappings = new Map();

    // Event callbacks
    this.eventListeners = new Map();

    this.setupDefaultMappings();
    this.bindEvents();
  }

  init(engine) {
    this.engine = engine;
    console.log('🎮 Input System initialized');
  }

  /**
   * Setup default input mappings
   */
  setupDefaultMappings() {
    // Movement
    this.keyMappings.set('move_forward', ['KeyW', 'ArrowUp']);
    this.keyMappings.set('move_backward', ['KeyS', 'ArrowDown']);
    this.keyMappings.set('move_left', ['KeyA', 'ArrowLeft']);
    this.keyMappings.set('move_right', ['KeyD', 'ArrowRight']);
    this.keyMappings.set('strafe', ['ShiftLeft']);

    // Actions
    this.keyMappings.set('jump', ['Space']);
    this.keyMappings.set('shoot', ['Space']);
    this.keyMappings.set('use', ['KeyE']);
    this.keyMappings.set('crouch', ['KeyC']);
    this.keyMappings.set('run', ['ShiftLeft']);

    // Mouse
    this.mouseMappings.set('look_x', 0); // Mouse X axis
    this.mouseMappings.set('look_y', 1); // Mouse Y axis
    this.mouseMappings.set('shoot', 0); // Left mouse button
  }

  /**
   * Bind DOM events
   */
  bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('wheel', this.handleMouseWheel.bind(this));

    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Context menu
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Window focus events
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }

  /**
   * Handle key down events
   */
  handleKeyDown(event) {
    this.keys.set(event.code, true);
    this.emit('keydown', { key: event.code, event });
  }

  /**
   * Handle key up events
   */
  handleKeyUp(event) {
    this.keys.set(event.code, false);
    this.emit('keyup', { key: event.code, event });
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.emit('mousemove', { x: this.mouse.x, y: this.mouse.y, event });
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(event) {
    this.mouse.buttons.set(event.button, true);
    this.emit('mousedown', { button: event.button, x: this.mouse.x, y: this.mouse.y, event });
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(event) {
    this.mouse.buttons.set(event.button, false);
    this.emit('mouseup', { button: event.button, x: this.mouse.x, y: this.mouse.y, event });
  }

  /**
   * Handle mouse wheel events
   */
  handleMouseWheel(event) {
    this.emit('mousewheel', { deltaY: event.deltaY, event });
  }

  /**
   * Handle touch start events
   */
  handleTouchStart(event) {
    event.preventDefault();
    for (let touch of event.touches) {
      this.touch.touches.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      });
    }
    this.emit('touchstart', { touches: Array.from(this.touch.touches.values()), event });
  }

  /**
   * Handle touch move events
   */
  handleTouchMove(event) {
    event.preventDefault();
    for (let touch of event.touches) {
      if (this.touch.touches.has(touch.identifier)) {
        this.touch.touches.get(touch.identifier).x = touch.clientX;
        this.touch.touches.get(touch.identifier).y = touch.clientY;
      }
    }
    this.emit('touchmove', { touches: Array.from(this.touch.touches.values()), event });
  }

  /**
   * Handle touch end events
   */
  handleTouchEnd(event) {
    event.preventDefault();
    for (let touch of event.changedTouches) {
      this.touch.touches.delete(touch.identifier);
    }
    this.emit('touchend', { touches: Array.from(this.touch.touches.values()), event });
  }

  /**
   * Handle window blur
   */
  handleWindowBlur() {
    // Clear all input state when window loses focus
    this.keys.clear();
    this.mouse.buttons.clear();
    this.touch.touches.clear();
    this.emit('windowblur');
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    this.emit('windowfocus');
  }

  /**
   * Update input system
   */
  update(deltaTime) {
    // Copy current state to previous state
    this.previousKeys = new Map(this.keys);
    this.previousButtons = new Map(this.mouse.buttons);
    this.previousTouches = new Map(this.touch.touches);
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(keyCode) {
    return this.keys.get(keyCode) === true;
  }

  /**
   * Check if a key was just pressed (this frame)
   */
  isKeyJustPressed(keyCode) {
    return this.keys.get(keyCode) === true && this.previousKeys.get(keyCode) !== true;
  }

  /**
   * Check if a key was just released (this frame)
   */
  isKeyJustReleased(keyCode) {
    return this.keys.get(keyCode) !== true && this.previousKeys.get(keyCode) === true;
  }

  /**
   * Check if a mouse button is pressed
   */
  isMouseButtonPressed(button) {
    return this.mouse.buttons.get(button) === true;
  }

  /**
   * Check if a mouse button was just pressed
   */
  isMouseButtonJustPressed(button) {
    return this.mouse.buttons.get(button) === true && this.previousButtons.get(button) !== true;
  }

  /**
   * Check if a mouse button was just released
   */
  isMouseButtonJustReleased(button) {
    return this.mouse.buttons.get(button) !== true && this.previousButtons.get(button) === true;
  }

  /**
   * Check if an action is active (mapped input)
   */
  isActionActive(action) {
    const keys = this.keyMappings.get(action);
    if (keys) {
      return keys.some(key => this.isKeyPressed(key));
    }

    const mouseButton = this.mouseMappings.get(action);
    if (typeof mouseButton === 'number') {
      return this.isMouseButtonPressed(mouseButton);
    }

    return false;
  }

  /**
   * Check if an action was just triggered
   */
  isActionJustTriggered(action) {
    const keys = this.keyMappings.get(action);
    if (keys) {
      return keys.some(key => this.isKeyJustPressed(key));
    }

    const mouseButton = this.mouseMappings.get(action);
    if (typeof mouseButton === 'number') {
      return this.isMouseButtonJustPressed(mouseButton);
    }

    return false;
  }

  /**
   * Get mouse position relative to canvas
   */
  getMousePosition(canvas = this.engine?.canvas) {
    if (!canvas) return { x: this.mouse.x, y: this.mouse.y };

    const rect = canvas.getBoundingClientRect();
    return {
      x: this.mouse.x - rect.left,
      y: this.mouse.y - rect.top
    };
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('wheel', this.handleMouseWheel);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('contextmenu', () => {});
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Handle touch input for mobile controls
   */
  handleTouch(action, isStart) {
    const keyMap = {
      'move_forward': 'KeyW',
      'move_backward': 'KeyS',
      'turn_left': 'KeyA',
      'turn_right': 'KeyD',
      'shoot': 'Space',
      'use': 'KeyE',
      'strafe': 'ShiftLeft'
    };

    const key = keyMap[action];
    if (key) {
      if (isStart) {
        this.keys.set(key, true);
      } else {
        this.keys.set(key, false);
      }
    }
  }
}
