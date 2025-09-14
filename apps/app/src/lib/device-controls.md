# Device Controls Guide

## Overview

This guide explains how to handle scroll wheel and side button interactions on the R1 device's 240x320px portrait screen webview.

## Hardware Controls

### Side Button
- Physical button on the R1 device
- Triggers `sideClick` custom event
- Primary action button for the interface

### Scroll Wheel
- Physical scroll wheel on the R1 device
- Generates `scrollUp` and `scrollDown` custom events from Flutter
- **Flutter automatically scrolls the WebView by 80 pixels (animated over 100ms)**
- Your event handlers run in addition to the automatic scrolling
- Automatic scrolling includes edge detection to prevent overscrolling
- Unlike the side button (which respects `lockPtt`), scroll wheel always works the same way

## Event Handling

### Side Button Events

The side button dispatches a custom `sideClick` event:

```javascript
window.addEventListener('sideClick', (event) => {
  console.log('Side button clicked');
  // Your action here
});
```

### Keyboard Fallback

During development, the space bar simulates the side button:

```javascript
// This is automatically set up by the library
// Press spacebar to simulate side button click
```

### Scroll Wheel Events

The R1 device has a physical scroll wheel. When the user rotates the wheel:
1. Flutter automatically scrolls the WebView content by 80 pixels (animated)
2. Flutter dispatches custom JavaScript events that you can listen for

```javascript
// Listen for R1 scroll wheel up events
window.addEventListener('scrollUp', (event) => {
  console.log('Scroll wheel rotated up');
  // Handle scroll up action - no need to manually scroll!
  // Flutter has already scrolled the content up by 80px
});

// Listen for R1 scroll wheel down events
window.addEventListener('scrollDown', (event) => {
  console.log('Scroll wheel rotated down');
  // Handle scroll down action - no need to manually scroll!
  // Flutter has already scrolled the content down by 80px
});
```

**Important Notes:**
- The automatic scrolling happens immediately when the wheel is used
- Your event handlers can add custom behavior on top of the scrolling
- You don't need to call `window.scrollBy()` or similar - it's already done
- The events have no additional data - they simply indicate direction

## Using the Library

The device-controls library provides a convenient wrapper around the native events:

```javascript
import deviceControls from './device-controls.js';

// Initialize with options
deviceControls.init({
  sideButtonEnabled: true,
  scrollWheelEnabled: true,
  keyboardFallback: true  // Enable spacebar as side button
});

// Register event handlers
deviceControls.on('sideButton', (event) => {
  console.log('Side button pressed');
});

// The library wraps the native scrollUp/scrollDown events
deviceControls.on('scrollWheel', (data) => {
  console.log('Scrolled', data.direction);
  // data.direction: 'up' or 'down'
  // data.event: original scroll event
});

// Control enable/disable state
deviceControls.setSideButtonEnabled(false);
deviceControls.setScrollWheelEnabled(false);

// Programmatically trigger side button (for testing)
deviceControls.triggerSideButton();
```

**Note:** You can also listen to the native events directly without using this library:

```javascript
// Native event handling (alternative approach)
window.addEventListener('sideClick', () => {
  console.log('Side button clicked');
});

window.addEventListener('scrollUp', () => {
  console.log('Scrolled up');
});

window.addEventListener('scrollDown', () => {
  console.log('Scrolled down');
});
```

## Example Use Cases

### 1. Game Controls

**Side-scrolling game with jump mechanic:**

```javascript
import deviceControls from './device-controls.js';

class Game {
  constructor() {
    this.player = { x: 50, y: 100, jumping: false };
    deviceControls.init();
    
    // Side button = jump
    deviceControls.on('sideButton', () => {
      if (!this.player.jumping) {
        this.jump();
      }
    });
    
    // Scroll wheel = move left/right
    deviceControls.on('scrollWheel', (data) => {
      if (data.direction === 'down') {
        this.player.x = Math.min(this.player.x + 10, 300);
      } else {
        this.player.x = Math.max(this.player.x - 10, 0);
      }
      this.render();
    });
  }
  
  jump() {
    this.player.jumping = true;
    // Jump animation logic
  }
}
```

