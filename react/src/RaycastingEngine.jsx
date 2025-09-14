import React, { useRef, useEffect, useState } from 'react';
import './RaycastingEngine.css';
import { Engine } from './engine/core/Engine.js';
import { DoomDemoScene } from './engine/demos/DoomDemo.js';
import LoadingScreen from './components/LoadingScreen.jsx';

const RaycastingEngine = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [gameState, setGameState] = useState({ health: 100, ammo: 50, level: 1, enemies: 0, score: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initEngine = async () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Create the advanced 3D game engine
        engineRef.current = new Engine(canvas, {
          targetFPS: 60,
          enablePhysics: true,
          debug: false
        });

        // Register and load the Doom demo scene
        engineRef.current.sceneManager.registerScene('DoomDemo', DoomDemoScene);
        await engineRef.current.sceneManager.loadScene('DoomDemo');

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
      engineRef.current.input.handleTouch(action, isStart);
    }
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" />
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
      </div>
    </>
  );
};

export default RaycastingEngine;
