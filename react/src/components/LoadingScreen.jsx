import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <h1>Rabbit Raycast</h1>
          <div className="loading-spinner"></div>
        </div>
        <p className="loading-text">Initializing 3D Engine...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;