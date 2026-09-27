/**
 * ECHO - Player Entity & Movement Physics
 */
import { CONFIG } from './constants.js';
import { sound } from './audio.js';

export class Player {
  constructor(spawnX, spawnY) {
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.x = spawnX;
    this.y = spawnY;
    this.vx = 0;
    this.vy = 0;
    this.radius = CONFIG.PLAYER.RADIUS;
    this.speed = CONFIG.PLAYER.SPEED;
    this.accel = CONFIG.PLAYER.ACCELERATION;
    this.friction = CONFIG.PLAYER.FRICTION;
    this.angle = 0;
    this.pulse = 0;

    this.lives = CONFIG.PLAYER.START_LIVES;
    this.invulnerableTimer = 0;
    this.isDead = false;

    // Active keys
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    this.trailTimer = 0;
    this.history = [];
    this.historyTimer = 0;
    this.paradoxCooldown = 0;
    this.walkCycle = 0;
  }

  reset(spawnX, spawnY, keepLives = true) {
    if (spawnX !== undefined) this.spawnX = spawnX;
    if (spawnY !== undefined) this.spawnY = spawnY;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.invulnerableTimer = 0;
    this.isDead = false;
    this.history = [];
    this.historyTimer = 0;
    this.paradoxCooldown = 0;
    this.walkCycle = 0;
    if (!keepLives) {
      this.lives = CONFIG.PLAYER.START_LIVES;
    }
  }

