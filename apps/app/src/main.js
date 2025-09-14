// R1 Doom - Complete JavaScript Doom Engine Implementation
// Optimized for R1 device (240x320px portrait, hardware controls)

// ===========================================
// Game Engine Core
// ===========================================

class DoomEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 240;
    this.height = 320;
    
    // Set canvas resolution for R1 device
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Game state
    this.player = {
      x: 5,
      y: 5,
      angle: 0,
      health: 100,
      ammo: 50
    };
    
    // Input state
    this.keys = {};
    this.touching = {};
    
    // Game settings optimized for R1
    this.fov = Math.PI / 3;
    this.rayCount = 120; // Reduced for performance
    this.maxDepth = 20;
    this.moveSpeed = 0.1;
    this.turnSpeed = 0.05;
    
    // Simple level map (1 = wall, 0 = empty)
    this.map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
      [1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
      [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,0,1,0,0,0,0,1,0,0,1,0,1],
      [1,0,1,1,0,0,0,1,1,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
      [1,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    this.mapWidth = this.map[0].length;
    this.mapHeight = this.map.length;
    
    // Performance optimization
    this.lastTime = 0;
    this.targetFPS = 30; // Reduced for R1 performance
    this.frameInterval = 1000 / this.targetFPS;
    
    this.running = false;
    this.shooting = false;
    this.muzzleFlash = 0;
  }
  
  // Raycasting engine
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
  
  // Render 3D view using raycasting
  render() {
    // Clear screen
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw ceiling and floor
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.width, this.height / 2);
    this.ctx.fillStyle = '#666';
    this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
    
    // Cast rays for 3D view
    for (let x = 0; x < this.rayCount; x++) {
      const rayAngle = this.player.angle - this.fov / 2 + (x / this.rayCount) * this.fov;
      const distance = this.castRay(rayAngle);
      
      // Calculate wall height
      const wallHeight = (this.height / 2) / distance;
      const wallTop = (this.height / 2) - wallHeight;
      const wallBottom = (this.height / 2) + wallHeight;
      
      // Wall shading based on distance
      const shade = Math.max(0, 1 - distance / this.maxDepth);
      const color = Math.floor(255 * shade);
      
      this.ctx.fillStyle = `rgb(${color}, ${Math.floor(color * 0.5)}, 0)`;
      this.ctx.fillRect(
        (x / this.rayCount) * this.width,
        wallTop,
        this.width / this.rayCount + 1,
        wallBottom - wallTop
      );
    }
    
    // Muzzle flash effect
    if (this.muzzleFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 0, ${this.muzzleFlash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.muzzleFlash -= 0.1;
    }
    
    // Draw crosshair
    this.ctx.strokeStyle = '#FE5F00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2 - 10, this.height / 2);
    this.ctx.lineTo(this.width / 2 + 10, this.height / 2);
    this.ctx.moveTo(this.width / 2, this.height / 2 - 10);
    this.ctx.lineTo(this.width / 2, this.height / 2 + 10);
    this.ctx.stroke();
  }
  
  // Update game logic
  update(deltaTime) {
    const dt = deltaTime / 16.67; // Normalize to 60fps
    
    // Movement
    if (this.keys.up || this.touching.up) {
      const newX = this.player.x + Math.cos(this.player.angle) * this.moveSpeed * dt;
      const newY = this.player.y + Math.sin(this.player.angle) * this.moveSpeed * dt;
      
      if (this.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }
    
    if (this.keys.down || this.touching.down) {
      const newX = this.player.x - Math.cos(this.player.angle) * this.moveSpeed * dt;
      const newY = this.player.y - Math.sin(this.player.angle) * this.moveSpeed * dt;
      
      if (this.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }
    
    // Turning
    if (this.keys.left || this.touching.left) {
      this.player.angle -= this.turnSpeed * dt;
    }
    
    if (this.keys.right || this.touching.right) {
      this.player.angle += this.turnSpeed * dt;
    }
    
    // Strafing
    if (this.keys.strafe || this.touching.strafe) {
      const strafeAngle = this.player.angle + Math.PI / 2;
      const newX = this.player.x + Math.cos(strafeAngle) * this.moveSpeed * dt;
      const newY = this.player.y + Math.sin(strafeAngle) * this.moveSpeed * dt;
      
      if (this.isValidPosition(newX, newY)) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }
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
    if (this.player.ammo > 0) {
      this.player.ammo--;
      this.muzzleFlash = 0.5;
      this.shooting = true;
      
      // Update HUD
      document.getElementById('ammoValue').textContent = this.player.ammo;
      
      setTimeout(() => {
        this.shooting = false;
      }, 100);
    }
  }
  
  // Game loop
  gameLoop(currentTime) {
    if (!this.running) return;
    
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= this.frameInterval) {
      this.update(deltaTime);
      this.render();
      this.lastTime = currentTime;
    }
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
  
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }
  
  stop() {
    this.running = false;
  }
}

// ===========================================
// R1 Hardware Integration
// ===========================================

let game;
let orientationMode = 'portrait';

// Check if running as R1 plugin
if (typeof PluginMessageHandler !== 'undefined') {
  console.log('Running as R1 Creation - Doom Engine');
} else {
  console.log('Running in browser mode - Doom Engine');
}

// Orientation detection
function detectOrientation() {
  const newMode = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  
  if (newMode !== orientationMode) {
    orientationMode = newMode;
    console.log(`Orientation changed to: ${orientationMode}`);
    
    if (game) {
      // Adjust canvas size for orientation
      if (orientationMode === 'landscape') {
        game.width = 320;
        game.height = 240;
      } else {
        game.width = 240;
        game.height = 320;
      }
      
      game.canvas.width = game.width;
      game.canvas.height = game.height;
      game.rayCount = orientationMode === 'landscape' ? 160 : 120;
    }
  }
}

// R1 Hardware Events
window.addEventListener('scrollUp', () => {
  if (game) {
    game.player.angle -= game.turnSpeed * 2;
  }
});

window.addEventListener('scrollDown', () => {
  if (game) {
    game.player.angle += game.turnSpeed * 2;
  }
});

window.addEventListener('sideClick', () => {
  if (game) {
    game.shoot();
  }
});

// ===========================================
// Touch Controls
// ===========================================

function setupTouchControls() {
  const buttons = {
    up: document.getElementById('up'),
    down: document.getElementById('down'),
    left: document.getElementById('left'),
    right: document.getElementById('right'),
    shoot: document.getElementById('shoot'),
    use: document.getElementById('use'),
    strafe: document.getElementById('strafe')
  };
  
  // Touch event handlers
  Object.entries(buttons).forEach(([action, button]) => {
    if (!button) return;
    
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      game.touching[action] = true;
      
      if (action === 'shoot') {
        game.shoot();
      }
    });
    
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      game.touching[action] = false;
    });
    
    // Mouse events for development
    button.addEventListener('mousedown', (e) => {
      e.preventDefault();
      game.touching[action] = true;
      
      if (action === 'shoot') {
        game.shoot();
      }
    });
    
    button.addEventListener('mouseup', (e) => {
      e.preventDefault();
      game.touching[action] = false;
    });
  });
}

