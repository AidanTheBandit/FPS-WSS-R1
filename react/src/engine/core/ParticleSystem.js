/**
 * Particle System
 *
 * Lightweight particle effects for embedded browsers.
 * Optimized for performance with object pooling.
 */

export class ParticleSystem {
  constructor(engine) {
    this.engine = engine;
    this.particles = [];
    this.pool = [];
    this.maxParticles = 50;
  }

  /**
   * Create particle
   */
  createParticle(x, y, options = {}) {
    const {
      vx = 0,
      vy = 0,
      life = 60,
      size = 2,
      color = '#fff',
      gravity = 0,
      fade = true
    } = options;

    let particle;

    // Use pooled particle if available
    if (this.pool.length > 0) {
      particle = this.pool.pop();
      Object.assign(particle, { x, y, vx, vy, life, maxLife: life, size, color, gravity, fade, active: true });
    } else if (this.particles.length < this.maxParticles) {
      particle = {
        x, y, vx, vy, life, maxLife: life, size, color, gravity, fade, active: true
      };
      this.particles.push(particle);
    } else {
      return null; // Max particles reached
    }

    return particle;
  }

  /**
   * Update particles
   */
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      if (!particle.active) continue;

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Apply gravity
      particle.vy += particle.gravity * deltaTime;

      // Update life
      particle.life -= deltaTime;

      // Deactivate dead particles
      if (particle.life <= 0) {
        particle.active = false;
        this.pool.push(particle);
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render particles
   */
  render(ctx) {
    ctx.save();

    for (const particle of this.particles) {
      if (!particle.active) continue;

      const alpha = particle.fade ? particle.life / particle.maxLife : 1;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
    }

    ctx.restore();
  }

  /**
   * Create muzzle flash effect
   */
  createMuzzleFlash(x, y, angle) {
    const numParticles = 8;

    for (let i = 0; i < numParticles; i++) {
      const spread = (Math.random() - 0.5) * Math.PI / 4;
      const speed = Math.random() * 2 + 1;
      const vx = Math.cos(angle + spread) * speed;
      const vy = Math.sin(angle + spread) * speed;

      this.createParticle(x, y, {
        vx, vy,
        life: 15 + Math.random() * 10,
        size: 1 + Math.random() * 2,
        color: '#ffff00',
        gravity: 0.1,
        fade: true
      });
    }
  }

  /**
   * Create blood splatter effect
   */
  createBloodSplatter(x, y) {
    const numParticles = 6;

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.createParticle(x, y, {
        vx, vy,
        life: 20 + Math.random() * 15,
        size: 1 + Math.random(),
        color: '#ff0000',
        gravity: 0.2,
        fade: true
      });
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    for (const particle of this.particles) {
      particle.active = false;
      this.pool.push(particle);
    }
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getParticleCount() {
    return this.particles.length;
  }
}
