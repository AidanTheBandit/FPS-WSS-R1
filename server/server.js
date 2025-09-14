const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

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
  maxPlayers: 8
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

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create new player
  const player = createPlayer(socket.id);
  players.set(socket.id, player);

  console.log(`Total players now: ${players.size}`);

  // Send current game state to new player
  socket.emit('gameState', {
    players: Array.from(players.values()),
    gameState: gameState
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
    players.forEach((targetPlayer, targetId) => {
      if (targetId === socket.id || !targetPlayer.connected) return;

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
            console.log(`Player ${socket.id} hit ${targetId}`);
            targetPlayer.health -= GAME_CONSTANTS.SHOOT_DAMAGE;
            player.score += 100;

            // Broadcast hit
            io.emit('playerHit', {
              shooterId: socket.id,
              targetId: targetId,
              damage: GAME_CONSTANTS.SHOOT_DAMAGE,
              newHealth: targetPlayer.health
            });

            // Check if player died
            if (targetPlayer.health <= 0) {
              targetPlayer.health = 0;
              io.emit('playerDied', {
                playerId: targetId,
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
    player.ammo = 50;

    io.emit('playerRespawned', player);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const player = players.get(socket.id);
    if (player) {
      player.connected = false;
      socket.broadcast.emit('playerLeft', socket.id);
      console.log(`Total players now: ${players.size - 1}`);

      // Remove player after delay to allow reconnection
      setTimeout(() => {
        if (!player.connected) {
          players.delete(socket.id);
          console.log(`Player ${socket.id} removed from game`);
        }
      }, 5000);
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5642;
server.listen(PORT, () => {
  console.log(`Multiplayer FPS server running on port ${PORT}`);
  console.log(`Socket.IO available at: ws://localhost:${PORT}/server`);
});
