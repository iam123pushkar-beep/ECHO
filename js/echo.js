/**
 * ECHO - Temporal Echo Recording & Playback System
 * Supports multi-echo temporal apparitions and accurate replay
 */
import { CONFIG } from './constants.js';

export class EchoManager {
  constructor() {
    this.recordedPath = []; // Current recording buffer of snapshots
    this.echoes = []; // Active echo entities replaying previous recordings
    this.isRecording = true;
    this.recordTimer = 0;
    this.cycleDuration = 10;
    this.maxEchoes = 1;
    this.currentCycle = 1;
    this.glitchIntensity = 0;
  }

  initLevel(cycleDuration = 10, maxEchoes = 1) {
    this.cycleDuration = cycleDuration;
    this.maxEchoes = maxEchoes;
    this.reset();
  }

  reset() {
    this.recordedPath = [];
    this.echoes = [];
    this.isRecording = true;
    this.recordTimer = 0;
    this.currentCycle = 1;
    this.glitchIntensity = 0;
  }

  // Record player position snapshot
  recordSample(player, dt) {
    this.recordTimer += dt;
    this.recordedPath.push({
      x: player.x,
      y: player.y,
      angle: player.angle,
      time: this.recordTimer
    });
  }

  // Finalize current recording cycle and spawn/update the Echo
  cycleComplete() {
    if (this.recordedPath.length < 5) return false;

    // Create an Echo instance replaying this recorded path
    const colorIndex = this.echoes.length;
    const newEcho = new EchoEntity([...this.recordedPath], this.cycleDuration, colorIndex);
    
    // Add to active echoes
    this.echoes.push(newEcho);

    // Keep up to maxEchoes
    while (this.echoes.length > this.maxEchoes) {
      this.echoes.shift();
    }

    // Refresh color index & lock all echoes to start playback in sync with the new cycle
    this.echoes.forEach((echo, idx) => {
      echo.colorIndex = idx;
      echo.resetPlayback();
    });

    // Clear buffer for next cycle
    this.recordedPath = [];
    this.recordTimer = 0;
    this.currentCycle += 1;
    this.glitchIntensity = 1.0;

    return true;
  }

  update(dt, player, particleSystem, closedDoors, onCollision) {
    // Decay glitch flash
    if (this.glitchIntensity > 0) {
      this.glitchIntensity = Math.max(0, this.glitchIntensity - dt * 2.5);
    }

    // Update active echoes (Echoes must NOT rewind!)
    for (const echo of this.echoes) {
      echo.update(dt, particleSystem, closedDoors);

      // Check collision with player
      if (echo.active && !player.isDead) {
        const dx = player.x - echo.x;
        const dy = player.y - echo.y;
        const dist = Math.hypot(dx, dy);

        if (dist < (player.radius + echo.radius - 2)) {
          onCollision(echo);
        }
      }
    }
  }

  render(ctx) {
    // 1. Render all temporal origin rift markers on the floor
    for (const echo of this.echoes) {
      echo.renderSpawnRift(ctx);
    }

    // 2. Render all active echoes
    for (const echo of this.echoes) {
      echo.render(ctx, this.glitchIntensity);
    }
  }

  // Get current cycle progress ratio (0.0 to 1.0)
  getProgress() {
    return Math.min(1.0, this.recordTimer / this.cycleDuration);
  }

  getTimeRemaining() {
    return Math.max(0, this.cycleDuration - this.recordTimer);
  }

  hasActiveEcho() {
    return this.echoes.length > 0;
  }
}

/**
 * Individual Echo Entity replaying recorded trajectory
 */
