import io from 'socket.io-client';

export class NetworkManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.socket = null;
    this.connected = false;
    this.players = new Map();
    this.localPlayerId = null;
    this.serverUrl = 'http://localhost:3001';

    this.pendingMoves = [];
    this.lastSentPosition = { x: 0, y: 0, angle: 0 };
  }

  connect() {
    this.socket = io(this.serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      this.localPlayerId = this.socket.id;
      this.gameEngine.gameStateManager.updateConnectionStatus(true, this.socket.id);
      this.gameEngine.gameStateManager.updateConnectedPlayers(this.players.size + 1);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
      this.gameEngine.gameStateManager.updateConnectionStatus(false);
      this.gameEngine.gameStateManager.updateConnectedPlayers(0);
    });

    this.socket.on('gameState', (data) => {
      this.handleGameState(data);
    });

    this.socket.on('playerJoined', (player) => {
      this.handlePlayerJoined(player);
    });

    this.socket.on('playerLeft', (playerId) => {
      this.handlePlayerLeft(playerId);
    });

    this.socket.on('playerMoved', (data) => {
      this.handlePlayerMoved(data);
    });

    this.socket.on('playerShot', (data) => {
      this.handlePlayerShot(data);
    });

    this.socket.on('playerHit', (data) => {
      this.handlePlayerHit(data);
    });

    this.socket.on('playerDied', (data) => {
      this.handlePlayerDied(data);
    });

    this.socket.on('playerRespawned', (player) => {
      this.handlePlayerRespawned(player);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  handleGameState(data) {
    // Initialize all players
    this.players.clear();
    data.players.forEach(player => {
      if (player.id !== this.localPlayerId) {
        this.players.set(player.id, player);
      }
    });
  }

  handlePlayerJoined(player) {
    if (player.id !== this.localPlayerId) {
      this.players.set(player.id, player);
      console.log(`Player joined: ${player.id}`);
      this.gameEngine.gameStateManager.updateConnectedPlayers(this.players.size + 1);
    }
  }

  handlePlayerLeft(playerId) {
    this.players.delete(playerId);
    console.log(`Player left: ${playerId}`);
    this.gameEngine.gameStateManager.updateConnectedPlayers(this.players.size + 1);
  }

  handlePlayerMoved(data) {
    const player = this.players.get(data.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      player.lastUpdate = Date.now();
    }
  }

  handlePlayerShot(data) {
    const player = this.players.get(data.playerId);
    if (player) {
      player.ammo = data.ammo;
      // Trigger muzzle flash for remote player
      this.gameEngine.renderer.triggerRemoteMuzzleFlash(data.playerId);
    }
  }

  handlePlayerHit(data) {
    const targetPlayer = this.players.get(data.targetId);
    if (targetPlayer) {
      targetPlayer.health = data.newHealth;
    }

    // Update local player if they were hit
    if (data.targetId === this.localPlayerId) {
      this.gameEngine.player.health = data.newHealth;
      this.gameEngine.gameStateManager.updateHealth(data.newHealth);
    }
  }

  handlePlayerDied(data) {
    const deadPlayer = this.players.get(data.playerId);
    if (deadPlayer) {
      deadPlayer.health = 0;
    }

    if (data.playerId === this.localPlayerId) {
      this.gameEngine.player.health = 0;
      this.gameEngine.gameState = 'gameOver';
    }
  }

  handlePlayerRespawned(player) {
    if (player.id === this.localPlayerId) {
      this.gameEngine.player.x = player.x;
      this.gameEngine.player.y = player.y;
      this.gameEngine.player.health = player.health;
      this.gameEngine.player.ammo = player.ammo;
      this.gameEngine.gameState = 'playing';
    } else {
      this.players.set(player.id, player);
    }
  }

  sendPlayerMove(x, y, angle) {
    if (!this.connected) return;

    // Only send if position changed significantly
    const dx = Math.abs(x - this.lastSentPosition.x);
    const dy = Math.abs(y - this.lastSentPosition.y);
    const da = Math.abs(angle - this.lastSentPosition.angle);

    if (dx > 0.01 || dy > 0.01 || da > 0.01) {
      this.socket.emit('playerMove', { x, y, angle });
      this.lastSentPosition = { x, y, angle };
    }
  }

  sendPlayerShoot(angle) {
    if (!this.connected) return;
    this.socket.emit('playerShoot', { angle });
  }

  sendPlayerRespawn() {
    if (!this.connected) return;
    this.socket.emit('playerRespawn');
  }

  getRemotePlayers() {
    return Array.from(this.players.values()).filter(player => player.connected);
  }

  isConnected() {
    return this.connected;
  }
}
