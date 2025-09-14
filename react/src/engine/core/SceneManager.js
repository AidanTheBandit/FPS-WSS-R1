/**
 * Scene Manager
 *
 * Manages game scenes, entities, and scene transitions.
 * Provides scene lifecycle management and entity organization.
 */

export class SceneManager {
  constructor(engine) {
    this.engine = engine;
    this.scenes = new Map();
    this.currentScene = null;
    this.sceneStack = [];
    this.isTransitioning = false;
  }

  init(engine) {
    this.engine = engine;
    console.log('🎭 Scene Manager initialized');
  }

  /**
   * Register a scene
   */
  registerScene(name, sceneClass) {
    this.scenes.set(name, sceneClass);
    console.log(`📄 Scene registered: ${name}`);
  }

  /**
   * Load a scene by name
   */
  async loadScene(name, transitionData = {}) {
    if (this.isTransitioning) {
      console.warn('Scene transition already in progress');
      return false;
    }

    const sceneClass = this.scenes.get(name);
    if (!sceneClass) {
      console.error(`Scene not found: ${name}`);
      return false;
    }

    this.isTransitioning = true;

    try {
      // Exit current scene
      if (this.currentScene) {
        await this.currentScene.exit();
        this.sceneStack.push(this.currentScene);
      }

      // Create and enter new scene
      this.currentScene = new sceneClass(this.engine);
      await this.currentScene.enter(transitionData);

      console.log(`🎭 Scene loaded: ${name}`);
      return true;

    } catch (error) {
      console.error(`Failed to load scene ${name}:`, error);
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Unload current scene
   */
  async unloadScene() {
    if (!this.currentScene) return;

    try {
      await this.currentScene.exit();
      this.currentScene = null;
      console.log('🎭 Scene unloaded');
    } catch (error) {
      console.error('Failed to unload scene:', error);
    }
  }

  /**
   * Go back to previous scene
   */
  async goBack(transitionData = {}) {
    if (this.sceneStack.length === 0) {
      console.warn('No previous scene to go back to');
      return false;
    }

    const previousScene = this.sceneStack.pop();
    return this.loadScene(previousScene.name, transitionData);
  }

  /**
   * Get scene by name
   */
  getScene(name) {
    return this.scenes.get(name);
  }

  /**
   * Check if scene exists
   */
  hasScene(name) {
    return this.scenes.has(name);
  }

  /**
   * Get all registered scene names
   */
  getSceneNames() {
    return Array.from(this.scenes.keys());
  }

  /**
   * Update current scene
   */
  update(deltaTime) {
    if (this.currentScene && !this.isTransitioning) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * Render current scene
   */
  render(renderer) {
    if (this.currentScene && !this.isTransitioning) {
      this.currentScene.render(renderer);
    }
  }

  /**
   * Get scene statistics
   */
  getStats() {
    return {
      currentScene: this.currentScene?.name || null,
      totalScenes: this.scenes.size,
      sceneStackSize: this.sceneStack.length,
      isTransitioning: this.isTransitioning
    };
  }
}

/**
 * Base Scene class
 *
 * All game scenes should extend this class.
 * Provides lifecycle methods and entity management.
 */
export class Scene {
  constructor(engine, name = 'Unnamed Scene') {
    this.engine = engine;
    this.name = name;
    this.entities = new Set();
    this.systems = new Map();
    this.isActive = false;
  }

  /**
   * Called when scene is entered
   */
  async enter(transitionData = {}) {
    this.isActive = true;
    console.log(`🎭 Entering scene: ${this.name}`);
    await this.onEnter(transitionData);
  }

  /**
   * Called when scene is exited
   */
  async exit() {
    this.isActive = false;
    console.log(`🎭 Exiting scene: ${this.name}`);

    // Cleanup entities
    for (const entity of this.entities) {
      await entity.destroy();
    }
    this.entities.clear();

    await this.onExit();
  }

  /**
   * Update scene logic
   */
  update(deltaTime) {
    if (!this.isActive) return;

    // Update entities
    for (const entity of this.entities) {
      entity.update(deltaTime);
    }

    // Update scene-specific logic
    this.onUpdate(deltaTime);
  }

  /**
   * Render scene
   */
  render(renderer) {
    if (!this.isActive) return;

    // Render entities
    for (const entity of this.entities) {
      entity.render(renderer);
    }

    // Render scene-specific graphics
    this.onRender(renderer);
  }

  /**
   * Add entity to scene
   */
  addEntity(entity) {
    this.entities.add(entity);
    entity.scene = this;
    entity.onAddedToScene();
  }

  /**
   * Remove entity from scene
   */
  removeEntity(entity) {
    this.entities.delete(entity);
    entity.scene = null;
    entity.onRemovedFromScene();
  }

  /**
   * Find entities by component type
   */
  findEntitiesWithComponent(componentType) {
    return Array.from(this.entities).filter(entity =>
      entity.hasComponent(componentType)
    );
  }

  /**
   * Find first entity with component type
   */
  findEntityWithComponent(componentType) {
    return Array.from(this.entities).find(entity =>
      entity.hasComponent(componentType)
    );
  }

  /**
   * Lifecycle methods to override
   */
  async onEnter(transitionData = {}) {}
  async onExit() {}
  onUpdate(deltaTime) {}
  onRender(renderer) {}

  /**
   * Get scene statistics
   */
  getStats() {
    return {
      name: this.name,
      entityCount: this.entities.size,
      isActive: this.isActive
    };
  }
}
