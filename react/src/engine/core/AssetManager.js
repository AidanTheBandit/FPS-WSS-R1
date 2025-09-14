/**
 * Asset Manager
 *
 * Handles loading, caching, and management of game assets:
 * - Images/Textures
 * - Audio files
 * - JSON data
 * - Text files
 *
 * Provides async loading with progress tracking and caching.
 */

export class AssetManager {
  constructor(engine) {
    this.engine = engine;
    this.assets = new Map();
    this.loadingQueue = [];
    this.isLoading = false;
    this.loadProgress = 0;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
  }

  init(engine) {
    this.engine = engine;
    console.log('📦 Asset Manager initialized');
  }

  update(deltaTime) {
    // Handle async loading progress
  }

  /**
   * Load a single asset
   */
  async loadAsset(key, url, type = 'auto') {
    if (this.assets.has(key)) {
      return this.assets.get(key);
    }

    try {
      let asset;

      if (type === 'auto') {
        type = this.inferAssetType(url);
      }

      switch (type) {
        case 'image':
          asset = await this.loadImage(url);
          break;
        case 'audio':
          asset = await this.loadAudio(url);
          break;
        case 'json':
          asset = await this.loadJSON(url);
          break;
        case 'text':
          asset = await this.loadText(url);
          break;
        default:
          throw new Error(`Unknown asset type: ${type}`);
      }

      this.assets.set(key, asset);
      console.log(`📦 Asset loaded: ${key} (${type})`);
      return asset;

    } catch (error) {
      console.error(`Failed to load asset ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load multiple assets
   */
  async loadAssets(assetList) {
    const promises = assetList.map(asset =>
      this.loadAsset(asset.key, asset.url, asset.type)
    );

    try {
      await Promise.all(promises);
      console.log(`📦 Loaded ${assetList.length} assets`);
    } catch (error) {
      console.error('Failed to load assets:', error);
      throw error;
    }
  }

  /**
   * Load image asset
   */
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  /**
   * Load audio asset
   */
  async loadAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
      audio.src = url;
      audio.load();
    });
  }

  /**
   * Load JSON asset
   */
  async loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Load text asset
   */
  async loadText(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Infer asset type from URL
   */
  inferAssetType(url) {
    const extension = url.split('.').pop().toLowerCase();

    switch (extension) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
        return 'image';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'json':
        return 'json';
      case 'txt':
      case 'md':
        return 'text';
      default:
        return 'text';
    }
  }

  /**
   * Get loaded asset
   */
  getAsset(key) {
    return this.assets.get(key);
  }

  /**
   * Check if asset is loaded
   */
  hasAsset(key) {
    return this.assets.has(key);
  }

  /**
   * Remove asset from cache
   */
  removeAsset(key) {
    const asset = this.assets.get(key);
    if (asset) {
      this.assets.delete(key);

      // Cleanup based on asset type
      if (asset instanceof Image) {
        asset.src = '';
      } else if (asset instanceof Audio) {
        asset.src = '';
        asset.load();
      }
    }
  }

  /**
   * Clear all assets
   */
  clearAssets() {
    for (const [key] of this.assets) {
      this.removeAsset(key);
    }
    this.assets.clear();
  }

  /**
   * Get asset loading progress
   */
  getLoadProgress() {
    return {
      loaded: this.assets.size,
      total: this.assets.size + this.loadingQueue.length,
      progress: this.loadProgress
    };
  }

  /**
   * Set progress callback
   */
  onProgress(callback) {
    this.onProgressCallback = callback;
  }

  /**
   * Set completion callback
   */
  onComplete(callback) {
    this.onCompleteCallback = callback;
  }

  /**
   * Get asset statistics
   */
  getStats() {
    const stats = {
      totalAssets: this.assets.size,
      assetTypes: {},
      memoryUsage: 0
    };

    for (const [key, asset] of this.assets) {
      const type = this.getAssetType(asset);
      stats.assetTypes[type] = (stats.assetTypes[type] || 0) + 1;

      // Rough memory estimation
      if (asset instanceof Image) {
        stats.memoryUsage += (asset.width * asset.height * 4); // RGBA
      } else if (asset instanceof Audio) {
        stats.memoryUsage += asset.duration * 44100 * 2 * 2; // Rough audio size
      }
    }

    return stats;
  }

  /**
   * Get asset type for statistics
   */
  getAssetType(asset) {
    if (asset instanceof Image) return 'image';
    if (asset instanceof Audio) return 'audio';
    if (typeof asset === 'object') return 'json';
    if (typeof asset === 'string') return 'text';
    return 'unknown';
  }

  /**
   * Preload critical assets
   */
  async preloadCritical(assets) {
    console.log('🔥 Preloading critical assets...');
    await this.loadAssets(assets);
    console.log('✅ Critical assets loaded');
  }
}