export class EchoEntity {
  constructor(pathSamples, duration, colorIndex = 0) {
    this.path = pathSamples;
    this.duration = duration;
    this.colorIndex = colorIndex;
    this.playbackTime = 0;
    this.radius = CONFIG.ECHO.RADIUS;

    this.spawnX = pathSamples[0]?.x || 0;
    this.spawnY = pathSamples[0]?.y || 0;
    this.spawnAngle = pathSamples[0]?.angle || 0;

    this.totalDuration = pathSamples.length > 0 ? pathSamples[pathSamples.length - 1].time : duration;

    this.x = this.spawnX;
    this.y = this.spawnY;
    this.angle = this.spawnAngle;
    this.active = true;
    this.isStopped = false;
    this.glitchTimer = 0;
    this.pulse = 0;
    this.walkCycle = 0;
    this.trail = [];
    this.trailTimer = 0;
    this.pathIndex = 0;
  }

  resetPlayback() {
    this.playbackTime = 0;
    this.isStopped = false;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.angle = this.spawnAngle;
    this.trail = [];
    this.pathIndex = 0;
  }

  update(dt, particleSystem, closedDoors = []) {
    if (!this.active || this.path.length === 0) return;

    this.pulse += dt * 5;
    this.playbackTime += dt;

    const prevX = this.x;
    const prevY = this.y;

    // Check if recording has ended: Stop cleanly at the final recorded position
    if (this.playbackTime >= this.totalDuration) {
      this.playbackTime = this.totalDuration;
      this.isStopped = true;

      const finalSample = this.path[this.path.length - 1];
      this.x = finalSample.x;
      this.y = finalSample.y;
      this.angle = finalSample.angle;
      this.walkCycle *= 0.85; // Settle into resting posture
    } else {
      this.isStopped = false;

      // Find position in path via monotonic cursor lookup (O(1) amortized)
      const targetTime = this.playbackTime;
      let index = Math.min(this.pathIndex || 0, this.path.length - 2);
      if (index < 0) index = 0;
      if (this.path[index] && this.path[index].time > targetTime) {
        index = 0;
      }
      while (index < this.path.length - 2 && this.path[index + 1].time < targetTime) {
        index++;
      }
      this.pathIndex = index;

      const current = this.path[index];
      const next = this.path[Math.min(index + 1, this.path.length - 1)];

      if (current && next && current !== next) {
        const segmentDuration = next.time - current.time;
        const t = segmentDuration > 0.00001 ? (targetTime - current.time) / segmentDuration : 0;
        const clampedT = Math.max(0, Math.min(1, t));

        this.x = current.x + (next.x - current.x) * clampedT;
        this.y = current.y + (next.y - current.y) * clampedT;

        // Angular shortest-arc lerp
        let diff = next.angle - current.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle = current.angle + diff * clampedT;
      } else if (current) {
        this.x = current.x;
        this.y = current.y;
        this.angle = current.angle;
      }
    }

    // Environmental consistency: if a security door closed that wasn't closed during recording,
    // handle physical obstruction consistently by preventing pass-through into closed doors
    if (closedDoors && closedDoors.length > 0) {
      for (const door of closedDoors) {
        if (door.locked) {
          const minX = door.x - this.radius;
          const maxX = door.x + door.width + this.radius;
          const minY = door.y - this.radius;
          const maxY = door.y + door.height + this.radius;

          if (this.x > minX && this.x < maxX && this.y > minY && this.y < maxY) {
            const leftDist = this.x - minX;
            const rightDist = maxX - this.x;
            const topDist = this.y - minY;
            const bottomDist = maxY - this.y;

            const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
            if (minDist === leftDist) {
              this.x = minX;
            } else if (minDist === rightDist) {
              this.x = maxX;
            } else if (minDist === topDist) {
              this.y = minY;
            } else {
              this.y = maxY;
            }
          }
        }
      }
    }

    // Advance walking cycle from delta movement
    const moveDist = Math.hypot(this.x - prevX, this.y - prevY);
    if (moveDist > 0.2) {
      this.walkCycle += moveDist * 0.45;
    }

    // Motion trail history
    this.trailTimer += dt;
    if (this.trailTimer >= 0.05) {
      this.trail.unshift({ x: this.x, y: this.y, angle: this.angle });
      if (this.trail.length > 4) {
        this.trail.pop();
      }
      this.trailTimer = 0;
    }

    // Emit digital glitch particles
    this.glitchTimer += dt;
    if (this.glitchTimer >= 0.06 && particleSystem) {
      particleSystem.emitEchoGlitch(this.x, this.y);
      this.glitchTimer = 0;
    }
  }

