import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';
import { GameEngine } from './engine/GameEngine.js';
import LoadingScreen from './components/LoadingScreen.jsx';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState({
    health: 100,
    ammo: 50,
    level: 1,
    enemies: 0,
    score: 0,
    connectedPlayers: 0,
    isConnected: false,
    playerId: null
  });
  const [joystickState, setJoystickState] = useState({
    active: false,
    startX: 40, // Center of 80px joystick base
    startY: 40,
    currentX: 40,
    currentY: 40,
    maxDistance: 30, // Allow movement within the 80px base (radius of 35, but using 30 for margin)
    resetTimeout: null // Track reset timeout
  });

  const [strafeMode, setStrafeMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initEngine = async () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Create the game engine
        engineRef.current = new GameEngine(canvas, (state) => {
          setGameState(state);
        });

        // Start the engine
        engineRef.current.start();

        // Hide loading screen
        setIsLoading(false);
      }
    };

    initEngine();

    // Add mouse wheel support for camera turning
    const handleWheel = (event) => {
      event.preventDefault();
      if (engineRef.current && engineRef.current.inputHandler) {
        const turnAmount = event.deltaY > 0 ? 0.1 : -0.1; // Adjust sensitivity
        engineRef.current.player.rotate(turnAmount);
      }
    };

    // Add keyboard shortcuts
    const handleKeyDown = (event) => {
      // Toggle strafe mode with Shift key
      if (event.key === 'Shift') {
        setStrafeMode(prev => !prev);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleJoystickStart = (event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
    const y = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

    setJoystickState(prev => ({
      ...prev,
      active: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y
    }));
  };

  const handleJoystickMove = (event) => {
    event.preventDefault();
    if (!joystickState.active) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
    const y = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

    // Calculate distance from center (40, 40 for 80px base)
    const centerX = 40;
    const centerY = 40;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If the touch/mouse has moved too far from the joystick base, release it
    const maxAllowedDistance = 80; // Allow some tolerance beyond the visual base
    if (distance > maxAllowedDistance) {
      handleJoystickEnd(event);
      return;
    }

    // Limit to joystick base radius
    const maxDistance = 30; // Radius of 35px, but using 30 for visual margin
    const clampedX = distance > maxDistance ? (deltaX / distance) * maxDistance : deltaX;
    const clampedY = distance > maxDistance ? (deltaY / distance) * maxDistance : deltaY;

    const finalX = centerX + clampedX;
    const finalY = centerY + clampedY;

    setJoystickState(prev => ({
      ...prev,
      currentX: finalX,
      currentY: finalY
    }));

    // Update movement based on joystick position
    if (engineRef.current && engineRef.current.inputHandler) {
      const normalizedX = clampedX / maxDistance;
      const normalizedY = -clampedY / maxDistance; // Invert Y so up is positive

      // Set joystick state directly
      engineRef.current.inputHandler.setJoystickState(true, normalizedX, normalizedY);
    }
  };

  const handleJoystickEnd = (event) => {
    event.preventDefault();

    // Clear any existing reset timeout
    if (joystickState.resetTimeout) {
      clearTimeout(joystickState.resetTimeout);
    }

    setJoystickState(prev => ({
      ...prev,
      active: false,
      currentX: 40, // Reset to center of 80px base
      currentY: 40,
      resetTimeout: null
    }));

    // Stop all movement
    if (engineRef.current && engineRef.current.inputHandler) {
      // Deactivate joystick
      engineRef.current.inputHandler.setJoystickState(false, 0, 0);
    }
  };

  // Add global mouse up handler to ensure joystick releases even if mouse leaves
  useEffect(() => {
    const handleGlobalMouseUp = (event) => {
      if (joystickState.active) {
        handleJoystickEnd(event);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
      // Clear any pending timeout on cleanup
      if (joystickState.resetTimeout) {
        clearTimeout(joystickState.resetTimeout);
      }
    };
  }, [joystickState.active]);

  const handleFire = () => {
    if (engineRef.current) {
      engineRef.current.renderer.triggerMuzzleFlash();
      engineRef.current.shoot();
    }
  };

  const handleStrafeToggle = () => {
    setStrafeMode(prev => {
      const newMode = !prev;
      if (engineRef.current) {
        engineRef.current.strafeMode = newMode;
      }
      return newMode;
    });
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Multiplayer HUD */}
        <div className="multiplayer-hud">
          <div
            className={`connection-status ${gameState.isConnected ? 'connected' : 'disconnected'}`}
            onClick={() => {
              if (!gameState.isConnected && engineRef.current?.networkManager) {
                console.log('Retrying connection...');
                console.log('Connection status:', engineRef.current.networkManager.getConnectionStatus());
                engineRef.current.networkManager.retryConnection();
              } else if (gameState.isConnected && engineRef.current?.networkManager) {
                console.log('Connection status:', engineRef.current.networkManager.getConnectionStatus());
              }
            }}
            style={{ cursor: gameState.isConnected ? 'default' : 'pointer' }}
            title={gameState.isConnected ? 'Connected to server' : 'Click to retry connection'}
          >
            {gameState.isConnected ? '🟢 Online' : '🔴 Offline (Click to retry)'}
          </div>
          <div className="player-count">
            Players: {gameState.connectedPlayers || 1}
          </div>
        </div>

        {/* Game Stats HUD */}
        {/* Game Stats HUD */}
        <div className="game-hud">
          <div className="health">❤️ {gameState.health}</div>
          <div className="ammo">🔫 {gameState.ammo}</div>
          <div className="score">⭐ {gameState.score}</div>
          <div className="level">🏁 {gameState.level}</div>
        </div>        <div className="touch-controls">
          {/* Virtual Joystick */}
          <div className="joystick-container">
            <div
              className="joystick-base"
              onTouchStart={(e) => { e.preventDefault(); handleJoystickStart(e); }}
              onTouchMove={(e) => { e.preventDefault(); handleJoystickMove(e); }}
              onTouchEnd={(e) => { e.preventDefault(); handleJoystickEnd(e); }}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
              style={{
                backgroundColor: joystickState.active ? 'rgba(254, 95, 0, 0.3)' : 'rgba(254, 95, 0, 0.2)',
                boxShadow: joystickState.active ? '0 0 15px rgba(254, 95, 0, 0.5)' : 'none'
              }}
            >
              <div
                className="joystick-handle"
                style={{
                  left: `${joystickState.currentX}px`,
                  top: `${joystickState.currentY}px`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: joystickState.active ? 'rgba(254, 95, 0, 1)' : 'rgba(254, 95, 0, 0.8)',
                  boxShadow: joystickState.active ? '0 0 10px rgba(254, 95, 0, 0.8)' : 'none'
                }}
              />
              {/* Center indicator */}
              <div
                className="joystick-center"
                style={{
                  left: '40px',
                  top: '40px',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
            <div className="joystick-label">
              {strafeMode ? 'STRAFE' : 'MOVE'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="action-btn shoot-btn"
              onTouchStart={(e) => { e.preventDefault(); handleFire(); }}
              onMouseDown={handleFire}
            >
              FIRE
            </button>
          </div>
        </div>

        {/* Respawn Button */}
        {gameState.health <= 0 && (
          <div className="respawn-overlay">
            <div className="respawn-message">YOU DIED</div>
            <button
              className="respawn-btn"
              onClick={() => {
                console.log('Respawn button clicked');
                if (engineRef.current?.respawn) {
                  engineRef.current.respawn();
                } else {
                  console.error('Engine respawn method not available');
                }
              }}
            >
              RESPAWN
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RaycastingEngine;
