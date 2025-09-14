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

  const handleTouch = (action, isStart) => {
    if (engineRef.current) {
      // Handle touch inputs through the engine
      switch (action) {
        case 'move_forward':
          if (isStart) engineRef.current.inputHandler?.startMoving('forward');
          else engineRef.current.inputHandler?.stopMoving('forward');
          break;
        case 'move_backward':
          if (isStart) engineRef.current.inputHandler?.startMoving('backward');
          else engineRef.current.inputHandler?.stopMoving('backward');
          break;
        case 'turn_left':
          if (isStart) engineRef.current.inputHandler?.startTurning('left');
          else engineRef.current.inputHandler?.stopTurning('left');
          break;
        case 'turn_right':
          if (isStart) engineRef.current.inputHandler?.startTurning('right');
          else engineRef.current.inputHandler?.stopTurning('right');
          break;
        case 'shoot':
          if (isStart) engineRef.current.shoot();
          break;
      }
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
          <div className="dpad">
            <button tabIndex="0" className="up" onTouchStart={() => handleTouch('move_forward', true)} onTouchEnd={() => handleTouch('move_forward', false)}
                    onMouseDown={() => handleTouch('move_forward', true)} onMouseUp={() => handleTouch('move_forward', false)}>↑</button>
            <button tabIndex="0" className="left" onTouchStart={() => handleTouch('turn_left', true)} onTouchEnd={() => handleTouch('turn_left', false)}
                    onMouseDown={() => handleTouch('turn_left', true)} onMouseUp={() => handleTouch('turn_left', false)}>←</button>
            <button tabIndex="0" className="right" onTouchStart={() => handleTouch('turn_right', true)} onTouchEnd={() => handleTouch('turn_right', false)}
                    onMouseDown={() => handleTouch('turn_right', true)} onMouseUp={() => handleTouch('turn_right', false)}>→</button>
            <button tabIndex="0" className="down" onTouchStart={() => handleTouch('move_backward', true)} onTouchEnd={() => handleTouch('move_backward', false)}
                    onMouseDown={() => handleTouch('move_backward', true)} onMouseUp={() => handleTouch('move_backward', false)}>↓</button>
          </div>
          <div className="action-buttons">
            <button tabIndex="0" className="shoot" onTouchStart={() => handleTouch('shoot', true)} onMouseDown={() => handleTouch('shoot', true)}>FIRE</button>
            <button tabIndex="0" className="use" onTouchStart={() => handleTouch('use', true)} onTouchEnd={() => handleTouch('use', false)}
                    onMouseDown={() => handleTouch('use', true)} onMouseUp={() => handleTouch('use', false)}>USE</button>
            <button tabIndex="0" className="strafe" onTouchStart={() => handleTouch('strafe', true)} onTouchEnd={() => handleTouch('strafe', false)}
                    onMouseDown={() => handleTouch('strafe', true)} onMouseUp={() => handleTouch('strafe', false)}>STRAFE</button>
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
