/**
 * ECHO - Main Game Engine & State Controller
 * Features Minimal Futuristic HUD, Echo Warnings, Immersive Sound, Smooth Transitions, and Enhanced Feel
 */
import { CONFIG } from './constants.js';
import { LEVELS, parseLevel } from './levels.js';
import { sound } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { EchoManager } from './echo.js';
import { WorldRenderer } from './renderer.js';

export const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER',
  CINEMATIC_ENDING: 'CINEMATIC_ENDING'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = GAME_STATE.MENU;
    this.currentLevelIndex = 0;
    this.levelData = null;

    this.player = null;
    this.echoManager = new EchoManager();
    this.particles = new ParticleSystem();
    this.renderer = new WorldRenderer(canvas);

    this.orbsCollected = 0;
    this.requiredOrbs = 3;
    this.isPortalUnlocked = false;
    this.levelTime = 0;
    this.totalGameTime = 0;

    // Cumulative Run Statistics for Ending Screen
    this.totalOrbsCollected = 0;
    this.totalEchoesCreated = 0;
    this.totalParadoxesSolved = 0;
    this.highestUnlockedLevel = 0;

    this.lastTime = 0;

    // Cinematic Camera, Screen Glitch & Transition Engine
    this.camera = { x: 0, y: 0 };
    this.screenDistortion = { type: null, timer: 0, duration: 0 };
    this.transitionTimer = 0.5;
    this.ambientParticleTimer = 0;

    // Echo Warning & Proximity States
    this.lastCountdownStep = 0;
    this.echoProximityIntensity = 0;
    this.exitAlertTimer = 0;
    this.stabilizedAlertTimer = 0;
    this.portalBloomActive = false;
    this.portalBloomFactor = 0.0;

    // Gameplay Settings
    this.enableScreenShake = true;
    this.enableDistortion = true;

    // UI elements cache
    this.ui = {
      menuOverlay: document.getElementById('menu-overlay'),
      pauseOverlay: document.getElementById('pause-overlay'),
      levelCompleteOverlay: document.getElementById('complete-overlay'),
      gameOverOverlay: document.getElementById('game-over-overlay'),
      howToPlayOverlay: document.getElementById('how-to-play-overlay'),
      levelSelectOverlay: document.getElementById('level-select-overlay'),
      settingsOverlay: document.getElementById('settings-overlay'),
      endingOverlay: document.getElementById('ending-overlay'),

      // Minimal Futuristic HUD
      hudLevelTitle: document.getElementById('hud-level-title'),
      hudObjective: document.getElementById('hud-objective'),
      hudWarningAlert: document.getElementById('hud-warning-alert'),
      hudCountdownNum: document.getElementById('hud-countdown-num'),
      hudExitAlert: document.getElementById('hud-exit-alert'),
      hudStabilizedAlert: document.getElementById('hud-stabilized-alert'),

      hudOrbsVal: document.getElementById('hud-orbs-val'),
      hudEchoesVal: document.getElementById('hud-echoes-val'),
      hudLivesVal: document.getElementById('hud-lives-val'),
      hudMemoryVal: document.getElementById('hud-memory-val'),
      hudMemoryFill: document.getElementById('hud-memory-fill'),

      muteBtn: document.getElementById('btn-mute'),
      muteIcon: document.getElementById('mute-icon'),

      // Level Complete Stats
      completeTime: document.getElementById('complete-time'),
      completeOrbs: document.getElementById('complete-orbs'),
      completeCycles: document.getElementById('complete-cycles'),
      completeLives: document.getElementById('complete-lives'),
      completeNextBtn: document.getElementById('btn-complete-next'),

      // Ending Stats (Exact requirements: TIME, ORBS COLLECTED, ECHOES CREATED, PARADOXES SOLVED)
      endingTime: document.getElementById('ending-time'),
      endingOrbs: document.getElementById('ending-orbs'),
      endingEchoes: document.getElementById('ending-echoes'),
      endingParadoxes: document.getElementById('ending-paradoxes'),

      // Settings Elements
      sliderMaster: document.getElementById('slider-master-volume'),
      sliderSfx: document.getElementById('slider-sfx-volume'),
      sliderAmbient: document.getElementById('slider-ambient-volume'),
      valMaster: document.getElementById('val-master-volume'),
      valSfx: document.getElementById('val-sfx-volume'),
      valAmbient: document.getElementById('val-ambient-volume'),
      btnToggleShake: document.getElementById('btn-toggle-shake'),
      btnToggleDistortion: document.getElementById('btn-toggle-distortion')
    };

    this.setupEventListeners();
    this.setupSettings();
    this.updateMuteUI();
    this.renderLevelSelectGrid();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      sound.init(); // Initialize audio on first user gesture

      // Prevent window scrolling on arrow keys and spacebar
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // Escape handles pausing or dismissing open modals in Menu
      if (e.code === 'Escape') {
        if (this.state === GAME_STATE.PLAYING) {
          this.pauseGame();
        } else if (this.state === GAME_STATE.PAUSED) {
          this.resumeGame();
        } else if (this.state === GAME_STATE.MENU) {
          this.hideModal('how-to-play');
          this.hideModal('level-select');
          this.hideModal('settings');
        }
        return;
      }

      if (e.code === 'KeyP') {
        this.togglePause();
        return;
      }

      if (e.code === 'KeyR' && (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED)) {
        this.restartLevel();
        return;
      }

      if (e.code === 'KeyM') {
        this.toggleMute();
        return;
      }

      if (e.code === 'Space' && this.state === GAME_STATE.PLAYING) {
        this.triggerManualCycleSync();
        return;
      }

      if (this.state === GAME_STATE.PLAYING && this.player) {
        this.player.handleKeyDown(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.player) {
        this.player.handleKeyUp(e.code);
      }
    });

    // Blur pauses game & clears keys
    window.addEventListener('blur', () => {
      if (this.state === GAME_STATE.PLAYING) {
        this.pauseGame();
      }
      if (this.player) this.player.clearKeys();
    });

    // Window focus safety
    window.addEventListener('focus', () => {
      if (this.player) this.player.clearKeys();
    });

    // Main Menu Buttons
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.startNewGame();
    });

    document.getElementById('btn-level-select')?.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.showModal('level-select');
    });

    document.getElementById('btn-how-to-play')?.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.showModal('how-to-play');
    });

    document.getElementById('btn-how-to-play-start')?.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.hideModal('how-to-play');
      this.startNewGame();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      sound.init();
      sound.playClick();
      this.showModal('settings');
    });

    document.getElementById('btn-close-how-to-play')?.addEventListener('click', () => {
      sound.playClick();
      this.hideModal('how-to-play');
    });

    document.getElementById('btn-close-level-select')?.addEventListener('click', () => {
      sound.playClick();
      this.hideModal('level-select');
    });

    document.getElementById('btn-close-settings')?.addEventListener('click', () => {
      sound.playClick();
      this.hideModal('settings');
    });

    // Pause Modal Buttons
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      sound.playClick();
      this.resumeGame();
    });

    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      sound.playClick();
      this.restartLevel();
    });

    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      sound.playClick();
      this.returnToMenu();
    });

    // Top Right Mini HUD Actions
    document.getElementById('btn-hud-sync')?.addEventListener('click', () => {
      sound.playClick();
      this.triggerManualCycleSync();
    });

    document.getElementById('btn-hud-pause')?.addEventListener('click', () => {
      sound.playClick();
      this.togglePause();
    });

    document.getElementById('btn-hud-restart')?.addEventListener('click', () => {
      sound.playClick();
      this.restartLevel();
    });

    this.ui.muteBtn?.addEventListener('click', () => {
      this.toggleMute();
    });

    // Level Complete Buttons
    document.getElementById('btn-complete-next')?.addEventListener('click', () => {
      sound.playClick();
      this.nextLevel();
    });

    document.getElementById('btn-complete-replay')?.addEventListener('click', () => {
      sound.playClick();
      this.restartLevel();
    });

    document.getElementById('btn-complete-menu')?.addEventListener('click', () => {
      sound.playClick();
      this.returnToMenu();
    });

    // Game Over Buttons
    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
      sound.playClick();
      this.restartLevel(true); // Reset lives to 3
    });

    document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
      sound.playClick();
      this.returnToMenu();
    });

    // Ending Buttons
    document.getElementById('btn-ending-replay')?.addEventListener('click', () => {
      sound.playClick();
      this.startNewGame();
    });

    document.getElementById('btn-ending-menu')?.addEventListener('click', () => {
      sound.playClick();
      this.returnToMenu();
    });
  }

  setupSettings() {
    if (this.ui.sliderMaster) {
      this.ui.sliderMaster.value = Math.round(sound.masterVolume * 100);
      if (this.ui.valMaster) this.ui.valMaster.textContent = `${this.ui.sliderMaster.value}%`;
      this.ui.sliderMaster.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        sound.setMasterVolume(val / 100);
        if (this.ui.valMaster) this.ui.valMaster.textContent = `${val}%`;
      });
    }

    if (this.ui.sliderSfx) {
      this.ui.sliderSfx.value = Math.round(sound.sfxVolume * 100);
      if (this.ui.valSfx) this.ui.valSfx.textContent = `${this.ui.sliderSfx.value}%`;
      this.ui.sliderSfx.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        sound.setSfxVolume(val / 100);
        if (this.ui.valSfx) this.ui.valSfx.textContent = `${val}%`;
      });
    }

    if (this.ui.sliderAmbient) {
      this.ui.sliderAmbient.value = Math.round(sound.ambientVolume * 100);
      if (this.ui.valAmbient) this.ui.valAmbient.textContent = `${this.ui.sliderAmbient.value}%`;
      this.ui.sliderAmbient.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        sound.setAmbientVolume(val / 100);
        if (this.ui.valAmbient) this.ui.valAmbient.textContent = `${val}%`;
      });
    }

    if (this.ui.btnToggleShake) {
      this.ui.btnToggleShake.addEventListener('click', () => {
        sound.playClick();
        this.enableScreenShake = !this.enableScreenShake;
        this.ui.btnToggleShake.textContent = this.enableScreenShake ? 'ENABLED' : 'DISABLED';
        this.ui.btnToggleShake.classList.toggle('active', this.enableScreenShake);
      });
    }

    if (this.ui.btnToggleDistortion) {
      this.ui.btnToggleDistortion.addEventListener('click', () => {
        sound.playClick();
        this.enableDistortion = !this.enableDistortion;
        this.ui.btnToggleDistortion.textContent = this.enableDistortion ? 'ENABLED' : 'DISABLED';
        this.ui.btnToggleDistortion.classList.toggle('active', this.enableDistortion);
      });
    }
  }

  toggleMute() {
    const isMuted = sound.toggleMute();
    this.updateMuteUI();
  }

  updateMuteUI() {
    if (this.ui.muteIcon) {
      this.ui.muteIcon.textContent = sound.isMuted ? '🔇' : '🔊';
    }
  }

  showModal(name) {
    if (name === 'how-to-play') {
      this.ui.howToPlayOverlay?.classList.remove('hidden');
    } else if (name === 'level-select') {
      this.ui.levelSelectOverlay?.classList.remove('hidden');
    } else if (name === 'settings') {
      this.ui.settingsOverlay?.classList.remove('hidden');
    }
  }

  hideModal(name) {
    if (name === 'how-to-play') {
      this.ui.howToPlayOverlay?.classList.add('hidden');
    } else if (name === 'level-select') {
      this.ui.levelSelectOverlay?.classList.add('hidden');
    } else if (name === 'settings') {
      this.ui.settingsOverlay?.classList.add('hidden');
    }
  }

  renderLevelSelectGrid() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';

    LEVELS.forEach((level, index) => {
      const isUnlocked = index <= (this.highestUnlockedLevel || 0);
      const card = document.createElement('button');
      card.className = `level-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="level-card-num">LEVEL 0${level.id} ${isUnlocked ? '' : '🔒'}</div>
        <div class="level-card-title">${level.name.split(': ')[1] || level.name}</div>
        <div class="level-card-sub">${isUnlocked ? level.subtitle : 'CLEARANCE RESTRICTED'}</div>
      `;
      if (isUnlocked) {
        card.addEventListener('click', () => {
          sound.init();
          sound.playClick();
          this.hideModal('level-select');
          this.loadLevel(index, true);
          this.state = GAME_STATE.PLAYING;
          this.hideAllOverlays();
        });
      }
      grid.appendChild(card);
    });
  }

  startNewGame() {
    this.currentLevelIndex = 0;
    this.totalGameTime = 0;
    this.totalOrbsCollected = 0;
    this.totalEchoesCreated = 0;
    this.totalParadoxesSolved = 0;
    this.portalBloomActive = false;
    this.portalBloomFactor = 0.0;
    this.loadLevel(0, true);
    this.state = GAME_STATE.PLAYING;
    this.hideAllOverlays();
  }

  loadLevel(index, fullReset = true) {
    this.currentLevelIndex = index;
    const rawLevel = LEVELS[index];
    this.levelData = parseLevel(rawLevel);

    this.orbsCollected = 0;
    this.requiredOrbs = this.levelData.requiredOrbs;
    this.isPortalUnlocked = false;
    this.portalBloomActive = false;
    this.portalBloomFactor = 0.0;
    this.levelTime = 0;
    this.lastCountdownStep = 0;
    this.echoProximityIntensity = 0;
    this.exitAlertTimer = 0;
    this.stabilizedAlertTimer = 0;

    const spawn = this.levelData.playerSpawn;
    if (!this.player || fullReset) {
      this.player = new Player(spawn.x, spawn.y);
    } else {
      this.player.reset(spawn.x, spawn.y, true);
    }

    // Dynamic maxEchoes per level
    this.echoManager.initLevel(this.levelData.cycleDuration, this.levelData.maxEchoes || 1);
    this.particles.clear();

    // Reset cinematic camera & smooth transition
    this.camera = { x: 0, y: 0 };
    this.screenDistortion = { type: null, timer: 0, duration: 0 };
    this.transitionTimer = 0.5;

    // Reset switches and doors
    (this.levelData.switches || []).forEach(sw => sw.isPressed = false);
    (this.levelData.doors || []).forEach(d => {
      d.locked = true;
      d.openProgress = 0.0;
    });

    this.hideEchoWarning();
    if (this.ui.hudExitAlert) this.ui.hudExitAlert.classList.add('hidden');
    if (this.ui.hudStabilizedAlert) this.ui.hudStabilizedAlert.classList.add('hidden');

    this.updateHUD();
  }

  // Checkpoint: Clean puzzle restart on life loss while preserving remaining lives and progression
  restartPuzzleCheckpoint() {
    const remainingLives = this.player ? this.player.lives : CONFIG.PLAYER.START_LIVES;
    sound.playHit();
    if (this.enableScreenShake) this.particles.triggerScreenShake(7);

    // Cleanly reload level puzzle state without resetting lives or level progression
    this.loadLevel(this.currentLevelIndex, false);
    if (this.player) {
      this.player.lives = remainingLives;
      this.player.isDead = false;
      this.player.invulnerableTimer = 1.5; // Brief grace period after respawning
      this.particles.emitFloatingText(`TIMELINE RESET // ${remainingLives} LIVES REMAINING`, this.player.x, this.player.y - 18, '#00f0ff');
    }

    this.state = GAME_STATE.PLAYING;
    this.hideAllOverlays();
    this.updateHUD();
  }

  restartLevel(resetLives = false) {
    const keepLives = !resetLives;
    const currentLives = keepLives ? (this.player ? this.player.lives : CONFIG.PLAYER.START_LIVES) : CONFIG.PLAYER.START_LIVES;

    this.loadLevel(this.currentLevelIndex, false);
    if (this.player) {
      this.player.lives = currentLives > 0 ? currentLives : CONFIG.PLAYER.START_LIVES;
      this.player.isDead = false;
    }

    this.state = GAME_STATE.PLAYING;
    this.hideAllOverlays();
    this.updateHUD();
  }

  nextLevel() {
    if (this.currentLevelIndex < LEVELS.length - 1) {
      this.currentLevelIndex += 1;
      this.loadLevel(this.currentLevelIndex, false);
      this.state = GAME_STATE.PLAYING;
      this.hideAllOverlays();
    } else {
      this.currentLevelIndex = 0;
      this.returnToMenu();
    }
  }

  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.pauseGame();
    } else if (this.state === GAME_STATE.PAUSED) {
      this.resumeGame();
    }
  }

  pauseGame() {
    this.state = GAME_STATE.PAUSED;
    this.ui.pauseOverlay?.classList.remove('hidden');
    if (this.player) this.player.clearKeys();
  }

  resumeGame() {
    this.state = GAME_STATE.PLAYING;
    this.ui.pauseOverlay?.classList.add('hidden');
  }

  returnToMenu() {
    this.state = GAME_STATE.MENU;
    this.hideAllOverlays();
    this.hideEchoWarning();
    this.ui.menuOverlay?.classList.remove('hidden');
    if (this.player) this.player.clearKeys();
  }

  hideAllOverlays() {
    this.ui.menuOverlay?.classList.add('hidden');
    this.ui.pauseOverlay?.classList.add('hidden');
    this.ui.levelCompleteOverlay?.classList.add('hidden');
    this.ui.gameOverOverlay?.classList.add('hidden');
    this.ui.howToPlayOverlay?.classList.add('hidden');
    this.ui.levelSelectOverlay?.classList.add('hidden');
    this.ui.settingsOverlay?.classList.add('hidden');
    this.ui.endingOverlay?.classList.add('hidden');
  }

  // 2. ECHO WARNING: Show "ECHO INCOMING" and 3-2-1 Countdown
  showEchoWarning(step) {
    if (this.ui.hudWarningAlert && this.ui.hudCountdownNum) {
      this.ui.hudWarningAlert.classList.remove('hidden');
      this.ui.hudCountdownNum.textContent = step.toString();
    }
    sound.playEchoWarning(step);
    if (this.enableScreenShake) this.particles.triggerScreenShake(3);
    if (this.enableDistortion) this.triggerScreenEffect('echo_warning', 0.25);
  }

  hideEchoWarning() {
    if (this.ui.hudWarningAlert) {
      this.ui.hudWarningAlert.classList.add('hidden');
    }
  }

  // 5. EXIT PORTAL: Show "EXIT UNLOCKED" Banner
  showExitAlert() {
    if (this.ui.hudExitAlert) {
      this.ui.hudExitAlert.classList.remove('hidden');
      this.exitAlertTimer = 2.8;
    }
  }

  // 6. LEVEL 5 FINALE: Show "MEMORY STABILIZED" Banner & Portal Bloom
  showStabilizedAlert() {
    if (this.ui.hudStabilizedAlert) {
      this.ui.hudStabilizedAlert.classList.remove('hidden');
      this.stabilizedAlertTimer = 5.0;
    }
    this.portalBloomActive = true;
    this.portalBloomFactor = 0.0;
    sound.playFinalNexusActivation();
    if (this.levelData && this.levelData.exitPortal) {
      this.particles.emitPortalWarp(this.levelData.exitPortal.x, this.levelData.exitPortal.y);
      this.particles.emitFloatingText('MEMORY STABILIZED', this.levelData.exitPortal.x, this.levelData.exitPortal.y - 20, '#b967ff');
    }
  }

  triggerManualCycleSync() {
    if (this.state !== GAME_STATE.PLAYING) return;
    const completed = this.echoManager.cycleComplete();
    if (completed) {
      this.totalEchoesCreated += 1;
      this.hideEchoWarning();
      this.lastCountdownStep = 0;
      sound.playEchoSpawn();
      if (this.enableScreenShake) this.particles.triggerScreenShake(6);
      if (this.player) {
        this.particles.emitEchoSpawnWave(this.player.x, this.player.y);
        this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 0.8);
      }
      if (this.enableDistortion) this.triggerScreenEffect('echo_spawn', 0.35);
    }
  }

  // 3. ORB FEEDBACK: Sound, Particles, Floating "+1 MEMORY" text, HUD animation
  handleOrbCollection(orb) {
    orb.collected = true;
    this.orbsCollected += 1;
    this.totalOrbsCollected += 1;
    sound.playOrbCollect(this.orbsCollected);
    this.particles.emitOrbBurst(orb.x, orb.y);
    this.particles.emitFloatingText('+1 MEMORY', orb.x, orb.y, '#ffe600');

    // Trigger subtle HUD animation
    if (this.ui.hudOrbsVal) {
      this.ui.hudOrbsVal.classList.remove('hud-flash');
      void this.ui.hudOrbsVal.offsetWidth; // Reflow
      this.ui.hudOrbsVal.classList.add('hud-flash');
    }

    // Check if exit unlocked
    if (this.orbsCollected >= this.requiredOrbs) {
      this.isPortalUnlocked = true;
      if (this.levelData.isGrandFinal) {
        this.showStabilizedAlert();
      } else {
        this.showExitAlert();
        sound.playExitUnlocked();
      }
      if (this.enableScreenShake) this.particles.triggerScreenShake(8);
    }
    this.updateHUD();
  }

  handleEchoCollision(echo) {
    const tookDamage = this.player.takeDamage();
    if (tookDamage) {
      sound.playHit();
      this.particles.emitParadoxExplosion(this.player.x, this.player.y);
      this.updateHUD();

      if (this.player.isDead) {
        this.triggerGameOver();
      } else {
        // Clean puzzle checkpoint restart while preserving remaining lives and progression
        this.restartPuzzleCheckpoint();
      }
    }
  }

  // 7. LEVEL COMPLETE SCREEN
  triggerLevelComplete() {
    this.highestUnlockedLevel = Math.max(this.highestUnlockedLevel || 0, this.currentLevelIndex + 1);
    this.renderLevelSelectGrid();
    this.state = GAME_STATE.LEVEL_COMPLETE;
    this.hideEchoWarning();
    sound.playLevelComplete();
    this.particles.emitPortalWarp(this.levelData.exitPortal.x, this.levelData.exitPortal.y);

    if (this.ui.completeTime) {
      this.ui.completeTime.textContent = this.formatTime(this.levelTime);
    }
    if (this.ui.completeOrbs) {
      this.ui.completeOrbs.textContent = `${this.orbsCollected} / ${this.requiredOrbs}`;
    }
    if (this.ui.completeCycles) {
      this.ui.completeCycles.textContent = `${this.echoManager.currentCycle}`;
    }
    if (this.ui.completeLives) {
      this.ui.completeLives.textContent = `${this.player.lives} / 3`;
    }

    if (this.ui.completeNextBtn) {
      const isLastLevel = this.currentLevelIndex >= LEVELS.length - 1;
      this.ui.completeNextBtn.textContent = isLastLevel ? 'PROCEED TO NEXUS' : 'NEXT LEVEL';
    }

    this.ui.levelCompleteOverlay?.classList.remove('hidden');
  }

  triggerCinematicEnding() {
    this.highestUnlockedLevel = LEVELS.length - 1;
    this.renderLevelSelectGrid();
    this.state = GAME_STATE.CINEMATIC_ENDING;
    this.hideEchoWarning();
    if (this.ui.hudExitAlert) this.ui.hudExitAlert.classList.add('hidden');
    if (this.ui.hudStabilizedAlert) this.ui.hudStabilizedAlert.classList.add('hidden');
    sound.playEndingFanfare();
    this.particles.emitPortalWarp(this.levelData.exitPortal.x, this.levelData.exitPortal.y);

    // Exact required ending statistics: TIME, ORBS COLLECTED, ECHOES CREATED, PARADOXES SOLVED
    if (this.ui.endingTime) {
      this.ui.endingTime.textContent = this.formatTime(this.totalGameTime);
    }
    if (this.ui.endingOrbs) {
      this.ui.endingOrbs.textContent = `${this.totalOrbsCollected} / 17`;
    }
    if (this.ui.endingEchoes) {
      this.ui.endingEchoes.textContent = `${this.totalEchoesCreated}`;
    }
    if (this.ui.endingParadoxes) {
      this.ui.endingParadoxes.textContent = `${this.totalParadoxesSolved}`;
    }

    this.ui.endingOverlay?.classList.remove('hidden');
  }

  // 6. GAME OVER SCREEN
  triggerGameOver() {
    this.state = GAME_STATE.GAME_OVER;
    this.hideEchoWarning();
    sound.playGameOver();
    this.ui.gameOverOverlay?.classList.remove('hidden');
  }

  // 1. PROFESSIONAL HUD UPDATE
  updateHUD() {
    if (!this.levelData) return;

    // Top Left: Level title & objective
    if (this.ui.hudLevelTitle) {
      const cleanName = this.levelData.name.split(': ')[1] || this.levelData.name;
      this.ui.hudLevelTitle.textContent = `LEVEL 0${this.currentLevelIndex + 1} // ${cleanName}`;
    }

    if (this.ui.hudObjective) {
      if (this.isPortalUnlocked) {
        this.ui.hudObjective.textContent = 'PROCEED TO EXTRACTION PORTAL';
        this.ui.hudObjective.classList.add('unlocked');
      } else {
        this.ui.hudObjective.textContent = `COLLECT ENERGY ORBS [${this.orbsCollected} / ${this.requiredOrbs}]`;
        this.ui.hudObjective.classList.remove('unlocked');
      }
    }

    // Top Right: Orbs, Echoes, Lives, Memory
    if (this.ui.hudOrbsVal) {
      this.ui.hudOrbsVal.textContent = `${this.orbsCollected} / ${this.requiredOrbs}`;
    }

    if (this.ui.hudEchoesVal && this.echoManager) {
      this.ui.hudEchoesVal.textContent = `${this.echoManager.echoes.length} / ${this.echoManager.maxEchoes}`;
    }

    if (this.ui.hudLivesVal && this.player) {
      this.ui.hudLivesVal.textContent = `${this.player.lives}`;
    }

    if (this.ui.hudMemoryVal && this.echoManager) {
      const remaining = this.echoManager.getTimeRemaining();
      this.ui.hudMemoryVal.textContent = `${remaining.toFixed(1)}s`;
    }

    if (this.ui.hudMemoryFill && this.echoManager) {
      const progress = this.echoManager.getProgress();
      this.ui.hudMemoryFill.style.width = `${progress * 100}%`;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  }

  update(dt) {
    if (this.state !== GAME_STATE.PLAYING) return;

    this.levelTime += dt;
    this.totalGameTime += dt;

    // Smooth cinematic camera follow
    this.updateCamera(dt);

    // Decay timers
    if (this.screenDistortion.timer > 0) {
      this.screenDistortion.timer -= dt;
    }
    if (this.transitionTimer > 0) {
      this.transitionTimer -= dt;
    }

    // Exit & Stabilized alert banner timers
    if (this.exitAlertTimer > 0) {
      this.exitAlertTimer -= dt;
      if (this.exitAlertTimer <= 0 && this.ui.hudExitAlert) {
        this.ui.hudExitAlert.classList.add('hidden');
      }
    }
    if (this.stabilizedAlertTimer > 0) {
      this.stabilizedAlertTimer -= dt;
      if (this.stabilizedAlertTimer <= 0 && this.ui.hudStabilizedAlert) {
        this.ui.hudStabilizedAlert.classList.add('hidden');
      }
    }

    // Smoothly expand portal bloom lighting on final level puzzle solved
    if (this.portalBloomActive) {
      this.portalBloomFactor = Math.min(1.0, (this.portalBloomFactor || 0) + dt * 0.45);
    }

    // 2. ECHO WARNING COUNTDOWN: 3, 2, 1
    const remainingTime = this.echoManager.getTimeRemaining();
    if (remainingTime <= 3.0 && remainingTime > 0) {
      if (remainingTime <= 3.0 && remainingTime > 2.0 && this.lastCountdownStep < 1) {
        this.lastCountdownStep = 1;
        this.showEchoWarning(3);
      } else if (remainingTime <= 2.0 && remainingTime > 1.0 && this.lastCountdownStep < 2) {
        this.lastCountdownStep = 2;
        this.showEchoWarning(2);
      } else if (remainingTime <= 1.0 && remainingTime > 0.05 && this.lastCountdownStep < 3) {
        this.lastCountdownStep = 3;
        this.showEchoWarning(1);
      }
    }

    // Ambient particle sparkles around orbs and switches
    this.ambientParticleTimer += dt;
    if (this.ambientParticleTimer >= 0.12) {
      this.ambientParticleTimer = 0;
      if (this.levelData.orbs) {
        for (const orb of this.levelData.orbs) {
          if (!orb.collected) {
            this.particles.emitOrbAmbient(orb.x, orb.y);
          }
        }
      }
      if (this.levelData.switches) {
        for (const sw of this.levelData.switches) {
          const swColor = sw.type === 'player' ? CONFIG.SWITCH.COLOR_PLAYER : CONFIG.SWITCH.COLOR_ECHO;
          this.particles.emitSwitchAmbient(sw.x, sw.y, swColor);
        }
      }
    }

    // 1. Check Paradox Zones (Rewind Player position by 3s, Echoes do NOT rewind)
    for (const zone of (this.levelData.paradoxZones || [])) {
      if (this.player.x >= zone.x && this.player.x <= zone.x + zone.width &&
          this.player.y >= zone.y && this.player.y <= zone.y + zone.height) {
        const rewindResult = this.player.rewindPosition(CONFIG.PARADOX_ZONE.REWIND_SECONDS);
        if (rewindResult) {
          this.totalParadoxesSolved += 1;
          sound.playParadoxRewind();
          this.particles.emitParadoxRewind(rewindResult.oldPos.x, rewindResult.oldPos.y);
          this.particles.emitFloatingText('PARADOX REWIND -3s', this.player.x, this.player.y, '#ff2a6d');
          if (this.enableDistortion) this.triggerScreenEffect('paradox_warp', 0.45);
          break;
        }
      }
    }

    // 4. Smooth door opening progression
    for (const door of (this.levelData.doors || [])) {
      const target = door.locked ? 0.0 : 1.0;
      if (door.openProgress === undefined) door.openProgress = target;
      door.openProgress += (target - door.openProgress) * Math.min(1, dt * 6.0);
    }

    // 4. Check Switches & Security Doors
    for (const sw of (this.levelData.switches || [])) {
      let isSteppedOn = false;

      if (sw.type === 'player') {
        // Player-only biometric switch
        const pdx = this.player.x - sw.x;
        const pdy = this.player.y - sw.y;
        if (Math.hypot(pdx, pdy) < (this.player.radius + sw.radius)) {
          isSteppedOn = true;
        }
      } else if (sw.type === 'echo') {
        // Echo-only temporal switch
        for (const echo of this.echoManager.echoes) {
          if (echo.active) {
            const edx = echo.x - sw.x;
            const edy = echo.y - sw.y;
            if (Math.hypot(edx, edy) < (echo.radius + sw.radius)) {
              isSteppedOn = true;
              break;
            }
          }
        }
      }

      if (isSteppedOn !== sw.isPressed) {
        sw.isPressed = isSteppedOn;
        if (isSteppedOn) {
          sound.playSwitchActivate(sw.type);
          if (sw.type === 'player') {
            this.particles.emitSwitchSparks(sw.x, sw.y, CONFIG.SWITCH.COLOR_PLAYER);
            this.particles.emitFloatingText('BIOMETRIC CONFIRMED', sw.x, sw.y, '#00f0ff');
          } else {
            this.particles.emitSwitchSparks(sw.x, sw.y, CONFIG.SWITCH.COLOR_ECHO);
            this.particles.emitFloatingText('TEMPORAL SIGNATURE VERIFIED', sw.x, sw.y, '#b967ff');
          }
        }

        // Toggle target security door
        for (const door of (this.levelData.doors || [])) {
          if (door.id === sw.targetDoorId) {
            const wasLocked = door.locked;
            door.locked = !isSteppedOn;
            if (wasLocked && !door.locked) {
              sound.playDoorOpen();
              this.particles.emitDoorSteam(door.x, door.y, door.width, door.height);
              if (this.enableScreenShake) this.particles.triggerScreenShake(3);
            }
          }
        }
      }
    }

    // Construct obstacle list for Player collision (Walls + Locked Doors)
    const closedDoors = (this.levelData.doors || []).filter(d => d.locked);
    const activeObstacles = [...this.levelData.walls, ...closedDoors];

    // Update Player
    this.player.update(dt, activeObstacles, this.particles);

    // Record Timeline Sample
    this.echoManager.recordSample(this.player, dt);

    // Check Cycle Expiration & Echo Creation
    if (this.echoManager.recordTimer >= this.echoManager.cycleDuration) {
      const didComplete = this.echoManager.cycleComplete();
      if (didComplete) {
        this.totalEchoesCreated += 1;
        this.hideEchoWarning();
        this.lastCountdownStep = 0;
        sound.playEchoSpawn();
        if (this.enableScreenShake) this.particles.triggerScreenShake(7);
        if (this.player) {
          this.particles.emitEchoSpawnWave(this.player.x, this.player.y);
          // Brief manifestation grace period to prevent instant frame-0 telefragging
          this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 0.8);
        }
        if (this.enableDistortion) this.triggerScreenEffect('echo_spawn', 0.35);
      }
    }

    // Update Echoes and Detect Paradox Collisions (consistent door obstruction)
    this.echoManager.update(dt, this.player, this.particles, closedDoors, (echo) => {
      this.handleEchoCollision(echo);
    });

    // 10. Echo Proximity Warning (Heartbeat / sonar ping and distortion when near Echo)
    let minEchoDist = Infinity;
    for (const echo of this.echoManager.echoes) {
      if (echo.active) {
        const d = Math.hypot(this.player.x - echo.x, this.player.y - echo.y);
        if (d < minEchoDist) minEchoDist = d;
      }
    }
    if (minEchoDist < 95 && !this.player.isDead) {
      sound.playEchoProximity(minEchoDist);
      this.echoProximityIntensity = Math.min(1, Math.max(0, 1 - minEchoDist / 95));
    } else {
      this.echoProximityIntensity = 0;
    }

    // Check Orbs Collision
    for (const orb of this.levelData.orbs) {
      if (!orb.collected) {
        const dx = this.player.x - orb.x;
        const dy = this.player.y - orb.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (this.player.radius + CONFIG.ORB.RADIUS + 4)) {
          this.handleOrbCollection(orb);
        }
      }
    }

    // Check Exit Portal Collision
    if (this.isPortalUnlocked) {
      const portal = this.levelData.exitPortal;
      const dx = this.player.x - portal.x;
      const dy = this.player.y - portal.y;
      const dist = Math.hypot(dx, dy);
      const portalRadius = portal.isGrand ? CONFIG.PORTAL.GRAND_RADIUS : CONFIG.PORTAL.RADIUS;
      if (dist < (this.player.radius + portalRadius - 4)) {
        if (this.levelData.isGrandFinal) {
          this.triggerCinematicEnding();
        } else {
          this.triggerLevelComplete();
        }
      }
    }

    // Update Particles & World Renderer
    this.particles.update(dt);
    this.renderer.update(dt);

    this.updateHUD();
  }

  triggerScreenEffect(type, duration = 0.4) {
    if (!this.enableDistortion) return;
    this.screenDistortion = {
      type,
      timer: duration,
      duration
    };
  }

  updateCamera(dt) {
    if (!this.player || this.state !== GAME_STATE.PLAYING) return;

    // Subtle cinematic camera follow towards operative
    const targetOffsetX = (CONFIG.CANVAS_WIDTH / 2 - this.player.x) * 0.04;
    const targetOffsetY = (CONFIG.CANVAS_HEIGHT / 2 - this.player.y) * 0.04;

    // Clamped gently between -14 and +14 to keep boundaries crisp and readable
    const maxOffset = 14;
    const clampedTargetX = Math.max(-maxOffset, Math.min(maxOffset, targetOffsetX));
    const clampedTargetY = Math.max(-maxOffset, Math.min(maxOffset, targetOffsetY));

    // Smooth exponential damping
    const lerpSpeed = 4.0;
    this.camera.x += (clampedTargetX - this.camera.x) * Math.min(1, dt * lerpSpeed);
    this.camera.y += (clampedTargetY - this.camera.y) * Math.min(1, dt * lerpSpeed);
  }

  renderScreenDistortion() {
    const ctx = this.ctx;
    const w = CONFIG.CANVAS_WIDTH;
    const h = CONFIG.CANVAS_HEIGHT;

    ctx.save();

    // 1. Timed Screen Distortion Effects
    if (this.screenDistortion.timer > 0 && this.enableDistortion) {
      const progress = this.screenDistortion.timer / this.screenDistortion.duration;

      if (this.screenDistortion.type === 'echo_spawn') {
        const alpha = progress * 0.35;
        ctx.fillStyle = `rgba(185, 103, 255, ${alpha * 0.4})`;
        ctx.fillRect(-32, -32, w + 64, h + 64);

        ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.45})`;
        const sliceCount = 4;
        for (let i = 0; i < sliceCount; i++) {
          const sliceY = (Math.sin(i * 37.5 + this.levelTime * 20) * 0.5 + 0.5) * h;
          const sliceH = 4 + Math.random() * 8;
          const shiftX = (Math.random() - 0.5) * 24 * progress;
          ctx.fillRect(shiftX - 32, sliceY, w + 64, sliceH);
        }
      } else if (this.screenDistortion.type === 'echo_warning') {
        const alpha = progress * 0.22;
        ctx.fillStyle = `rgba(255, 42, 109, ${alpha})`;
        ctx.fillRect(-32, -32, w + 64, h + 64);
      } else if (this.screenDistortion.type === 'paradox_warp') {
        const alpha = progress * 0.42;
        ctx.fillStyle = `rgba(255, 30, 80, ${alpha * 0.35})`;
        ctx.fillRect(-32, -32, w + 64, h + 64);

        if (this.player) {
          const rippleRadius = (1 - progress) * 160;
          ctx.strokeStyle = `rgba(255, 42, 109, ${alpha * 0.8})`;
          ctx.lineWidth = 3 * progress;
          ctx.beginPath();
          ctx.arc(this.player.x, this.player.y, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 1.5 * progress;
          ctx.beginPath();
          ctx.arc(this.player.x, this.player.y, rippleRadius * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
        for (let y = 0; y < h; y += 40) {
          const jitter = (Math.random() - 0.5) * 16 * progress;
          ctx.fillRect(jitter - 32, y, w + 64, 2);
        }
      }
    }

    // 2. Continuous Proximity Distortion when near Echo
    if (this.echoProximityIntensity > 0 && this.enableDistortion) {
      const p = this.echoProximityIntensity;
      ctx.fillStyle = `rgba(185, 103, 255, ${p * 0.1})`;
      ctx.fillRect(-32, -32, w + 64, h + 64);

      ctx.fillStyle = `rgba(255, 255, 255, ${p * 0.12})`;
      for (let y = 0; y < h; y += 50) {
        const jitter = (Math.random() - 0.5) * 10 * p;
        ctx.fillRect(jitter - 32, y, w + 64, 1.5);
      }
    }

    // 3. Danger vignette when 1 life remaining
    if (this.player && this.player.lives === 1 && !this.player.isDead) {
      const pulse = Math.sin(this.levelTime * 5) * 0.12 + 0.18;
      const dGrad = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.38,
        w / 2, h / 2, Math.max(w, h) * 0.72
      );
      dGrad.addColorStop(0, 'rgba(255, 42, 109, 0)');
      dGrad.addColorStop(1, `rgba(255, 20, 60, ${pulse})`);
      ctx.fillStyle = dGrad;
      ctx.fillRect(-32, -32, w + 64, h + 64);
    }

    ctx.restore();
  }

  renderTransition() {
    if (this.transitionTimer <= 0) return;
    const alpha = Math.max(0, Math.min(1, this.transitionTimer / 0.5));
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(4, 7, 14, ${alpha})`;
    ctx.fillRect(-32, -32, CONFIG.CANVAS_WIDTH + 64, CONFIG.CANVAS_HEIGHT + 64);
    ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Apply Cinematic Camera Movement & Screen Shake
    const shake = this.enableScreenShake ? this.particles.getShakeOffset() : { x: 0, y: 0 };
    const totalOffsetX = this.camera.x + shake.x;
    const totalOffsetY = this.camera.y + shake.y;

    this.ctx.save();
    this.ctx.translate(totalOffsetX, totalOffsetY);

    if (this.levelData && this.state !== GAME_STATE.MENU) {
      // 1. Facility Floor Grid
      this.renderer.renderFloor(this.levelData.walls);

      // 2. Atmospheric Volumetric Fog
      this.renderer.renderAtmosphericFog();

      // 3. Paradox Zones
      this.renderer.renderParadoxZones(this.levelData.paradoxZones);

      // 4. Switch Conduits (Floor circuit cables linking switches to doors)
      this.renderer.renderSwitchConduits(this.levelData.switches, this.levelData.doors);

      // 5. Switches (Animated)
      this.renderer.renderSwitches(this.levelData.switches);

      // 6. Exit Portal
      this.renderer.renderPortal(this.levelData.exitPortal, this.isPortalUnlocked, this.particles);

      // 6. Energy Orbs
      this.renderer.renderOrbs(this.levelData.orbs);

      // 7. Security Blast Doors (Smooth sliding animation)
      this.renderer.renderDoors(this.levelData.doors);

      // 8. Facility Walls & Machinery Consoles
      this.renderer.renderWalls(this.levelData.walls);

      // 9. Echo Hologram Apparitions
      this.echoManager.render(this.ctx);

      // 10. Operative Player Silhouette
      this.player.render(this.ctx);

      // 11. Particles & Floating Sci-Fi Texts
      this.particles.render(this.ctx);

      // 12. Airborne Atmospheric Dust Motes
      this.renderer.renderAtmosphericMotes();

      // 13. Dynamic 2D Lighting Overlay & Vignette (with Level 5 Portal Bloom expansion)
      if (this.levelData.exitPortal) {
        this.levelData.exitPortal.bloom = this.portalBloomActive;
        this.levelData.exitPortal.bloomFactor = this.portalBloomFactor || 0;
      }
      this.renderer.renderLighting(
        this.player,
        this.echoManager.echoes,
        this.levelData.orbs,
        this.levelData.exitPortal,
        this.isPortalUnlocked,
        this.levelData.paradoxZones,
        this.levelData.switches,
        this.levelData.doors
      );

      // 14. Screen Distortion & Proximity Glitch Overlay
      this.renderScreenDistortion();

      // 15. Smooth Level Transition Fade
      this.renderTransition();
    } else {
      // Main Menu Cinematic Animated Background
      const menuCamX = Math.sin(performance.now() * 0.0004) * 10;
      const menuCamY = Math.cos(performance.now() * 0.0003) * 6;
      this.ctx.translate(menuCamX, menuCamY);

      this.ctx.fillStyle = '#060a12';
      this.ctx.fillRect(-32, -32, CONFIG.CANVAS_WIDTH + 64, CONFIG.CANVAS_HEIGHT + 64);
      this.renderer.renderFloor([]);
      this.renderer.renderAtmosphericFog();
      this.renderer.renderAtmosphericMotes();
    }

    this.ctx.restore();
  }

  start() {
    this.lastTime = performance.now();
    const loop = (currentTime) => {
      const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
      this.lastTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
