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

    // Calculate distance from center (60, 60 for 120px base)
    const centerX = 60;
    const centerY = 60;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Limit to joystick base radius
    const maxDistance = 40; // Smaller than 50 to stay within visual base
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

      // Set joystick state directly
      engineRef.current.inputHandler.setJoystickState(true, normalizedX, normalizedY);
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
      // Deactivate joystick
      engineRef.current.inputHandler.setJoystickState(false, 0, 0);
    }
  };

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
          <div className={`connection-status ${gameState.isConnected ? 'connected' : 'disconnected'}`}>
            {gameState.isConnected ? '🟢 Online' : '🔴 Offline'}
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
              {strafeMode ? 'STRAFE' : 'MOVE'}
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
