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
    startX: 60, // Center of 120px joystick base
    startY: 60,
    currentX: 60,
    currentY: 60,
    maxDistance: 40 // Allow movement within the base
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

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
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

    // Calculate distance from center
    const centerX = 60; // Center of 120px base
    const centerY = 60;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Limit to joystick base radius
    const maxDistance = joystickState.maxDistance;
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
      const normalizedY = clampedY / maxDistance;

      // Clear all movement keys first
      const keys = engineRef.current.inputHandler.keys;
      keys.w = false;
      keys.s = false;
      keys.a = false;
      keys.d = false;
      keys.ArrowLeft = false;
      keys.ArrowRight = false;

      // Set movement based on joystick position
      if (strafeMode) {
        // Strafe mode: X = strafe left/right, Y = forward/backward
        if (Math.abs(normalizedY) > 0.2) {
          keys.w = normalizedY < 0; // Forward
          keys.s = normalizedY > 0; // Backward
        }
        if (Math.abs(normalizedX) > 0.2) {
          keys.a = normalizedX < 0; // Strafe left
          keys.d = normalizedX > 0; // Strafe right
        }
      } else {
        // Normal mode: Y = forward/backward, X = turn left/right
        if (Math.abs(normalizedY) > 0.2) {
          keys.w = normalizedY < 0; // Forward
          keys.s = normalizedY > 0; // Backward
        }
        if (Math.abs(normalizedX) > 0.2) {
          keys.ArrowLeft = normalizedX < 0; // Turn left
          keys.ArrowRight = normalizedX > 0; // Turn right
        }
      }
    }
  };

  const handleJoystickEnd = (event) => {
    event.preventDefault();
    setJoystickState(prev => ({
      ...prev,
      active: false,
      currentX: 60, // Reset to center
      currentY: 60
    }));

    // Stop all movement
    if (engineRef.current && engineRef.current.inputHandler) {
      const keys = engineRef.current.inputHandler.keys;
      keys.w = false;
      keys.s = false;
      keys.a = false;
      keys.d = false;
      keys.ArrowLeft = false;
      keys.ArrowRight = false;
    }
  };

  const handleFire = () => {
    if (engineRef.current) {
      engineRef.current.renderer.triggerMuzzleFlash();
      engineRef.current.shoot();
    }
  };

  const handleStrafeToggle = () => {
    setStrafeMode(!strafeMode);
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
                  left: `${joystickState.currentX}px`,
                  top: `${joystickState.currentY}px`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: joystickState.active ? 'rgba(254, 95, 0, 1)' : 'rgba(254, 95, 0, 0.8)'
                }}
              />
              {/* Center indicator */}
              <div
                className="joystick-center"
                style={{
                  left: '60px',
                  top: '60px',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
            <div className="joystick-label">
              {strafeMode ? 'STRAFE MODE' : 'MOVE & TURN'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="action-btn shoot-btn"
              onTouchStart={handleFire}
              onMouseDown={handleFire}
            >
              FIRE
            </button>
            <button
              className={`action-btn strafe-btn ${strafeMode ? 'active' : ''}`}
              onTouchStart={handleStrafeToggle}
              onMouseDown={handleStrafeToggle}
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
