# UI Design Guide for R1 Device

## Overview

This guide explains how to design user interfaces for the R1 device's 240x320px webview screen. The design philosophy emphasizes simplicity, large touch targets, and viewport-relative sizing.

## Screen Specifications

- **Resolution**: 240x320 pixels
- **Aspect Ratio**: 3:4
- **Orientation**: Portrait (fixed)
- **Touch Input**: Capacitive touchscreen
- **Physical Controls**: Side button + scroll wheel

## Core Design Principles

### 1. Viewport-Relative Units
Always use `vw` (viewport width) units instead of pixels for responsive scaling:

```css
/* Bad - Fixed pixels */
.button { width: 256px; }

/* Good - Viewport relative */
.button { width: 80vw; }
```

### 2. Large Touch Targets
Minimum touch target size: 44x44 CSS pixels (18.33vw × 18.33vw on 240px width)

### 3. High Contrast
- Black background (#000000)
- White text (#FFFFFF)
- Orange accent (#FE5F00)

## Typography Scale

| Type | Size | Use Case |
|------|------|----------|
| Title | 12.5vw (~30px) | Main headings |
| Large | 10vw (~24px) | Section headers |
| Body | 8.33vw (~20px) | Primary content |
| Small | 6.25vw (~15px) | Secondary text |
| Tiny | 5vw (~12px) | Captions |

```css
.title {
  font-size: 12.5vw;
  font-weight: bold;
  text-align: center;
}

.body-text {
  font-size: 8.33vw;
  line-height: 1.2;
}
```

## Spacing System

| Size | Value | Use Case |
|------|-------|----------|
| xs | 1.25vw (~3px) | Tight spacing |
| sm | 2.5vw (~6px) | Component padding |
| md | 3.33vw (~8px) | Default spacing |
| lg | 5vw (~12px) | Section spacing |
| xl | 7.5vw (~18px) | Large gaps |
| xxl | 10vw (~24px) | Major sections |

## Button Styles

### Wide Button (Single Action)
```css
.button-wide {
  width: 80vw;          /* ~192px */
  height: 15vw;         /* ~36px */
  font-size: 8.33vw;    /* ~20px */
  background: #FE5F00;
  color: #FFFFFF;
  border-radius: 50vw;  /* Fully rounded */
  border: none;
  font-weight: bold;
}
```

### Standard Button (Multiple Actions)
```css
.button-standard {
  width: 45vw;          /* ~108px */
  height: 15vw;         /* ~36px */
  font-size: 8.33vw;
  background: #FE5F00;
  color: #FFFFFF;
  border-radius: 50vw;
}
```

### Small Button
```css
.button-small {
  width: 30vw;          /* ~72px */
  height: 12vw;         /* ~29px */
  font-size: 6.25vw;
  background: #FE5F00;
  color: #FFFFFF;
  border-radius: 50vw;
}
```

## Layout Patterns

### Full Screen Container
```css
.container {
  width: 100vw;
  height: 133.33vw;     /* 320px height on 240px width */
  background: #000000;
  padding: 3.33vw;
  box-sizing: border-box;
  overflow: hidden;
}
```

### Centered Content
```css
.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 5vw;
}
```

### Grid Layout
```css
.grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.33vw;
  padding: 5vw;
}
```

## Color Palette

### Primary Colors
- **Background**: #000000 (Black)
- **Primary**: #FE5F00 (Orange)
- **Text**: #FFFFFF (White)
- **Secondary**: #333333 (Dark Gray)

### Semantic Colors
- **Success**: #00FF00
- **Error**: #FF0000
- **Warning**: #FFAA00
- **Info**: #0099FF
- **Disabled**: #666666

## Using the Library

```javascript
import uiDesign from './ui-design.js';

// Setup viewport
uiDesign.setupViewport();

// Create container
const container = document.getElementById('app');
uiDesign.createContainer(container, {
  background: '#000000',
  padding: uiDesign.getSpacing().md
});

// Create button
const button = document.createElement('button');
uiDesign.createButton(button, {
  type: 'wide',
  background: '#FE5F00',
  active: true
});
button.textContent = 'Press Me';
container.appendChild(button);

// Create text
const title = document.createElement('h1');
uiDesign.createText(title, {
  size: 'title',
  color: '#FFFFFF',
  align: 'center'
});
title.textContent = 'Welcome';
container.appendChild(title);

// Get design tokens
const colors = uiDesign.getColors();
const spacing = uiDesign.getSpacing();
const fonts = uiDesign.getFontSizes();
const buttons = uiDesign.getButtonSizes();
```

## Common UI Components

### List Item
```html
<div class="list-item">
  <span class="item-text">Item Name</span>
  <span class="item-value">Value</span>
</div>
```

```css
.list-item {
  display: flex;
  justify-content: space-between;
  padding: 3.33vw 5vw;
  border-bottom: 0.3vw solid #333;
  font-size: 6.25vw;
}
```

### Progress Bar
```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 60%"></div>
</div>
```

```css
.progress-bar {
  width: 80vw;
  height: 3vw;
  background: #333;
  border-radius: 1.5vw;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #FE5F00;
  transition: width 0.3s ease;
}
```

### Toggle Switch
```html
<label class="toggle">
  <input type="checkbox">
  <span class="toggle-slider"></span>
</label>
```

```css
.toggle {
  position: relative;
  width: 15vw;
  height: 8vw;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  background: #333;
  border-radius: 4vw;
  transition: 0.3s;
}

input:checked + .toggle-slider {
  background: #FE5F00;
}
```

## Animation Guidelines

Keep animations minimal and fast (200-300ms):

```css
.button {
  transition: transform 0.2s ease, background 0.2s ease;
}

.button:active {
  transform: scale(0.95);
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Responsive Utilities

### Convert Pixels to VW
```javascript
// Convert design pixel values to vw
const spacing = uiDesign.pxToVw(12); // Returns "5vw"
const fontSize = uiDesign.pxToVw(20); // Returns "8.33vw"
```

### Create Responsive Grid
```javascript
const grid = document.createElement('div');
uiDesign.createGrid(grid, {
  columns: 2,
  gap: uiDesign.getSpacing().md,
  alignItems: 'center'
});
```

### Transitions Between Views
```javascript
// Slide transition
uiDesign.transition(currentView, nextView, 'slide', 300);

// Fade transition
uiDesign.transition(currentView, nextView, 'fade', 200);

// No transition
uiDesign.transition(currentView, nextView, 'none');
```

## Performance Tips

1. **Minimize DOM elements**: Keep total element count under 50
2. **Use CSS transforms**: For animations, not position changes
3. **Optimize images**: Use WebP format, max 240px width
4. **Batch DOM updates**: Group multiple changes together
5. **Avoid complex shadows**: Use simple borders instead

## Accessibility

1. **Touch targets**: Minimum 18.33vw × 18.33vw (44×44 CSS pixels on 240px width)
2. **Contrast ratios**: Maintain WCAG AAA standards
3. **Focus indicators**: Clear visual states for all interactive elements
4. **Loading feedback**: Always show progress for operations > 300ms
5. **Error messages**: Clear, actionable error text

## Testing Guidelines

1. Test on actual 240×320px device
2. Use Chrome DevTools responsive mode
3. Verify all touch targets are easily tappable
4. Check text readability at arm's length
5. Test with both touch and physical controls