### 2. Menu Navigation

**Scrollable menu with item selection:**

```javascript
import deviceControls from './device-controls.js';

class MenuSystem {
  constructor() {
    this.menuItems = [
      'New Game',
      'Load Game',
      'Settings',
      'About',
      'Exit'
    ];
    this.selectedIndex = 0;
    
    deviceControls.init();
    
    // Scroll wheel = navigate menu
    deviceControls.on('scrollWheel', (data) => {
      if (data.direction === 'down') {
        this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      } else {
        this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      }
      this.updateDisplay();
    });
    
    // Side button = select item
    deviceControls.on('sideButton', () => {
      this.selectMenuItem(this.selectedIndex);
    });
  }
  
  updateDisplay() {
    // Update visual selection indicator
    const items = document.querySelectorAll('.menu-item');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
    });
  }
  
  selectMenuItem(index) {
    console.log('Selected:', this.menuItems[index]);
    // Handle menu selection
  }
}
```

### 3. Media Player Controls

**Video/audio player with volume and playback control:**

```javascript
import deviceControls from './device-controls.js';

class MediaPlayer {
  constructor() {
    this.video = document.querySelector('video');
    this.volume = 0.5;
    this.playing = false;
    
    deviceControls.init();
    
    // Side button = play/pause toggle
    deviceControls.on('sideButton', () => {
      if (this.playing) {
        this.video.pause();
      } else {
        this.video.play();
      }
      this.playing = !this.playing;
    });
    
    // Scroll wheel = volume control
    deviceControls.on('scrollWheel', (data) => {
      const step = 0.05;
      if (data.direction === 'up') {
        this.volume = Math.min(this.volume + step, 1);
      } else {
        this.volume = Math.max(this.volume - step, 0);
      }
      this.video.volume = this.volume;
      this.updateVolumeDisplay();
    });
  }
  
  updateVolumeDisplay() {
    const volumeBar = document.querySelector('.volume-bar');
    volumeBar.style.width = `${this.volume * 100}%`;
  }
}
```

## Best Practices

1. **Don't Manual Scroll**: Flutter already scrolls the WebView - add custom behavior instead
2. **Visual Feedback**: Provide immediate visual feedback for button presses
3. **Debouncing**: Consider debouncing rapid scroll wheel inputs
4. **Accessibility**: Maintain keyboard fallbacks for testing
5. **State Management**: Keep handlers simple and delegate to your app logic
6. **Edge Detection**: Flutter handles edge detection, so you don't need to check scroll bounds

## Advanced Patterns

### Scroll Acceleration

```javascript
let scrollVelocity = 0;
let lastScrollTime = Date.now();

deviceControls.on('scrollWheel', (data) => {
  const now = Date.now();
  const timeDelta = now - lastScrollTime;
  
  // Increase velocity for rapid scrolling
  if (timeDelta < 100) {
    scrollVelocity = Math.min(scrollVelocity + 0.5, 5);
  } else {
    scrollVelocity = 1;
  }
  
  const scrollAmount = scrollVelocity * (data.direction === 'down' ? 1 : -1);
  // Apply accelerated scrolling
  
  lastScrollTime = now;
});
```

### Long Press Detection

```javascript
let buttonPressStart = 0;
let longPressTimer = null;

window.addEventListener('sideClick', (event) => {
  // Note: This is a simplified example
  // Real implementation would need mousedown/up events
  
  buttonPressStart = Date.now();
  
  longPressTimer = setTimeout(() => {
    console.log('Long press detected');
    // Handle long press action
  }, 500);
});
```

## Debugging Tips

1. Use Chrome DevTools with device emulation
2. Log all control events during development
3. Test with keyboard fallbacks first
4. Verify event listeners are properly attached
5. Monitor event firing rates for performance