  // Visual feedback: Render Temporal Origin Rift where this Echo was created
  renderSpawnRift(ctx) {
    const baseColor = this.colorIndex === 0 ? '#b967ff' : (this.colorIndex === 1 ? '#ff9900' : '#ff2a6d');
    const glowColor = this.colorIndex === 0 ? 'rgba(185, 103, 255, 0.4)' : (this.colorIndex === 1 ? 'rgba(255, 153, 0, 0.4)' : 'rgba(255, 42, 109, 0.4)');

    ctx.save();
    ctx.translate(this.spawnX, this.spawnY);

    // Rotating temporal rift circle
    ctx.save();
    ctx.rotate(this.pulse * 0.8);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 16 + Math.sin(this.pulse * 2) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Central core beacon diamond
    ctx.fillStyle = baseColor;
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    // Small futuristic text label: ECHO 0X ORIGIN
    ctx.font = '600 7px "Courier New", monospace';
    ctx.fillStyle = baseColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowBlur = 4;
    ctx.fillText(`ECHO 0${this.colorIndex + 1} ORIGIN`, 0, 18);

    ctx.restore();
  }

  render(ctx, globalGlitch = 0) {
    if (!this.active) return;

    // Spectral Purple / Violet energy color sets
    const baseColor = this.colorIndex === 0 ? '#b967ff' : (this.colorIndex === 1 ? '#e2c4ff' : '#9945ff');
    const glowColor = 'rgba(185, 103, 255, 0.45)';

    // 1. Render Fading Motion Trail Afterimages
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const trailAlpha = (1 - (i + 1) / (this.trail.length + 1)) * 0.25;

      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 8.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 2. Render Main Distorted Ghost Silhouette
    ctx.save();

    // Subtle holographic chromatic jitter
    const isGlitching = Math.random() < (0.15 + globalGlitch * 0.3);
    const jitterX = (Math.random() - 0.5) * (isGlitching ? 5 : 1.5);
    const jitterY = (Math.random() - 0.5) * (isGlitching ? 4 : 1.5);

    ctx.translate(this.x + jitterX, this.y + jitterY);
    ctx.rotate(this.angle);

    // Warning / Danger Perimeter Ring (pulsing dashed violet ring)
    ctx.save();
    ctx.rotate(-this.angle);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(185, 103, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 6 + Math.sin(this.pulse) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Semi-transparent ghost body
    const ghostAlpha = 0.72 + Math.sin(this.pulse * 4) * 0.12;
    ctx.globalAlpha = ghostAlpha;

    // Spectral Glow
    ctx.shadowColor = baseColor;
    ctx.shadowBlur = 12 + Math.sin(this.pulse) * 4;

    const stride = Math.sin(this.walkCycle) * 3;
    const armSway = Math.cos(this.walkCycle) * 2;

    // Phantom Boots
    ctx.fillStyle = 'rgba(40, 15, 60, 0.8)';
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(-6 + stride, -8, 6, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(-6 - stride, 4, 6, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // Phantom Torso Silhouette
    ctx.fillStyle = 'rgba(25, 8, 45, 0.85)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;

    // Glitch slice offset
    const sliceJitter = isGlitching ? (Math.random() - 0.5) * 3 : 0;

    ctx.beginPath();
    ctx.ellipse(sliceJitter, 0, 7.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.ellipse(1 + armSway * 0.5, -7.5, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(1 - armSway * 0.5, 7.5, 4, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Phantom Visor / Energy Rift
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(4, -2.5, 2, 5);

    // Holographic digital scanlines across phantom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let sy = -8; sy <= 8; sy += 3.5) {
      ctx.fillRect(-7, sy, 14, 1);
    }

    ctx.restore();
  }
}
