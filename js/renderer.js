/**
 * ECHO - Realistic Cinematic Sci-Fi Graphics & Atmospheric Lighting Engine
 * Abandoned futuristic facility aesthetic with metallic surfaces, pipes, shadows, and practical lighting
 */
import { CONFIG } from './constants.js';

export class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Offscreen canvas for atmospheric 2D dynamic lighting (with camera inertia margin)
    this.margin = 48;
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CONFIG.CANVAS_WIDTH + this.margin * 2;
    this.lightCanvas.height = CONFIG.CANVAS_HEIGHT + this.margin * 2;
    this.lightCtx = this.lightCanvas.getContext('2d');

    // Pre-rendered offscreen floor canvas to eliminate redundant redraws
    this.floorCanvas = null;
    this.floorCtx = null;
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        this.floorCanvas = document.createElement('canvas');
        this.floorCanvas.width = CONFIG.CANVAS_WIDTH + 128;
        this.floorCanvas.height = CONFIG.CANVAS_HEIGHT + 128;
        this.floorCtx = this.floorCanvas.getContext('2d');
        if (this.floorCtx) {
          this.buildFloorCache();
        }
      } catch (e) {
        this.floorCanvas = null;
      }
    }

    // Cached static cinematic vignette gradient
    this.vignetteGrad = null;
    if (this.ctx && this.ctx.createRadialGradient) {
      const cx = CONFIG.CANVAS_WIDTH / 2;
      const cy = CONFIG.CANVAS_HEIGHT / 2;
      const rMin = Math.min(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT) * 0.42;
      const rMax = Math.max(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT) * 0.68;
      try {
        this.vignetteGrad = this.ctx.createRadialGradient(cx, cy, rMin, cx, cy, rMax);
        this.vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        this.vignetteGrad.addColorStop(1, 'rgba(2, 4, 8, 0.72)');
      } catch (e) {}
    }

    this.time = 0;

    // Atmospheric airborne dust motes
    this.dustMotes = [];
    for (let i = 0; i < 36; i++) {
      this.dustMotes.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 8,
        size: 1 + Math.random() * 1.5,
        alpha: 0.15 + Math.random() * 0.25,
        pulseSpeed: 1 + Math.random() * 2
      });
    }
  }

  update(dt) {
    this.time += dt;

    // Update floating dust motes
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    for (const mote of this.dustMotes) {
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;
      if (mote.y < 0) mote.y = h;
      if (mote.y > h) mote.y = 0;
      if (mote.x < 0) mote.x = w;
      if (mote.x > w) mote.x = 0;
    }
  }

  buildFloorCache() {
    if (!this.floorCtx) return;
    const ctx = this.floorCtx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    const ts = CONFIG.TILE_SIZE;

    ctx.save();
    ctx.translate(64, 64);

    // 1. Deep Gunmetal Steel Base
    ctx.fillStyle = '#080c14';
    ctx.fillRect(-64, -64, w + 128, h + 128);

    // 2. Realistic Metallic Floor Plates (64x64 modular grid with 1px seams)
    const plateSize = ts * 2;
    for (let x = -plateSize; x < w + plateSize; x += plateSize) {
      for (let y = -plateSize; y < h + plateSize; y += plateSize) {
        const hash = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const absHash = Math.abs(hash);

        if (absHash > 0.65) {
          ctx.fillStyle = '#0b101a';
        } else if (absHash > 0.35) {
          ctx.fillStyle = '#090d16';
        } else {
          ctx.fillStyle = '#070b13';
        }
        ctx.fillRect(x + 1, y + 1, plateSize - 2, plateSize - 2);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, plateSize - 1, plateSize - 1);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + plateSize - 1, y + 1);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fillRect(x + 3, y + 3, 1.5, 1.5);
        ctx.fillRect(x + plateSize - 4, y + 3, 1.5, 1.5);
        ctx.fillRect(x + 3, y + plateSize - 4, 1.5, 1.5);
        ctx.fillRect(x + plateSize - 4, y + plateSize - 4, 1.5, 1.5);

        if (absHash > 0.88) {
          ctx.fillStyle = '#04060a';
          ctx.fillRect(x + 16, y + 16, 32, 32);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          for (let gy = y + 20; gy < y + 46; gy += 4) {
            ctx.beginPath();
            ctx.moveTo(x + 18, gy);
            ctx.lineTo(x + 46, gy);
            ctx.stroke();
          }
        }

        if (absHash < 0.12) {
          ctx.fillStyle = 'rgba(10, 20, 35, 0.45)';
          ctx.beginPath();
          ctx.ellipse(x + 32, y + 32, 18, 12, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  drawFloorDirect() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;
    const ts = CONFIG.TILE_SIZE;
    ctx.fillStyle = '#080c14';
    ctx.fillRect(-64, -64, w + 128, h + 128);

    const plateSize = ts * 2;
    for (let x = -plateSize; x < w + plateSize; x += plateSize) {
      for (let y = -plateSize; y < h + plateSize; y += plateSize) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(x + 1, y + 1, plateSize - 2, plateSize - 2);
      }
    }
  }

  renderFloor(walls) {
    if (this.floorCanvas && this.floorCtx) {
      this.ctx.drawImage(this.floorCanvas, -64, -64);
    } else {
      this.drawFloorDirect();
    }

    // 3. Wall Ambient Occlusion Shadows onto the floor
    this.renderWallShadows(walls);
  }

  renderWallShadows(walls) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';

    for (const wall of walls) {
      // Cast shadow 7px down and 4px right
      ctx.fillRect(wall.x + 4, wall.y + wall.height, wall.width, 7);
      ctx.fillRect(wall.x + wall.width, wall.y + 4, 4, wall.height);
    }

    ctx.restore();
  }

  renderWalls(walls) {
    const ctx = this.ctx;
    ctx.save();

    for (const wall of walls) {
      const isConsole = wall.type === 'console';
      const wx = wall.x;
      const wy = wall.y;
      const ww = wall.width;
      const wh = wall.height;

      if (isConsole) {
        // INDUSTRIAL MACHINERY / CONTROL CONSOLE
        // Heavy steel chassis base
        ctx.fillStyle = '#101724';
        ctx.fillRect(wx, wy, ww, wh);

        // Machinery recessed panel
        ctx.fillStyle = '#152030';
        ctx.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);

        // Bevel highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);

        // Cooling ventilation slats
        ctx.fillStyle = '#060a12';
        ctx.fillRect(wx + 6, wy + 16, ww - 12, 10);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let vy = wy + 18; vy < wy + 26; vy += 3) {
          ctx.beginPath();
          ctx.moveTo(wx + 8, vy);
          ctx.lineTo(wx + ww - 8, vy);
          ctx.stroke();
        }

        // Practical indicator LEDs (amber caution & green telemetry)
        const isBlinking = Math.sin(this.time * 3 + wx) > 0;
        ctx.fillStyle = isBlinking ? '#ffaa00' : '#443000';
        ctx.shadowColor = isBlinking ? '#ffaa00' : 'transparent';
        ctx.shadowBlur = isBlinking ? 6 : 0;
        ctx.fillRect(wx + 6, wy + 6, 3, 3);

        ctx.fillStyle = '#05ffa1';
        ctx.shadowColor = '#05ffa1';
        ctx.shadowBlur = 4;
        ctx.fillRect(wx + 12, wy + 6, 3, 3);

        ctx.shadowBlur = 0; // Reset shadow

      } else {
        // REINFORCED FACILITY WALL
        // Base dark industrial concrete/steel
        ctx.fillStyle = '#111722';
        ctx.fillRect(wx, wy, ww, wh);

        // Inset armor plate
        ctx.fillStyle = '#17202e';
        ctx.fillRect(wx + 2.5, wy + 2.5, ww - 5, wh - 5);

        // Top specular metallic rim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fillRect(wx + 1, wy + 1, ww - 2, 1.5);

        // Outer wall boundary seam
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);

        // Industrial conduit pipe running horizontally
        ctx.fillStyle = '#263346';
        ctx.fillRect(wx, wy + 10, ww, 4);

        // Pipe metallic specular highlight line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(wx, wy + 10.5, ww, 1);

        // Pipe brackets every 32px
        ctx.fillStyle = '#3a4b63';
        ctx.fillRect(wx + 6, wy + 8.5, 3, 7);
        ctx.fillRect(wx + ww - 9, wy + 8.5, 3, 7);

        // Steel bolts at corners
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(wx + 4, wy + 4, 1.5, 1.5);
        ctx.fillRect(wx + ww - 5, wy + 4, 1.5, 1.5);
        ctx.fillRect(wx + 4, wy + wh - 5, 1.5, 1.5);
        ctx.fillRect(wx + ww - 5, wy + wh - 5, 1.5, 1.5);
      }
    }

    ctx.restore();
  }

  renderOrbs(orbs) {
    const ctx = this.ctx;
    ctx.save();

    for (const orb of orbs) {
      if (orb.collected) continue;

      const bobY = Math.sin(this.time * CONFIG.ORB.BOB_SPEED + orb.id) * CONFIG.ORB.BOB_AMPLITUDE;
      const ox = orb.x;
      const oy = orb.y + bobY;

      // Soft ambient golden reflection on floor below orb
      const floorGrad = ctx.createRadialGradient(ox, orb.y + 12, 2, ox, orb.y + 12, 24);
      floorGrad.addColorStop(0, 'rgba(255, 210, 60, 0.18)');
      floorGrad.addColorStop(1, 'rgba(255, 210, 60, 0)');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.ellipse(ox, orb.y + 12, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Delicate orbiting telemetry rings
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(this.time * 1.5);
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Outer plasma aura
      const auraGrad = ctx.createRadialGradient(ox, oy, 2, ox, oy, 22);
      auraGrad.addColorStop(0, 'rgba(255, 230, 0, 0.5)');
      auraGrad.addColorStop(0.6, 'rgba(255, 180, 0, 0.15)');
      auraGrad.addColorStop(1, 'rgba(255, 230, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(ox, oy, 22, 0, Math.PI * 2);
      ctx.fill();

      // Floating containment sphere core
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Intense white singularity center
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderPortal(portal, isUnlocked, particleSystem) {
    const ctx = this.ctx;
    ctx.save();

    const px = portal.x;
    const py = portal.y;
    const isGrand = !!portal.isGrand;
    const radius = isGrand ? CONFIG.PORTAL.GRAND_RADIUS : CONFIG.PORTAL.RADIUS;

    if (isUnlocked) {
      // ACTIVE UNLOCKED PORTAL (Intense Cinematic Accretion Disk)
      if (particleSystem) {
        particleSystem.emitPortalVortex(px, py, radius);
      }

      // Strong floor light reflection
      const floorGrad = ctx.createRadialGradient(px, py, 10, px, py, radius + (isGrand ? 50 : 35));
      floorGrad.addColorStop(0, 'rgba(5, 255, 161, 0.35)');
      floorGrad.addColorStop(0.5, 'rgba(185, 103, 255, 0.15)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.arc(px, py, radius + (isGrand ? 50 : 35), 0, Math.PI * 2);
      ctx.fill();

      // Outer swirling energy halo
      const vortexGrad = ctx.createRadialGradient(px, py, 4, px, py, radius + (isGrand ? 32 : 20));
      vortexGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      vortexGrad.addColorStop(0.3, 'rgba(5, 255, 161, 0.85)');
      vortexGrad.addColorStop(0.7, 'rgba(185, 103, 255, 0.6)');
      vortexGrad.addColorStop(1, 'rgba(5, 255, 161, 0)');

      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.arc(px, py, radius + (isGrand ? 32 : 20), 0, Math.PI * 2);
      ctx.fill();

      // Rotating emitter ring 1 (Cyan)
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.time * 2);
      ctx.strokeStyle = '#05ffa1';
      ctx.shadowColor = '#05ffa1';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Rotating inner counter-ring (Violet)
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-this.time * 3);
      ctx.strokeStyle = '#b967ff';
      ctx.shadowColor = '#b967ff';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Level 5 Grand Portal Outer Golden Accretion Ring
      if (isGrand) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(this.time * 1.5);
        ctx.strokeStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Bright singularity core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(px, py, (isGrand ? 10 : 6) + Math.sin(this.time * 6) * 2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // LOCKED PORTAL (Heavy Steel Inactive Hatch with Security Laser)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = isGrand ? 5 : 4;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#0a0f1d';
      ctx.beginPath();
      ctx.arc(px, py, radius - 2, 0, Math.PI * 2);
      ctx.fill();

      // Steel containment clamps
      for (let i = 0; i < 4; i++) {
        const clampAngle = (i * Math.PI) / 2;
        const cx = px + Math.cos(clampAngle) * radius;
        const cy = py + Math.sin(clampAngle) * radius;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
      }

      // Red security laser barrier
      const pulse = 0.4 + Math.sin(this.time * 3) * 0.2;
      ctx.strokeStyle = `rgba(255, 42, 109, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - radius * 0.7, py);
      ctx.lineTo(px + radius * 0.7, py);
      ctx.moveTo(px, py - radius * 0.7);
      ctx.lineTo(px, py + radius * 0.7);
      ctx.stroke();

      // Lock icon center
      ctx.fillStyle = '#ff2a6d';
      ctx.shadowColor = '#ff2a6d';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, isGrand ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderParadoxZones(zones) {
    if (!zones || zones.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    for (const zone of zones) {
      const zx = zone.x;
      const zy = zone.y;
      const zw = zone.width;
      const zh = zone.height;

      // Realistic crimson temporal distortion field
      const pulse = 0.16 + Math.sin(this.time * 4 + zx * 0.05) * 0.08;
      ctx.fillStyle = `rgba(255, 30, 80, ${pulse})`;
      ctx.fillRect(zx, zy, zw, zh);

      // Warning hazard border
      ctx.strokeStyle = 'rgba(255, 42, 109, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);

      // Diagonal temporal scanline pattern
      ctx.strokeStyle = 'rgba(255, 42, 109, 0.25)';
      ctx.beginPath();
      ctx.moveTo(zx, zy + zh);
      ctx.lineTo(zx + zw, zy);
      ctx.stroke();

      // Center temporal hazard glyph
      ctx.fillStyle = 'rgba(255, 42, 109, 0.7)';
      ctx.beginPath();
      ctx.arc(zx + zw / 2, zy + zh / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Visual feedback: Illuminated floor conduit connecting switches to target security doors
  renderSwitchConduits(switches, doors) {
    if (!switches || !doors || switches.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    for (const sw of switches) {
      const targetDoor = doors.find(d => d.id === sw.targetDoorId);
      if (!targetDoor) continue;

      const isPlayer = sw.type === 'player';
      const isPressed = sw.isPressed;
      const conduitColor = isPlayer ? '#00f0ff' : '#ff2a6d';
      const targetX = targetDoor.x + targetDoor.width / 2;
      const targetY = targetDoor.y + targetDoor.height / 2;

      // Manhattan right-angled cable route from switch to door
      const midX = targetX;
      const midY = sw.y;

      // 1. Dark floor conduit channel
      ctx.strokeStyle = '#090e18';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sw.x, sw.y);
      ctx.lineTo(midX, midY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // 2. Active illuminated circuit line
      if (isPressed) {
        ctx.strokeStyle = conduitColor;
        ctx.shadowColor = conduitColor;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sw.x, sw.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Flowing energy pulses traveling from switch to door
        const pulseOffset = (this.time * 40) % 20;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 16]);
        ctx.lineDashOffset = -pulseOffset;
        ctx.beginPath();
        ctx.moveTo(sw.x, sw.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      } else {
        // Subtle standby dashed conduit
        ctx.strokeStyle = isPlayer ? 'rgba(0, 240, 255, 0.28)' : 'rgba(255, 42, 109, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -(this.time * 5) % 12;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(sw.x, sw.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      }

      // 3. Status label near door
      ctx.setLineDash([]);
      ctx.font = '600 7px "Courier New", monospace';
      ctx.fillStyle = isPressed ? '#05ffa1' : conduitColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.shadowColor = conduitColor;
      ctx.shadowBlur = isPressed ? 4 : 0;
      const tagText = isPlayer ? 'CIRCUIT: BIOMETRIC' : 'CIRCUIT: ECHO';
      ctx.fillText(tagText, targetX, targetDoor.y - 3);
    }

    ctx.restore();
  }

  renderSwitches(switches) {
    if (!switches || switches.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    for (const sw of switches) {
      const sx = sw.x;
      const sy = sw.y;
      const isPlayer = sw.type === 'player';
      const isPressed = sw.isPressed;
      const primaryColor = isPlayer ? CONFIG.SWITCH.COLOR_PLAYER : CONFIG.SWITCH.COLOR_ECHO;

      // Active pulsating energy resonance ring when stepped on
      if (isPressed) {
        const ringProgress = (this.time * 2.5) % 1;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.5 * (1 - ringProgress);
        ctx.beginPath();
        ctx.arc(sx, sy, sw.radius + ringProgress * 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Industrial floor bezel
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isPressed ? primaryColor : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, sw.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Recessed sensor plate (depresses slightly when pressed)
      const plateRadius = isPressed ? sw.radius - 3.5 : sw.radius - 2;
      ctx.fillStyle = isPressed 
        ? (isPlayer ? 'rgba(0, 240, 255, 0.35)' : 'rgba(185, 103, 255, 0.4)') 
        : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(sx, sy, plateRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing sensor node
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = isPressed ? 14 : 5;

      if (isPlayer) {
        // Player switch: Biometric concentric circular glyph
        ctx.beginPath();
        ctx.arc(sx, sy, isPressed ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Echo switch: Temporal diamond glyph with chromatic jitter
        const jitter = isPressed ? (Math.random() - 0.5) * 1.5 : 0;
        ctx.beginPath();
        const r = isPressed ? 7 : 5;
        ctx.moveTo(sx + jitter, sy - r);
        ctx.lineTo(sx + r, sy);
        ctx.lineTo(sx + jitter, sy + r);
        ctx.lineTo(sx - r, sy);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.time * 1.2);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  renderDoors(doors) {
    if (!doors || doors.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    for (const door of doors) {
      const dx = door.x;
      const dy = door.y;
      const dw = door.width;
      const dh = door.height;
      const progress = (door.openProgress !== undefined) ? door.openProgress : (door.locked ? 0 : 1);
      const isHorizontal = dw >= dh;

      // 1. Recessed Door Floor Track
      ctx.fillStyle = '#060a12';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

      // 2. Open Pathway Guide Lights when retracted
      if (progress > 0.05) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, progress * 1.2);
        ctx.fillStyle = '#05ffa1';
        ctx.shadowColor = '#05ffa1';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(dx + 3, dy + 3, 2, 0, Math.PI * 2);
        ctx.arc(dx + dw - 3, dy + 3, 2, 0, Math.PI * 2);
        ctx.arc(dx + 3, dy + dh - 3, 2, 0, Math.PI * 2);
        ctx.arc(dx + dw - 3, dy + dh - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Sliding Blast Door Panels
      const laserColor = door.color || '#ff2a6d';
      const closedAmount = 1 - progress;

      if (closedAmount > 0.02) {
        ctx.save();
        ctx.fillStyle = '#101726';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;

        if (isHorizontal) {
          // Horizontal split panels retracting outwards
          const panelWidth = (dw / 2) * closedAmount;
          // Left panel
          ctx.fillRect(dx, dy, panelWidth, dh);
          ctx.strokeRect(dx, dy, panelWidth, dh);
          // Right panel
          ctx.fillRect(dx + dw - panelWidth, dy, panelWidth, dh);
          ctx.strokeRect(dx + dw - panelWidth, dy, panelWidth, dh);
        } else {
          // Vertical split panels retracting outwards
          const panelHeight = (dh / 2) * closedAmount;
          // Top panel
          ctx.fillRect(dx, dy, dw, panelHeight);
          ctx.strokeRect(dx, dy, dw, panelHeight);
          // Bottom panel
          ctx.fillRect(dx, dy + dh - panelHeight, dw, panelHeight);
          ctx.strokeRect(dx, dy + dh - panelHeight, dw, panelHeight);
        }

        // Security Laser Beams across panels
        const laserAlpha = Math.max(0, 1 - progress * 1.8);
        if (laserAlpha > 0) {
          ctx.globalAlpha = laserAlpha;
          ctx.strokeStyle = laserColor;
          ctx.shadowColor = laserColor;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 2;

          ctx.beginPath();
          if (isHorizontal) {
            ctx.moveTo(dx + 3, dy + dh * 0.5);
            ctx.lineTo(dx + dw - 3, dy + dh * 0.5);
          } else {
            ctx.moveTo(dx + dw * 0.5, dy + 3);
            ctx.lineTo(dx + dw * 0.5, dy + dh - 3);
          }
          ctx.stroke();

          // Center security lock diode
          ctx.fillStyle = laserColor;
          ctx.beginPath();
          ctx.arc(dx + dw / 2, dy + dh / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Cinematic atmospheric fog drifting through industrial corridors
  renderAtmosphericFog() {
    const ctx = this.ctx;
    ctx.save();
    const t = this.time * 0.12;

    const fogPatches = [
      { x: CONFIG.CANVAS_WIDTH * 0.25 + Math.sin(t) * 90, y: CONFIG.CANVAS_HEIGHT * 0.35 + Math.cos(t * 0.8) * 60, r: 260, color: 'rgba(25, 45, 80, 0.12)' },
      { x: CONFIG.CANVAS_WIDTH * 0.75 + Math.cos(t * 0.7) * 110, y: CONFIG.CANVAS_HEIGHT * 0.65 + Math.sin(t * 0.9) * 80, r: 300, color: 'rgba(50, 25, 75, 0.10)' },
      { x: CONFIG.CANVAS_WIDTH * 0.5 + Math.sin(t * 0.5) * 120, y: CONFIG.CANVAS_HEIGHT * 0.2 + Math.cos(t * 0.6) * 70, r: 220, color: 'rgba(20, 40, 60, 0.11)' }
    ];

    for (const fog of fogPatches) {
      const g = ctx.createRadialGradient(fog.x, fog.y, 10, fog.x, fog.y, fog.r);
      g.addColorStop(0, fog.color);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fog.x, fog.y, fog.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Floating airborne atmospheric dust motes
  renderAtmosphericMotes() {
    const ctx = this.ctx;
    ctx.save();

    for (const mote of this.dustMotes) {
      const alpha = mote.alpha * (0.8 + Math.sin(this.time * mote.pulseSpeed) * 0.2);
      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Dynamic atmospheric lighting overlay with realistic gradients
  renderLighting(player, echoes, orbs, portal, isPortalUnlocked, paradoxZones = [], switches = [], doors = []) {
    const lCtx = this.lightCtx;
    const margin = this.margin || 48;
    const w = CONFIG.CANVAS_WIDTH + margin * 2;
    const h = CONFIG.CANVAS_HEIGHT + margin * 2;

    // 1. Ambient facility darkness (realistic deep indigo-darkness with slight fade on Level 5 finale)
    lCtx.clearRect(0, 0, w, h);
    const ambientFade = (portal && portal.bloom) ? 0.05 * (portal.bloomFactor !== undefined ? portal.bloomFactor : 1.0) : 0;
    const currentDarkness = Math.min(0.97, CONFIG.LIGHTING.AMBIENT_DARKNESS + ambientFade);
    lCtx.fillStyle = `rgba(4, 7, 14, ${currentDarkness})`;
    lCtx.fillRect(0, 0, w, h);

    // Punch out dynamic lights with margin offset
    lCtx.save();
    lCtx.translate(margin, margin);
    lCtx.globalCompositeOperation = 'destination-out';

    // 1. Player light radius & directional forward flashlight beam
    if (!player.isDead) {
      // Soft radial body light
      const pGrad = lCtx.createRadialGradient(
        player.x, player.y, 8,
        player.x, player.y, CONFIG.LIGHTING.PLAYER_LIGHT_RADIUS
      );
      pGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      pGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = pGrad;
      lCtx.beginPath();
      lCtx.arc(player.x, player.y, CONFIG.LIGHTING.PLAYER_LIGHT_RADIUS, 0, Math.PI * 2);
      lCtx.fill();

      // Forward flashlight beam light cutout
      lCtx.save();
      lCtx.translate(player.x, player.y);
      lCtx.rotate(player.angle);
      const flashGrad = lCtx.createRadialGradient(0, 0, 10, 0, 0, 170);
      flashGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      flashGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
      flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = flashGrad;
      lCtx.beginPath();
      lCtx.moveTo(0, 0);
      lCtx.arc(0, 0, 170, -0.45, 0.45);
      lCtx.closePath();
      lCtx.fill();
      lCtx.restore();
    }

    // 2. Echo light radii (subtle spectral purple glow)
    for (const echo of echoes) {
      if (!echo.active) continue;
      const eGrad = lCtx.createRadialGradient(
        echo.x, echo.y, 6,
        echo.x, echo.y, CONFIG.LIGHTING.ECHO_LIGHT_RADIUS
      );
      eGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      eGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.45)');
      eGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = eGrad;
      lCtx.beginPath();
      lCtx.arc(echo.x, echo.y, CONFIG.LIGHTING.ECHO_LIGHT_RADIUS, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 3. Orb light radii (golden warm glow)
    for (const orb of orbs) {
      if (orb.collected) continue;
      const oGrad = lCtx.createRadialGradient(
        orb.x, orb.y, 4,
        orb.x, orb.y, CONFIG.LIGHTING.ORB_LIGHT_RADIUS
      );
      oGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
      oGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
      oGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = oGrad;
      lCtx.beginPath();
      lCtx.arc(orb.x, orb.y, CONFIG.LIGHTING.ORB_LIGHT_RADIUS, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 4. Portal light radius (Supports Grand Portal with stronger illumination when unlocked)
    const isGrand = !!portal.isGrand;
    const baseRadius = isGrand ? CONFIG.LIGHTING.GRAND_PORTAL_LIGHT_RADIUS : CONFIG.LIGHTING.PORTAL_LIGHT_RADIUS;
    const factor = (portal.bloom && portal.bloomFactor !== undefined) ? portal.bloomFactor : (portal.bloom ? 1.0 : 0.0);
    const bloomBonus = factor * 160;
    const portalRadius = isPortalUnlocked ? baseRadius + 60 + bloomBonus : (isGrand ? 80 : 60);
    const portalGrad = lCtx.createRadialGradient(
      portal.x, portal.y, 8,
      portal.x, portal.y, portalRadius
    );
    portalGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    portalGrad.addColorStop(0.4, isPortalUnlocked ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)');
    portalGrad.addColorStop(0.75, isPortalUnlocked ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)');
    portalGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    lCtx.fillStyle = portalGrad;
    lCtx.beginPath();
    lCtx.arc(portal.x, portal.y, portalRadius, 0, Math.PI * 2);
    lCtx.fill();

    // When portal is unlocked, punch out directional radiant beacon flares into surrounding darkness
    if (isPortalUnlocked) {
      const rayCount = 6;
      const rayLen = portalRadius * 1.35;
      lCtx.save();
      lCtx.translate(portal.x, portal.y);
      lCtx.rotate(this.time * 0.7);
      for (let i = 0; i < rayCount; i++) {
        const ang = (i * Math.PI * 2) / rayCount;
        lCtx.beginPath();
        lCtx.moveTo(0, 0);
        lCtx.arc(0, 0, rayLen, ang - 0.12, ang + 0.12);
        lCtx.closePath();
        lCtx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        lCtx.fill();
      }
      lCtx.restore();
    }

    // 5. Paradox Zone red light cutouts
    for (const zone of (paradoxZones || [])) {
      const zGrad = lCtx.createRadialGradient(
        zone.x + zone.width / 2, zone.y + zone.height / 2, 4,
        zone.x + zone.width / 2, zone.y + zone.height / 2, CONFIG.LIGHTING.PARADOX_LIGHT_RADIUS
      );
      zGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      zGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = zGrad;
      lCtx.beginPath();
      lCtx.arc(zone.x + zone.width / 2, zone.y + zone.height / 2, CONFIG.LIGHTING.PARADOX_LIGHT_RADIUS, 0, Math.PI * 2);
      lCtx.fill();
    }

    // 6. Switches glow
    for (const sw of (switches || [])) {
      const sRadius = sw.isPressed ? 60 : 40;
      const sGrad = lCtx.createRadialGradient(
        sw.x, sw.y, 4,
        sw.x, sw.y, sRadius
      );
      sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lCtx.fillStyle = sGrad;
      lCtx.beginPath();
      lCtx.arc(sw.x, sw.y, sRadius, 0, Math.PI * 2);
      lCtx.fill();
    }

    lCtx.restore();

    // Composite darkness layer onto main canvas with margin offset
    this.ctx.drawImage(this.lightCanvas, -margin, -margin);

    // Screen edge cinematic darkness vignette
    if (this.vignetteGrad) {
      this.ctx.fillStyle = this.vignetteGrad;
      this.ctx.fillRect(-margin, -margin, CONFIG.CANVAS_WIDTH + margin * 2, CONFIG.CANVAS_HEIGHT + margin * 2);
    }
  }
}
