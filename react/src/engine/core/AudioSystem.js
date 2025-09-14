/**
 * Audio System
 *
 * Lightweight audio management for embedded browsers.
 * Uses Web Audio API for optimal performance.
 */

export class AudioSystem {
  constructor(engine) {
    this.engine = engine;
    this.audioContext = null;
    this.sounds = new Map();
    this.music = null;
    this.masterVolume = 0.5;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.3;
    this.enabled = true;

    this.init();
  }

  async init() {
    try {
      // Create audio context on user interaction
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🔊 Audio System initialized');
    } catch (error) {
      console.warn('Audio not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Load sound effect
   */
  async loadSound(name, url) {
    if (!this.enabled) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound ${name}:`, error);
    }
  }

  /**
   * Play sound effect
   */
  playSound(name, options = {}) {
    if (!this.enabled || !this.sounds.has(name)) return;

    const {
      volume = this.sfxVolume,
      loop = false,
      playbackRate = 1
    } = options;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.sounds.get(name);
      source.loop = loop;
      source.playbackRate.value = playbackRate;

      gainNode.gain.value = volume * this.masterVolume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start();

      // Auto cleanup for non-looping sounds
      if (!loop) {
        source.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      }

      return { source, gainNode };
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }

  /**
   * Stop sound
   */
  stopSound(soundInstance) {
    if (soundInstance && soundInstance.source) {
      try {
        soundInstance.source.stop();
        soundInstance.source.disconnect();
        soundInstance.gainNode.disconnect();
      } catch (error) {
        // Sound may have already ended
      }
    }
  }

  /**
   * Play background music
   */
  playMusic(name, options = {}) {
    if (!this.enabled || !this.sounds.has(name)) return;

    // Stop current music
    this.stopMusic();

    const {
      volume = this.musicVolume,
      loop = true
    } = options;

    this.music = this.playSound(name, { volume, loop });
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.music) {
      this.stopSound(this.music);
      this.music = null;
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music && this.music.gainNode) {
      this.music.gainNode.gain.value = volume * this.masterVolume;
    }
  }

  /**
   * Resume audio context (required for some browsers)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    this.stopMusic();
    this.sounds.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  /**
   * Generate simple sound effects programmatically
   */
  generateTone(frequency, duration, type = 'sine') {
    if (!this.enabled) return;

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      switch (type) {
        case 'sine':
          data[i] = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          data[i] = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          data[i] = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'noise':
          data[i] = Math.random() * 2 - 1;
          break;
      }

      // Apply envelope
      const attack = 0.01;
      const release = 0.1;
      if (t < attack) {
        data[i] *= t / attack;
      } else if (t > duration - release) {
        data[i] *= (duration - t) / release;
      }
    }

    return buffer;
  }

  /**
   * Create and play procedural sound
   */
  playProceduralSound(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.enabled) return;

    const buffer = this.generateTone(frequency, duration, type);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume * this.masterVolume * this.sfxVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };

    return { source, gainNode };
  }
}
