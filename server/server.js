const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

// Serve static files from React build (for production)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const reactBuildPath = path.join(__dirname, '../react/dist');
  console.log('Serving React build from:', reactBuildPath);

  // Serve static files
  app.use(express.static(reactBuildPath));

  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip Socket.IO routes
    if (req.path.startsWith('/socket.io')) {
      return next();
    }

    // Serve React app for everything else
    res.sendFile(path.join(reactBuildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving React app:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
}

// Simple CORS middleware for same-origin requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  path: '/server',
  cors: {
    origin: true, // Allow same origin
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game state
const players = new Map();
const gameState = {
  level: 1,
  enemies: [],
  maxPlayers: 8,
  ammoPickups: new Map() // Store ammo pickups by ID
};

// Game constants (mirroring client)
const GAME_CONSTANTS = {
  MOVE_SPEED: 0.2,
  TURN_SPEED: 0.1,
  PLAYER_START_HEALTH: 100,
  SHOOT_DAMAGE: 50,
  SHOOT_DISTANCE: 10
};

// Simple map (same as client for now)
const MAP = [
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

function castRay(originX, originY, angle, maxDepth = 20) {
  if (!MAP || !Array.isArray(MAP) || MAP.length === 0 || !Array.isArray(MAP[0])) {
    return maxDepth;
  }

  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let x = originX;
  let y = originY;
  const mapWidth = MAP[0].length;
  const mapHeight = MAP.length;

  for (let depth = 0; depth < maxDepth; depth += 0.1) {
    const testX = Math.floor(x);
    const testY = Math.floor(y);

    if (testX < 0 || testX >= mapWidth ||
        testY < 0 || testY >= mapHeight ||
        MAP[testY][testX] === 1) {
      return depth;
    }

    x += cos * 0.1;
    y += sin * 0.1;
  }

  return maxDepth;
}

function isValidPosition(x, y) {
  const mapX = Math.floor(x);
  const mapY = Math.floor(y);
  if (mapX < 0 || mapX >= MAP[0].length || mapY < 0 || mapY >= MAP.length) {
    return false;
  }
  return MAP[mapY][mapX] === 0;
}

function generatePlayerId() {
  return Math.random().toString(36).substr(2, 9);
}

function createPlayer(socketId) {
  return {
    id: socketId,
    x: 2 + Math.random() * 6,
    y: 2 + Math.random() * 6,
    angle: 0,
    health: GAME_CONSTANTS.PLAYER_START_HEALTH,
    ammo: 50,
    score: 0,
    lastUpdate: Date.now(),
    connected: true
  };
}

function createAmmoPickup() {
  const id = 'ammo_' + Math.random().toString(36).substr(2, 9);
  let x, y;
  let attempts = 0;
  const maxAttempts = 50;

  // Find a valid position for the ammo pickup
  do {
    x = 1 + Math.random() * 14; // Within map bounds
    y = 1 + Math.random() * 10;
    attempts++;
  } while (!isValidPosition(x, y) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    // Fallback to a safe position
    x = 2 + Math.random() * 6;
    y = 2 + Math.random() * 6;
  }

  return {
    id: id,
    x: x,
    y: y,
    ammoAmount: 25, // Amount of ammo this pickup gives
    spawnTime: Date.now(),
    collected: false
  };
}

function spawnAmmoPickup() {
  const pickup = createAmmoPickup();
  gameState.ammoPickups.set(pickup.id, pickup);

  // Broadcast to all connected players
  const connectedPlayers = Array.from(players.values()).filter(p => p.connected);
  connectedPlayers.forEach(player => {
    const socket = io.sockets.sockets.get(player.id);
    if (socket) {
      socket.emit('ammoPickupSpawned', pickup);
    }
  });

  console.log(`Ammo pickup spawned at (${pickup.x.toFixed(2)}, ${pickup.y.toFixed(2)})`);
}

function checkAmmoPickupCollision(player) {
  const pickupRadius = 0.8; // Collision radius for pickups

  for (const [pickupId, pickup] of gameState.ammoPickups) {
    if (pickup.collected) continue;

    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= pickupRadius) {
      // Player collected the ammo pickup
      pickup.collected = true;
      player.ammo += pickup.ammoAmount;

      // Cap ammo at reasonable maximum
      if (player.ammo > 100) {
        player.ammo = 100;
      }

      // Broadcast collection to all players
      io.emit('ammoPickupCollected', {
        pickupId: pickupId,
        playerId: player.id,
        newAmmo: player.ammo
      });

      // Remove pickup after a short delay
      setTimeout(() => {
        gameState.ammoPickups.delete(pickupId);
      }, 100);

      console.log(`Player ${player.id} collected ammo pickup, now has ${player.ammo} ammo`);
      break; // Only allow one pickup per movement
    }
  }
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Check if player already exists (reconnection)
  let player = players.get(socket.id);
  if (player) {
    // Reconnecting player - just mark as connected
    player.connected = true;
    player.lastUpdate = Date.now();
    console.log(`Player ${socket.id} reconnected`);
  } else {
    // Create new player
    player = createPlayer(socket.id);
    players.set(socket.id, player);
    console.log(`New player ${socket.id} created`);
  }

  console.log(`Total connected players: ${Array.from(players.values()).filter(p => p.connected).length}`);

  // Send current game state to new player
  socket.emit('gameState', {
    players: Array.from(players.values()).filter(p => p.connected),
    gameState: {
      ...gameState,
      ammoPickups: Array.from(gameState.ammoPickups.values()).filter(p => !p.collected)
    }
  });

  // Notify other players of new player
  socket.broadcast.emit('playerJoined', player);

  // Handle player movement
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.connected) return;

    const { x, y, angle } = data;

    // Validate movement
    if (isValidPosition(x, y)) {
      player.x = x;
      player.y = y;
      player.angle = angle;
      player.lastUpdate = Date.now();

      // Check for ammo pickup collisions
      checkAmmoPickupCollision(player);

      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x, y, angle
      });
    }
  });

  // Handle shooting
  socket.on('playerShoot', (data) => {
    const player = players.get(socket.id);
    if (!player || !player.connected || player.ammo <= 0) return;

    console.log(`Player ${socket.id} shooting`);
    player.ammo--;

    // Check for hits on other players
    const { angle } = data;
    const shooterX = player.x;
    const shooterY = player.y;

    // Check for hits on other players with line of sight
    const connectedPlayers = Array.from(players.values()).filter(p => p.connected);
    connectedPlayers.forEach((targetPlayer) => {
      if (targetPlayer.id === socket.id) return;

      const dx = targetPlayer.x - shooterX;
      const dy = targetPlayer.y - shooterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= GAME_CONSTANTS.SHOOT_DISTANCE) {
        const angleToTarget = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToTarget - angle);
        const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

        if (normalizedAngleDiff <= Math.PI / 6) { // 30 degree cone
          // Check line of sight - cast ray to target position
          const rayDistance = castRay(shooterX, shooterY, angleToTarget);

          if (rayDistance >= distance) {
            // Hit! No wall blocking the shot
            console.log(`Player ${socket.id} hit ${targetPlayer.id}`);
            targetPlayer.health -= GAME_CONSTANTS.SHOOT_DAMAGE;
            player.score += 100;

            // Broadcast hit
            io.emit('playerHit', {
              shooterId: socket.id,
              targetId: targetPlayer.id,
              damage: GAME_CONSTANTS.SHOOT_DAMAGE,
              newHealth: targetPlayer.health
            });

            // Check if player died
            if (targetPlayer.health <= 0) {
              targetPlayer.health = 0;
              io.emit('playerDied', {
                playerId: targetPlayer.id,
                killerId: socket.id
              });
            }
          }
        }
      }
    });

    // Broadcast shoot event
    socket.broadcast.emit('playerShot', {
      playerId: socket.id,
      ammo: player.ammo
    });
  });

  // Handle player respawn
  socket.on('playerRespawn', () => {
    const player = players.get(socket.id);
    if (!player) return;

    player.health = GAME_CONSTANTS.PLAYER_START_HEALTH;
    player.x = 2 + Math.random() * 6;
    player.y = 2 + Math.random() * 6;
    player.ammo = Math.max(player.ammo, 25); // Ensure at least 25 ammo on respawn

    io.emit('playerRespawned', player);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const player = players.get(socket.id);
    if (player) {
      player.connected = false;
      socket.broadcast.emit('playerLeft', socket.id);

      // Remove player immediately instead of waiting
      players.delete(socket.id);
      console.log(`Player ${socket.id} removed immediately`);
      console.log(`Total connected players: ${Array.from(players.values()).filter(p => p.connected).length}`);
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  const connectedPlayers = Array.from(players.values()).filter(p => p.connected);
  res.json({
    status: 'ok',
    players: connectedPlayers.length,
    timestamp: new Date().toISOString()
  });
});

// Periodic ammo pickup spawning
setInterval(() => {
  const connectedPlayers = Array.from(players.values()).filter(p => p.connected);
  if (connectedPlayers.length > 0) {
    // Only spawn if there are connected players
    const activePickups = Array.from(gameState.ammoPickups.values()).filter(p => !p.collected);

    // Maintain 3-5 active pickups
    const maxPickups = Math.min(5, Math.max(3, connectedPlayers.length));
    const pickupsToSpawn = maxPickups - activePickups.length;

    for (let i = 0; i < pickupsToSpawn; i++) {
      spawnAmmoPickup();
    }
  }
}, 15000); // Spawn check every 15 seconds

// Periodic cleanup of old ammo pickups
setInterval(() => {
  const now = Date.now();
  const toRemove = [];

  for (const [pickupId, pickup] of gameState.ammoPickups) {
    // Remove pickups that are older than 2 minutes
    if (now - pickup.spawnTime > 120000) {
      toRemove.push(pickupId);
    }
  }

  toRemove.forEach(id => {
    gameState.ammoPickups.delete(id);
    io.emit('ammoPickupExpired', id);
  });

  if (toRemove.length > 0) {
    console.log(`Expired ${toRemove.length} old ammo pickups`);
  }
}, 60000); // Cleanup every minute

// Periodic cleanup of disconnected players (safety net)
setInterval(() => {
  const beforeCount = players.size;
  for (const [socketId, player] of players) {
    if (!player.connected) {
      players.delete(socketId);
    }
  }
  const afterCount = players.size;
  if (beforeCount !== afterCount) {
    console.log(`Cleaned up ${beforeCount - afterCount} disconnected players`);
  }
}, 30000); // Run every 30 seconds

// Start server
const PORT = process.env.PORT || 5462;
server.listen(PORT, () => {
  console.log(`🚀 Multiplayer FPS server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT} (served by Express)`);
  console.log(`🔌 Socket.IO: ws://localhost:${PORT}/server`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