// Keyboard controls for development
window.addEventListener('keydown', (event) => {
  if (!game) return;
  
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW':
      game.keys.up = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      game.keys.down = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      game.keys.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      game.keys.right = true;
      break;
    case 'Space':
      event.preventDefault();
      game.shoot();
      break;
    case 'ShiftLeft':
      game.keys.strafe = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  if (!game) return;
  
  switch(event.code) {
    case 'ArrowUp':
    case 'KeyW':
      game.keys.up = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      game.keys.down = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      game.keys.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      game.keys.right = false;
      break;
    case 'ShiftLeft':
      game.keys.strafe = false;
      break;
  }
});

// ===========================================
// Initialization
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('R1 Doom initializing...');
  
  const canvas = document.getElementById('gameCanvas');
  const loading = document.getElementById('loading');
  
  // Detect initial orientation
  detectOrientation();
  
  // Listen for orientation changes
  window.addEventListener('resize', detectOrientation);
  window.addEventListener('orientationchange', () => {
    setTimeout(detectOrientation, 100);
  });
  
  // Initialize game engine
  game = new DoomEngine(canvas);
  
  // Setup controls
  setupTouchControls();
  
  // Hide loading screen and start game
  setTimeout(() => {
    loading.classList.add('hidden');
    game.start();
    console.log('R1 Doom started!');
  }, 1000);
  
  // Update HUD
  document.getElementById('healthValue').textContent = game.player.health;
  document.getElementById('ammoValue').textContent = game.player.ammo;
});

// Handle plugin messages
window.onPluginMessage = function(data) {
  console.log('Doom received message:', data);
  
  // Could be used for multiplayer features or game state sync
  if (data.message) {
    console.log('Game message:', data.message);
  }
};

console.log('R1 Doom Engine Ready!');
console.log('Controls:');
console.log('- Scroll wheel: Turn left/right');
console.log('- Side button: Shoot');
console.log('- Touch controls: Movement and actions');
console.log('- Orientation: Auto-detect portrait/landscape');