  handleKeyDown(code) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
    }
  }

  handleKeyUp(code) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  }

  clearKeys() {
    this.keys.up = false;
    this.keys.down = false;
    this.keys.left = false;
    this.keys.right = false;
  }

  update(dt, walls, particleSystem) {
    if (this.isDead) return;

    this.pulse += dt * 4;

    // Invulnerability countdown
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Directional input vector
    let inputX = 0;
    let inputY = 0;

    if (this.keys.left) inputX -= 1;
    if (this.keys.right) inputX += 1;
    if (this.keys.up) inputY -= 1;
    if (this.keys.down) inputY += 1;

    // Normalize diagonal movement
    if (inputX !== 0 && inputY !== 0) {
      const length = Math.SQRT2;
      inputX /= length;
      inputY /= length;
    }

    // Acceleration & Velocity
    if (inputX !== 0 || inputY !== 0) {
      this.vx += inputX * this.accel * dt;
      this.vy += inputY * this.accel * dt;

      // Cap to max speed
      const curSpeed = Math.hypot(this.vx, this.vy);
      if (curSpeed > this.speed) {
        this.vx = (this.vx / curSpeed) * this.speed;
        this.vy = (this.vy / curSpeed) * this.speed;
      }

      // Smooth rotate towards velocity direction
      const targetAngle = Math.atan2(this.vy, this.vx);
      this.angle = targetAngle;

      // Advance walking animation cycle & play subtle footsteps
      const prevWalk = this.walkCycle;
      this.walkCycle += curSpeed * dt * 0.07;
      if (Math.sin(prevWalk) * Math.sin(this.walkCycle) < 0) {
        sound.playFootstep();
      }

      // Emit movement footstep dust / micro thrust
      this.trailTimer += dt;
      if (this.trailTimer >= 0.05 && particleSystem) {
        particleSystem.emitPlayerTrail(this.x, this.y, this.angle);
        this.trailTimer = 0;
      }
    } else {
      // Apply friction damping
      this.vx *= Math.pow(this.friction, dt * 60);
      this.vy *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.vx) < 2) this.vx = 0;
      if (Math.abs(this.vy) < 2) this.vy = 0;

      // Smooth return to rest stance
      this.walkCycle *= 0.85;
    }

    // Resolve wall collisions with axis separation for smooth wall sliding
    this.moveAndCollide(dt, walls);
  }

  moveAndCollide(dt, walls) {
    // Horizontal step
    this.x += this.vx * dt;
    for (const wall of walls) {
      if (this.checkWallCollision(this.x, this.y, wall)) {
        if (this.vx > 0) {
          this.x = wall.x - this.radius;
        } else if (this.vx < 0) {
          this.x = wall.x + wall.width + this.radius;
        }
        this.vx = 0;
      }
    }

    // Vertical step
    this.y += this.vy * dt;
    for (const wall of walls) {
      if (this.checkWallCollision(this.x, this.y, wall)) {
        if (this.vy > 0) {
          this.y = wall.y - this.radius;
        } else if (this.vy < 0) {
          this.y = wall.y + wall.height + this.radius;
        }
        this.vy = 0;
      }
    }

    // Canvas boundary clamps
    this.x = Math.max(this.radius, Math.min(CONFIG.CANVAS_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CONFIG.CANVAS_HEIGHT - this.radius, this.y));

    // Update Paradox Zone rewind cooldown
    if (this.paradoxCooldown > 0) {
      this.paradoxCooldown -= dt;
    }

    // Record position history for Paradox Zone rewind
    this.historyTimer += dt;
    this.history.push({
      x: this.x,
      y: this.y,
      angle: this.angle,
      time: this.historyTimer
    });

    // Prune history older than HISTORY_MAX_TIME
    while (this.history.length > 0 && (this.historyTimer - this.history[0].time) > CONFIG.PLAYER.HISTORY_MAX_TIME) {
      this.history.shift();
    }
  }

  rewindPosition(seconds = 3.0) {
    if (this.paradoxCooldown > 0 || this.history.length < 2) return null;

    const targetTime = Math.max(0, this.historyTimer - seconds);
    let best = this.history[0];

    for (let i = 0; i < this.history.length; i++) {
      if (this.history[i].time >= targetTime) {
        best = this.history[i];
        break;
      }
    }

    const oldPos = { x: this.x, y: this.y };
    this.x = best.x;
    this.y = best.y;
    this.angle = best.angle;
    this.vx = 0;
    this.vy = 0;
    this.paradoxCooldown = CONFIG.PARADOX_ZONE.COOLDOWN;
    // Grace window after rewind to avoid instant impossible collision with past Echoes
    this.invulnerableTimer = Math.max(this.invulnerableTimer, 1.2);

    // Discard history ahead of the rewind point
    while (this.history.length > 0 && this.history[this.history.length - 1].time > best.time) {
      this.history.pop();
    }
    this.historyTimer = best.time;

    return { oldPos, newPos: { x: this.x, y: this.y } };
  }

  checkWallCollision(cx, cy, wall) {
    // Circle vs AABB Box collision
    const nearestX = Math.max(wall.x, Math.min(cx, wall.x + wall.width));
    const nearestY = Math.max(wall.y, Math.min(cy, wall.y + wall.height));
    const deltaX = cx - nearestX;
    const deltaY = cy - nearestY;
    return (deltaX * deltaX + deltaY * deltaY) < (this.radius * this.radius);
  }

  takeDamage() {
    if (this.invulnerableTimer > 0 || this.isDead) return false;
    this.lives -= 1;
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABILITY_DURATION;
    if (this.lives <= 0) {
      this.isDead = true;
    }
    return true;
  }

  render(ctx) {
    if (this.isDead) return;

    // Flash during invulnerability
    if (this.invulnerableTimer > 0) {
      const flash = Math.sin(this.invulnerableTimer * 28);
      if (flash < 0) return; // Strobe frame
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Forward helmet flashlight beam (practical lighting)
    const beamGrad = ctx.createRadialGradient(2, 0, 4, 28, 0, 48);
    beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    beamGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.08)');
    beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.arc(2, 0, 48, -0.42, 0.42);
    ctx.closePath();
    ctx.fill();

    // Walking animation stride calculation
    const stride = Math.sin(this.walkCycle) * 3.5;
    const armSway = Math.cos(this.walkCycle) * 2;

    // 1. Armored Tactical Boots
    ctx.fillStyle = '#0a101d';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1;

    // Left boot
    ctx.beginPath();
    ctx.roundRect(-6 + stride, -8, 6, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // Right boot
    ctx.beginPath();
    ctx.roundRect(-6 - stride, 4, 6, 4, 1.5);
    ctx.fill();
    ctx.stroke();

    // 2. Tactical Suit Torso & Shoulders
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.4;

    // Dark ballistic chest rig
    ctx.fillStyle = '#0d1522';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Power rig pack on operative's back
    ctx.fillStyle = '#152238';
    ctx.fillRect(-9, -4.5, 3.5, 9);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-8.5, -2, 2, 4); // Cyan micro-battery cell

    // Arms in tactical ready stance
    ctx.fillStyle = '#0d1522';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;

    // Left shoulder & arm
    ctx.beginPath();
    ctx.ellipse(1 + armSway * 0.5, -7.5, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right shoulder & arm
    ctx.beginPath();
    ctx.ellipse(1 - armSway * 0.5, 7.5, 4, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Tactical Helmet & Glowing Visor
    ctx.fillStyle = '#111a2e';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing cyan visor slit
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(4.5, -2.5, 1.5, 5);

    ctx.restore();
  }
}
