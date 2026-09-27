/**
 * ECHO - Particle System & Screen Effects Engine
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.shakeDecay = 0.9;
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShake > 0.05) {
      this.screenShake *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.screenShake = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }

    // Update particles (with performance cap for student laptops)
    if (this.particles.length > 250) {
      this.particles.splice(0, this.particles.length - 250);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(0, p.startSize * (p.life / p.maxLife));
      p.alpha = (p.life / p.maxLife) * (p.startAlpha || 1);

      if (p.angularVelocity) {
        p.angle = (p.angle || 0) + p.angularVelocity * dt;
      }
    }
  }

  triggerScreenShake(intensity = 8) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  getShakeOffset() {
    if (this.screenShake <= 0) return { x: 0, y: 0 };
    const angle = Math.random() * Math.PI * 2;
    const dist = (Math.random() * 0.5 + 0.5) * this.screenShake;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist
    };
  }

  // Player thrust trail
  emitPlayerTrail(x, y, angle) {
    const spread = 0.4;
    const backAngle = angle + Math.PI + (Math.random() - 0.5) * spread;
    const speed = 40 + Math.random() * 60;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(backAngle) * speed,
      vy: Math.sin(backAngle) * speed,
      size: 4 + Math.random() * 3,
      startSize: 4 + Math.random() * 3,
      color: '#00f0ff',
      glowColor: 'rgba(0, 240, 255, 0.4)',
      life: 0.35 + Math.random() * 0.2,
      maxLife: 0.5,
      type: 'circle'
    });
  }

  // Echo temporal glitch static
  emitEchoGlitch(x, y) {
    const count = 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        startSize: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ff2a6d' : '#05d9e8',
        glowColor: 'rgba(255, 42, 109, 0.6)',
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.35,
        type: 'digital' // square glitch
      });
    }
  }

  // Orb pickup golden explosion
  emitOrbBurst(x, y) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 70 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        startSize: 5 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#ffe600' : '#ffffff',
        glowColor: 'rgba(255, 230, 0, 0.8)',
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.9,
        type: 'spark'
      });
    }
  }

  // Paradox collision explosion
  emitParadoxExplosion(x, y) {
    this.triggerScreenShake(14);
    const count = 45;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        startSize: 6 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#ff2a6d' : (Math.random() > 0.5 ? '#ffffff' : '#00f0ff'),
        glowColor: 'rgba(255, 42, 109, 0.9)',
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.1,
        type: 'spark'
      });
    }
  }

  // Active portal vortex intake
  emitPortalVortex(x, y, radius = 28) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius + 25 + Math.random() * 20;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;

    // Spiral inward velocity vector
    const toCenterAngle = Math.atan2(y - py, x - px);
    const swirlAngle = toCenterAngle + Math.PI / 3; // inward spiral
    const speed = 50 + Math.random() * 40;

    this.particles.push({
      x: px,
      y: py,
      vx: Math.cos(swirlAngle) * speed,
      vy: Math.sin(swirlAngle) * speed,
      size: 2.5 + Math.random() * 2.5,
      startSize: 3,
      color: Math.random() > 0.5 ? '#05ffa1' : '#b967ff',
      glowColor: 'rgba(5, 255, 161, 0.6)',
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.75,
      type: 'circle'
    });
  }

  // Portal level completion warp flash
  emitPortalWarp(x, y) {
    this.triggerScreenShake(8);
    const count = 50;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 120 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 4,
        startSize: 6,
        color: '#05ffa1',
        glowColor: 'rgba(5, 255, 161, 0.8)',
        life: 0.8 + Math.random() * 0.3,
        maxLife: 1.0,
        type: 'spark'
      });
    }
  }

  // Paradox Zone rewind implosion
  emitParadoxRewind(x, y) {
    this.triggerScreenShake(10);
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 40 + Math.random() * 40;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      
      // Inward collapse velocity
      this.particles.push({
        x: px,
        y: py,
        vx: -Math.cos(angle) * 120,
        vy: -Math.sin(angle) * 120,
        size: 3 + Math.random() * 3,
        startSize: 4,
        color: Math.random() > 0.4 ? '#ff2a6d' : '#00f0ff',
        glowColor: 'rgba(255, 42, 109, 0.8)',
        life: 0.35 + Math.random() * 0.15,
        maxLife: 0.5,
        type: 'digital'
      });
    }
  }

  // Switch activation sparks
  emitSwitchSparks(x, y, color = '#00f0ff') {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2,
        startSize: 3.5,
        color,
        glowColor: color,
        life: 0.4,
        maxLife: 0.4,
        type: 'spark'
      });
    }
  }

  // Subtle ambient golden mote around uncollected orbs
  emitOrbAmbient(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 10;
    this.particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 8,
      vy: -10 - Math.random() * 12,
      size: 1.5 + Math.random() * 1.5,
      startSize: 2.2,
      color: '#ffe600',
      glowColor: 'rgba(255, 230, 0, 0.5)',
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      type: 'circle'
    });
  }

  // Subtle ambient energy spark around switches
  emitSwitchAmbient(x, y, color = '#00f0ff') {
    const angle = Math.random() * Math.PI * 2;
    const dist = 4 + Math.random() * 8;
    this.particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      size: 1.2 + Math.random() * 1.2,
      startSize: 1.8,
      color,
      glowColor: color,
      life: 0.25 + Math.random() * 0.15,
      maxLife: 0.4,
      type: 'spark'
    });
  }

  // Floating feedback text notification (e.g. "+1 MEMORY", "BIOMETRIC CONFIRMED")
  emitFloatingText(text, x, y, color = '#ffe600') {
    this.floatingTexts.push({
      text,
      x,
      y: y - 8,
      vy: -26,
      color,
      life: 1.1,
      maxLife: 1.1
    });
  }

  // Hydraulic door opening steam puff
  emitDoorSteam(x, y, w, h) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const px = x + Math.random() * w;
      const py = y + Math.random() * h;
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 25,
        vy: (Math.random() - 0.5) * 25,
        size: 3 + Math.random() * 4,
        startSize: 4 + Math.random() * 4,
        color: '#c2d5ea',
        glowColor: 'rgba(194, 213, 234, 0.4)',
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        type: 'circle'
      });
    }
  }

  // Echo spawn expanding shockwave ring
  emitEchoSpawnWave(x, y) {
    this.triggerScreenShake(8);
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 75 + Math.random() * 75;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        startSize: 4,
        color: Math.random() > 0.4 ? '#b967ff' : '#ffffff',
        glowColor: 'rgba(185, 103, 255, 0.8)',
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.65,
        type: 'digital'
      });
    }
  }

  render(ctx) {
    ctx.save();
    // 1. Regular Particles (optimized high-performance batch render)
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'circle' || p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'digital') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    // 2. Sci-Fi Floating Feedback Texts
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.font = 'bold 12px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
  }
}
