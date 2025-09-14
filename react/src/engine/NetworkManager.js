import io from 'socket.io-client';

export class NetworkManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.socket = null;
    this.connected = false;
    this.players = new Map();
    this.localPlayerId = null;
    // Determine server URL based on current location
    const currentHost = window.location.host;
    const currentProtocol = window.location.protocol;

    // If we're on a custom domain (not localhost), connect to the same domain
    if (currentHost.includes('boondit.site') || (!currentHost.includes('localhost') && !currentHost.includes('127.0.0.1'))) {
      this.serverUrl = `${currentProtocol}//${currentHost}`;
    } else {
      // For local development, use localhost
      this.serverUrl = 'http://localhost:5642';
    }

    this.pendingMoves = [];
    this.lastSentPosition = { x: 0, y: 0, angle: 0 };
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectDelay = 2000; // 2 seconds
    this.reconnectTimer = null;
  }

  connect() {
    console.log(`Attempting to connect to server: ${this.serverUrl}`);
    this.connectionAttempts++;

    this.socket = io(this.serverUrl, {
      timeout: 5000, // 5 second connection timeout
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server successfully');
      this.connected = true;
      this.connectionAttempts = 0; // Reset attempts on successful connection
      this.localPlayerId = this.socket.id;
      this.gameEngine.gameStateManager.updateConnectionStatus(true, this.socket.id);
      this.gameEngine.gameStateManager.updateConnectedPlayers(this.players.size + 1);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.connected = false;
      this.gameEngine.gameStateManager.updateConnectionStatus(false);

      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Retrying connection in ${this.reconnectDelay}ms... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else {
        console.error('Max connection attempts reached. Please check if the server is running.');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.connected = false;
      this.gameEngine.gameStateManager.updateConnectionStatus(false);
      this.gameEngine.gameStateManager.updateConnectedPlayers(0);

      // Auto-reconnect unless it was intentional
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('Connection lost, attempting to reconnect...');
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
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
      console.log(`Player joined: ${player.id}`, player);
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
    const remotePlayers = Array.from(this.players.values()).filter(player => player.connected);
    console.log(`Remote players: ${remotePlayers.length}`, remotePlayers);
    return remotePlayers;
  }

  isConnected() {
    return this.connected;
  }
}
