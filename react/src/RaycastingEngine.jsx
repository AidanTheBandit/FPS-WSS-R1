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

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  const [joystickState, setJoystickState] = useState({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    maxDistance: 50
  });

  const [strafeMode, setStrafeMode] = useState(false);

  const handleJoystickStart = (event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
    const y = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

    setJoystickState({
      active: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      maxDistance: 50
    });
  };

  const handleJoystickMove = (event) => {
    event.preventDefault();
    if (!joystickState.active) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
    const y = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;

    const deltaX = x - joystickState.startX;
    const deltaY = y - joystickState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Limit joystick movement
    const maxDistance = joystickState.maxDistance;
    const clampedX = distance > maxDistance ? (deltaX / distance) * maxDistance : deltaX;
    const clampedY = distance > maxDistance ? (deltaY / distance) * maxDistance : deltaY;

    setJoystickState(prev => ({
      ...prev,
      currentX: prev.startX + clampedX,
      currentY: prev.startY + clampedY
    }));

        // Update player movement based on joystick position
    if (engineRef.current) {
      const normalizedX = clampedX / maxDistance;
      const normalizedY = clampedY / maxDistance;

      if (strafeMode) {
        // In strafe mode: X controls strafe left/right, Y controls forward/backward
        if (Math.abs(normalizedX) > 0.1) {
          if (normalizedX < 0) {
            engineRef.current.inputHandler?.startMoving('strafe');
          } else {
            // For right strafe, we need to modify the movement
            engineRef.current.inputHandler?.keys.d = true;
          }
        } else {
          engineRef.current.inputHandler?.stopMoving('strafe');
          engineRef.current.inputHandler?.keys.d = false;
        }

        if (Math.abs(normalizedY) > 0.1) {
          if (normalizedY < 0) {
            engineRef.current.inputHandler?.startMoving('forward');
          } else {
            engineRef.current.inputHandler?.startMoving('backward');
          }
        } else {
          engineRef.current.inputHandler?.stopMoving('forward');
          engineRef.current.inputHandler?.stopMoving('backward');
        }
      } else {
        // Normal mode: Y controls forward/backward, X controls turning
        if (Math.abs(normalizedY) > 0.1) {
          if (normalizedY < 0) {
            engineRef.current.inputHandler?.startMoving('forward');
            engineRef.current.inputHandler?.stopMoving('backward');
          } else {
            engineRef.current.inputHandler?.startMoving('backward');
            engineRef.current.inputHandler?.stopMoving('forward');
          }
        } else {
          engineRef.current.inputHandler?.stopMoving('forward');
          engineRef.current.inputHandler?.stopMoving('backward');
        }

        if (Math.abs(normalizedX) > 0.1) {
          if (normalizedX < 0) {
            engineRef.current.inputHandler?.startTurning('left');
            engineRef.current.inputHandler?.stopTurning('right');
          } else {
            engineRef.current.inputHandler?.startTurning('right');
            engineRef.current.inputHandler?.stopTurning('left');
          }
        } else {
          engineRef.current.inputHandler?.stopTurning('left');
          engineRef.current.inputHandler?.stopTurning('right');
        }
      }
    }
  };

  const handleJoystickEnd = (event) => {
    event.preventDefault();
    setJoystickState(prev => ({ ...prev, active: false }));

    // Stop all movement
    if (engineRef.current) {
      engineRef.current.inputHandler?.stopMoving('forward');
      engineRef.current.inputHandler?.stopMoving('backward');
      engineRef.current.inputHandler?.stopMoving('strafe');
      engineRef.current.inputHandler?.stopTurning('left');
      engineRef.current.inputHandler?.stopTurning('right');
      // Also reset keyboard states that might have been set
      engineRef.current.inputHandler.keys.d = false;
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* Multiplayer HUD */}
        <div className="multiplayer-hud">
          <div className={`connection-status ${gameState.isConnected ? 'connected' : 'disconnected'}`}>
            {gameState.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div className="player-count">
            Players: {gameState.connectedPlayers}
          </div>
          {gameState.playerId && (
            <div className="player-id">
              ID: {gameState.playerId.substring(0, 8)}
            </div>
          )}
        </div>

        {/* Game Stats HUD */}
        <div className="game-hud">
          <div className="health">Health: {gameState.health}</div>
          <div className="ammo">Ammo: {gameState.ammo}</div>
          <div className="score">Score: {gameState.score}</div>
          <div className="level">Level: {gameState.level}</div>
        </div>

        <div className="touch-controls">
          {/* Virtual Joystick */}
          <div className="joystick-container">
            <div
              className="joystick-base"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
            >
              <div
                className="joystick-handle"
                style={{
                  left: `${joystickState.startX + (joystickState.currentX - joystickState.startX)}px`,
                  top: `${joystickState.startY + (joystickState.currentY - joystickState.startY)}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
            <div className="joystick-label">MOVE</div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="action-btn shoot-btn"
              onTouchStart={() => engineRef.current?.shoot()}
              onMouseDown={() => engineRef.current?.shoot()}
            >
              FIRE
            </button>
            <button
              className={`action-btn strafe-btn ${strafeMode ? 'active' : ''}`}
              onTouchStart={() => setStrafeMode(!strafeMode)}
              onMouseDown={() => setStrafeMode(!strafeMode)}
            >
              STRAFE
            </button>
          </div>
        </div>

        {/* Respawn Button */}
        {gameState.health <= 0 && (
          <div className="respawn-overlay">
            <div className="respawn-message">YOU DIED</div>
            <button className="respawn-btn" onClick={() => engineRef.current?.respawn()}>
              RESPAWN
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RaycastingEngine;
