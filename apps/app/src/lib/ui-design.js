/**
 * UI Design Library for R1 Device (240x320px portrait screen)
 * Provides utilities and components for responsive design on small screens
 */

class UIDesign {
  constructor() {
    this.screenWidth = 240;
    this.screenHeight = 320;
    this.aspectRatio = 3/4;
    this.baseUnit = 'vw';
  }

  /**
   * Convert pixels to viewport width units
   * @param {number} px - Pixel value
   * @returns {string} - vw value
   */
  pxToVw(px) {
    return `${(px / this.screenWidth) * 100}${this.baseUnit}`;
  }

  /**
   * Get responsive font sizes
   * @returns {Object} - Font size definitions
   */
  getFontSizes() {
    return {
      title: '12.5vw',      // ~30px on 240px width
      large: '10vw',        // ~24px
      body: '8.33vw',       // ~20px
      small: '6.25vw',      // ~15px
      tiny: '5vw'           // ~12px
    };
  }

  /**
   * Get spacing values
   * @returns {Object} - Spacing definitions
   */
  getSpacing() {
    return {
      xs: '1.25vw',         // ~3px on 240px width
      sm: '2.5vw',          // ~6px
      md: '3.33vw',         // ~8px
      lg: '5vw',            // ~12px
      xl: '7.5vw',          // ~18px
      xxl: '10vw'           // ~24px
    };
  }

  /**
   * Get button dimensions
   * @returns {Object} - Button size definitions
   */
  getButtonSizes() {
    return {
      wide: {
        width: '80vw',    // ~192px on 240px width
        height: '15vw',   // ~36px
        fontSize: '8.33vw'
      },
      standard: {
        width: '45vw',    // ~108px on 240px width
        height: '15vw',   // ~36px
        fontSize: '8.33vw'
      },
      small: {
        width: '30vw',    // ~72px on 240px width
        height: '12vw',   // ~29px
        fontSize: '6.25vw'
      },
      round: {
        width: '20vw',    // ~48px on 240px width
        height: '20vw',   // ~48px
        borderRadius: '50%'
      }
    };
  }

  /**
   * Create a responsive container
   * @param {HTMLElement} element - Container element
   * @param {Object} options - Container options
   */
  createContainer(element, options = {}) {
    const defaults = {
      width: '100vw',
      height: '133.33vw',  // Maintains aspect ratio
      background: '#000000',
      padding: this.getSpacing().md
    };

    const settings = { ...defaults, ...options };

    Object.assign(element.style, {
      width: settings.width,
      height: settings.height,
      background: settings.background,
      padding: settings.padding,
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    });
  }

  /**
   * Create a touch-optimized button
   * @param {HTMLElement} button - Button element
   * @param {Object} options - Button options
   */
  createButton(button, options = {}) {
    const sizes = this.getButtonSizes();
    const defaults = {
      type: 'wide',
      background: '#FE5F00',
      color: '#FFFFFF',
      borderRadius: '50vw',
      active: true
    };

    const settings = { ...defaults, ...options };
    const size = sizes[settings.type] || sizes.standard;

    Object.assign(button.style, {
      width: size.width,
      height: size.height,
      fontSize: size.fontSize || this.getFontSizes().body,
      background: settings.active ? settings.background : '#333333',
      color: settings.color,
      border: 'none',
      borderRadius: settings.borderRadius,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent'
    });

    // Add touch feedback
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.95)';
    });

    button.addEventListener('touchend', () => {
      button.style.transform = 'scale(1)';
    });
  }

  /**
   * Create a responsive text element
   * @param {HTMLElement} element - Text element
   * @param {Object} options - Text options
   */
  createText(element, options = {}) {
    const fonts = this.getFontSizes();
    const defaults = {
      size: 'body',
      color: '#FFFFFF',
      align: 'center',
      weight: 'normal'
    };

    const settings = { ...defaults, ...options };

    Object.assign(element.style, {
      fontSize: fonts[settings.size] || settings.size,
      color: settings.color,
      textAlign: settings.align,
      fontWeight: settings.weight,
      lineHeight: '1.2',
      margin: '0',
      padding: '0'
    });
  }

  /**
   * Create a layout grid
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Grid options
   */
  createGrid(container, options = {}) {
    const defaults = {
      columns: 2,
      gap: this.getSpacing().md,
      alignItems: 'center',
      justifyItems: 'center'
    };

    const settings = { ...defaults, ...options };

    Object.assign(container.style, {
      display: 'grid',
      gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
      gap: settings.gap,
      alignItems: settings.alignItems,
      justifyItems: settings.justifyItems,
      width: '100%',
      height: '100%'
    });
  }

  /**
   * Apply theme colors
   * @returns {Object} - Color definitions
   */
  getColors() {
    return {
      background: '#000000',
      primary: '#FE5F00',      // Orange
      secondary: '#FFFFFF',    // White
      disabled: '#333333',     // Dark gray
      text: {
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        disabled: '#666666'
      },
      status: {
        success: '#00FF00',
        error: '#FF0000',
        warning: '#FFAA00',
        info: '#0099FF'
      }
    };
  }

  /**
   * Apply viewport meta tag
   */
  setupViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  }

  /**
   * Create animated transition between elements
   * @param {HTMLElement} fromElement - Element to transition from
   * @param {HTMLElement} toElement - Element to transition to
   * @param {string} type - Transition type: 'slide', 'fade', or 'none'
   * @param {number} duration - Duration in milliseconds
   */
  transition(fromElement, toElement, type = 'slide', duration = 300) {
    switch (type) {
      case 'slide':
        this.slideTransition(fromElement, toElement, duration);
        break;
      case 'fade':
        this.fadeTransition(fromElement, toElement, duration);
        break;
      case 'none':
        fromElement.style.display = 'none';
        toElement.style.display = 'block';
        break;
    }
  }

  /**
   * Slide transition effect
   * @private
   */
  slideTransition(fromElement, toElement, duration) {
    toElement.style.display = 'block';
    toElement.style.transform = 'translateX(100%)';
    toElement.style.transition = `transform ${duration}ms ease-in-out`;
    
    fromElement.style.transition = `transform ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      fromElement.style.transform = 'translateX(-100%)';
      toElement.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      fromElement.style.display = 'none';
      fromElement.style.transform = '';
      fromElement.style.transition = '';
      toElement.style.transition = '';
    }, duration + 10);
  }

  /**
   * Fade transition effect
   * @private
   */
  fadeTransition(fromElement, toElement, duration) {
    toElement.style.display = 'block';
    toElement.style.opacity = '0';
    toElement.style.transition = `opacity ${duration}ms ease-in-out`;
    
    fromElement.style.transition = `opacity ${duration}ms ease-in-out`;
    
    setTimeout(() => {
      fromElement.style.opacity = '0';
      toElement.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      fromElement.style.display = 'none';
      fromElement.style.opacity = '';
      fromElement.style.transition = '';
      toElement.style.transition = '';
    }, duration + 10);
  }
}

// Export singleton instance
const uiDesign = new UIDesign();

// Example usage:
// uiDesign.setupViewport();
// const button = document.createElement('button');
// uiDesign.createButton(button, { type: 'wide' });

export default uiDesign;