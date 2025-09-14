# Flutter Channel Communication Guide

## Overview

This guide explains how to communicate between the WebView and the Flutter app in the R1 device using the GenerativeUI WebView JavaScript API. The flutter-channel library provides a simple interface for bidirectional communication.

## Architecture

The communication uses Flutter's JavaScript injection mechanism:
- Flutter injects handler objects directly into the WebView's `window` object
- WebView sends messages to Flutter via `postMessage()` calls
- Messages can be any JSON-serializable data
- Flutter can send messages back via `window.onPluginMessage`

## Available Handlers

### 1. **FlutterButtonHandler**
Sends messages to the WebSocket with the `genUI` key.

```javascript
window.FlutterButtonHandler.postMessage("your message here");
```

### 2. **PluginMessageHandler**
Sends structured messages with the `pluginMessage` key. **REQUIRED**: Messages must include a `message` field.

```javascript
window.PluginMessageHandler.postMessage(JSON.stringify({
  message: "your plugin message",    // REQUIRED
  pluginId: "com.example.plugin",   // optional
  imageBase64: "iVBORw0KG..."       // optional
}));
```

### 3. **TouchEventHandler**
Sends touch event data to trigger native touch events.

```javascript
window.TouchEventHandler.postMessage(JSON.stringify({
  type: 'tap',  // 'tap', 'down', 'up', 'move'
  x: 120,
  y: 160
}));
```

### 4. **closeWebView**
Closes the WebView and returns to home screen.

```javascript
window.closeWebView.postMessage(""); // Message content is ignored
```

## Sending Messages

### General Purpose Messages
Send any data via FlutterButtonHandler:
```javascript
// Send simple string
flutterChannel.sendMessage('Hello from WebView!');

// Send structured data
flutterChannel.sendData({
  type: "user_action",
  action: "button_click",
  timestamp: Date.now()
});

// Send game state
flutterChannel.sendData({
  gameScore: 1500,
  level: 7,
  achievements: ["speed_demon", "perfect_score"]
});
```

### Plugin Messages
Send plugin-specific messages with required `message` field:
```javascript
// Simple plugin message
flutterChannel.sendPluginMessage({ 
  message: "plugin_initialized"
});

// With plugin identification
flutterChannel.sendPluginMessage({ 
  message: "processing_complete",
  pluginId: "com.example.processor"
});

// With image data
flutterChannel.sendPluginMessage({
  message: "image_captured",
  pluginId: "com.example.camera",
  imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
});
```

### Touch Events
Simulate touch interactions:
```javascript
// Send a tap
flutterChannel.sendTouchEvent({
  type: 'tap',
  x: 120,
  y: 160
});

// Simulate swipe gesture
function simulateSwipe(startX, startY, endX, endY) {
  // Touch down
  flutterChannel.sendTouchEvent({ type: 'down', x: startX, y: startY });
  
  // Move
  setTimeout(() => {
    flutterChannel.sendTouchEvent({ type: 'move', x: endX, y: endY });
  }, 50);
  
  // Touch up
  setTimeout(() => {
    flutterChannel.sendTouchEvent({ type: 'up', x: endX, y: endY });
  }, 100);
}
```

## Receiving Messages from Flutter

### Plugin Messages
Handle incoming plugin messages:
```javascript
// Register handler
flutterChannel.onPluginMessage((data) => {
  console.log('Received plugin message:', data);
  
  // Handle based on content
  if (data.action === 'updateContent') {
    document.getElementById('content').innerHTML = data.html;
  }
});

// Or use window.onPluginMessage directly
window.onPluginMessage = function(data) {
  console.log('Received:', data);
};
```

### Side Button Events
Listen for side button clicks (when lockPtt is enabled):
```javascript
flutterChannel.onSideClick(() => {
  console.log('Side button clicked');
  // Handle back action or other logic
});
```

## Complete Implementation Example

```javascript
import flutterChannel from './lib/flutter-channel.js';
import deviceControls from './lib/device-controls.js';

// Initialize device controls
deviceControls.init();

// Check Flutter availability
if (flutterChannel.isFlutterAvailable) {
  // Send initialization message
  flutterChannel.sendPluginMessage({
    message: 'plugin_initialized',
    pluginId: 'com.example.myapp'
  });
}

// Handle device events
deviceControls.on('sideButton', () => {
  // Send simple message
  flutterChannel.sendMessage('Side button pressed!');
  
  // Or send structured data
  flutterChannel.sendData({
    type: "device_event",
    event: "side_button_pressed",
    timestamp: Date.now()
  });
});

// Handle scroll events
deviceControls.on('scrollWheel', (data) => {
  flutterChannel.sendData({
    type: "device_event",
    event: "scroll",
    direction: data.direction
  });
});

// Listen for plugin messages
flutterChannel.onPluginMessage((data) => {
  console.log('Received:', data);
  
  if (data.command === 'capture') {
    captureAndSendImage();
  }
});

// Function to capture and send image
function captureAndSendImage() {
  const canvas = document.querySelector('canvas');
  const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
  
  flutterChannel.sendPluginMessage({
    message: 'image_captured',
    pluginId: 'com.example.myapp',
    imageBase64: imageBase64
  });
}

// Close button handler
document.getElementById('closeButton')?.addEventListener('click', () => {
  flutterChannel.closeWebView();
});
```

## Best Practices

1. **Validate plugin messages**: Always include the required `message` field
2. **Check availability**: Verify handlers exist before using them
3. **Error handling**: Wrap postMessage calls in try-catch blocks
4. **Message structure**: Use consistent message formats with type fields
5. **Keep payloads reasonable**: Very large messages may impact performance
6. **Use event delegation**: For better performance with many interactive elements

## Common Patterns

### State Synchronization
```javascript
// Send periodic state updates
setInterval(() => {
  flutterChannel.sendData({
    type: 'state_sync',
    gameState: getCurrentGameState(),
    timestamp: Date.now()
  });
}, 1000);
```

### Error Reporting
```javascript
window.addEventListener('error', (event) => {
  flutterChannel.sendData({
    type: 'error',
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error?.stack
  });
});
```

### Form Handling
```javascript
document.getElementById('myForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  flutterChannel.sendData({
    type: 'form_submit',
    formId: 'myForm',
    data: data
  });
});
```

## Debugging Tips

1. **Console logging**: All console.log messages appear in Flutter console
2. **Message validation**: Log all sent/received messages in development
3. **Handler checks**: Use `flutterChannel.isFlutterAvailable` to verify environment
4. **Test offline**: Handle cases where Flutter handlers aren't available

## Message Format Reference

### FlutterButtonHandler Format
```javascript
// String message
"simple message"

// JSON object (will be stringified)
{
  type: "event",
  data: "value"
}
```

### PluginMessageHandler Format
```javascript
{
  message: "required field",      // REQUIRED
  pluginId: "optional.id",       // Optional
  imageBase64: "base64data"      // Optional
}
```

### TouchEventHandler Format
```javascript
{
  type: "tap",  // Required: 'tap', 'down', 'up', 'move'
  x: 100,       // Required: X coordinate
  y: 200        // Required: Y coordinate
}
```