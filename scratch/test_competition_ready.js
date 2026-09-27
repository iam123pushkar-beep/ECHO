/**
 * ECHO - Competition Ready Final QA Verification
 */
import { CONFIG } from '../js/constants.js';
import { LEVELS, parseLevel } from '../js/levels.js';
import { Player } from '../js/player.js';
import { EchoManager, EchoEntity } from '../js/echo.js';
import { ParticleSystem } from '../js/particles.js';
import { WorldRenderer } from '../js/renderer.js';

// Setup Mock DOM
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c); else this.classes.delete(c);
    } else {
      if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
    }
  }
}

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag;
    this.classList = new MockClassList();
    this.listeners = {};
    this.textContent = '';
    this.innerHTML = '';
    this.value = '0.5';
    this.style = {};
    this.children = [];
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  appendChild(child) {
    this.children.push(child);
  }
  click() {
    if (this.listeners['click']) {
      for (const fn of this.listeners['click']) fn();
    }
  }
}

const elements = {};
function getElem(id) {
  if (!elements[id]) elements[id] = new MockElement(id);
  return elements[id];
}

global.document = {
  getElementById: (id) => getElem(id),
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 960,
        height: 640,
        getContext: () => ({
          save() {}, restore() {}, translate() {}, rotate() {},
          beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
          arc() {}, ellipse() {}, rect() {}, fillRect() {}, strokeRect() {},
          clearRect() {}, fill() {}, stroke() {}, drawImage() {},
          createRadialGradient: () => ({ addColorStop() {} }),
          createLinearGradient: () => ({ addColorStop() {} })
        })
      };
    }
    return new MockElement('', tag);
  }
};

global.window = {
  listeners: {},
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  },
  triggerKey(evtName, code) {
    let prevented = false;
    const evt = { code, preventDefault: () => { prevented = true; } };
    if (this.listeners[evtName]) {
      for (const fn of this.listeners[evtName]) fn(evt);
    }
    return prevented;
  },
  triggerWindow(evtName) {
    if (this.listeners[evtName]) {
      for (const fn of this.listeners[evtName]) fn();
    }
  },
  AudioContext: class {
    createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null }; }
    createBuffer() { return { getChannelData() { return new Float32Array(100); } }; }
    createBiquadFilter() { return { connect() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { setValueAtTime() {}, value: 1 } }; }
    get currentTime() { return Date.now() / 1000; }
    get sampleRate() { return 44100; }
  },
  webkitAudioContext: class {}
};

global.performance = { now: () => Date.now() };

let passed = 0;
let total = 0;

function test(desc, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${desc}`);
  } else {
    console.error(`  [FAIL] ${desc}`);
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('ECHO - COMPETITION READY FINAL AUDIT');
  console.log('================================================================\n');

  const { Game, GAME_STATE } = await import('../js/game.js');
  const mockCanvas = document.createElement('canvas');
  const game = new Game(mockCanvas);

  console.log('AUDIT SECTION 1: Game State & Navigation Flow');
  test('Initial state is MENU', game.state === GAME_STATE.MENU);

  // How to Play modal opened from menu
  getElem('btn-how-to-play').click();
  test('How To Play modal displayed', !getElem('how-to-play-overlay').classList.contains('hidden'));

  // Escape key closes modal while in MENU
  window.triggerKey('keydown', 'Escape');
  test('Escape dismisses How To Play modal', getElem('how-to-play-overlay').classList.contains('hidden'));

  // Open How to Play and start mission directly
  getElem('btn-how-to-play').click();
  getElem('btn-how-to-play-start').click();
  test('START MISSION starts Game into Level 1', game.state === GAME_STATE.PLAYING && game.currentLevelIndex === 0);

  console.log('\nAUDIT SECTION 2: Input & Control Responsiveness');
  // Arrow keys preventDefault test
  const upPrevented = window.triggerKey('keydown', 'ArrowUp');
  test('ArrowUp triggers preventDefault to block page scrolling', upPrevented === true);
  const spacePrevented = window.triggerKey('keydown', 'Space');
  test('Space triggers preventDefault', spacePrevented === true);

  // Key movement
  test('Player keys registered up', game.player.keys.up === true);
  window.triggerKey('keyup', 'ArrowUp');
  test('Player keys cleared on keyup', game.player.keys.up === false);

  // WASD movement
  window.triggerKey('keydown', 'KeyD');
  test('KeyD registered right', game.player.keys.right === true);
  window.triggerKey('keyup', 'KeyD');
  test('KeyD cleared on keyup', game.player.keys.right === false);

  // Window blur pauses game & clears keys
  window.triggerKey('keydown', 'KeyW');
  window.triggerWindow('blur');
  test('Blur pauses game', game.state === GAME_STATE.PAUSED);
  test('Blur clears keys', game.player.keys.up === false);

  // Resume with Escape
  window.triggerKey('keydown', 'Escape');
  test('Escape resumes paused game', game.state === GAME_STATE.PLAYING);

  // Pause with Escape
  window.triggerKey('keydown', 'Escape');
  test('Escape pauses playing game', game.state === GAME_STATE.PAUSED);
  window.triggerKey('keydown', 'Escape'); // back to playing

  console.log('\nAUDIT SECTION 3: Performance & Memory Architecture');
  // Renderer floor cache exists
  test('Floor canvas pre-rendering initialized', game.renderer.floorCanvas !== null);
  test('Static vignette gradient cached', game.renderer.vignetteGrad !== null);

  // Particle System Performance Cap
  for (let i = 0; i < 350; i++) {
    game.particles.emitPlayerTrail(100, 100, 0);
  }
  game.particles.update(0.016);
  test('Particle system enforces performance safety cap (<= 250)', game.particles.particles.length <= 250);

  // Echo cursor optimization
  const path = [];
  for (let t = 0; t <= 10; t += 0.016) {
    path.push({ x: t * 10, y: 100, angle: 0, time: t });
  }
  const echo = new EchoEntity(path, 10, 0);
  test('Echo initial pathIndex is 0', echo.pathIndex === 0);
  echo.playbackTime = 3.0;
  echo.update(0.016, null, []);
  test('Echo monotonic cursor updated forward', echo.pathIndex > 100);
  echo.resetPlayback();
  test('Echo resetPlayback resets pathIndex to 0', echo.pathIndex === 0);

  console.log('\nAUDIT SECTION 4: 5-Level Campaign Progression');
  for (let lvl = 0; lvl < 5; lvl++) {
    game.loadLevel(lvl, false);
    test(`Level ${lvl + 1} (${game.levelData.name}) loaded correctly`, game.currentLevelIndex === lvl);
    test(`Level ${lvl + 1} has valid player spawn`, game.levelData.playerSpawn.x > 0 && game.levelData.playerSpawn.y > 0);
    test(`Level ${lvl + 1} requires > 0 orbs`, game.requiredOrbs > 0);
    test(`Level ${lvl + 1} exit portal defined`, game.levelData.exitPortal !== null);
  }

  console.log('\nAUDIT SECTION 5: Checkpoints, Lives & Game Over');
  game.loadLevel(1, true); // Level 2
  test('Player starts with 3 lives', game.player.lives === 3);

  // Take damage with lives remaining
  game.handleEchoCollision({ active: true });
  test('Taking damage preserves current level (Level 2)', game.currentLevelIndex === 1);
  test('Lives decremented to 2', game.player.lives === 2);
  test('Player revived with invulnerability window', game.player.isDead === false && game.player.invulnerableTimer > 0);

  // Game over check
  game.player.lives = 1;
  game.player.invulnerableTimer = 0;
  game.handleEchoCollision({ active: true });
  test('Zero lives triggers GAME_OVER state', game.state === GAME_STATE.GAME_OVER);
  test('Game Over overlay displayed', !getElem('game-over-overlay').classList.contains('hidden'));

  // Retry button restores 3 lives on same level
  getElem('btn-gameover-retry').click();
  test('Retry restores 3 lives', game.player.lives === 3);
  test('Retry stays on Level 2 (no reset to level 1)', game.currentLevelIndex === 1);
  test('State restored to PLAYING', game.state === GAME_STATE.PLAYING);

  console.log('\nAUDIT SECTION 6: Level 5 Finale & Cinematic Ending');
  game.loadLevel(4, false); // Level 5
  test('Level 5 is marked as Grand Final', game.levelData.isGrandFinal === true);

  // Collect all orbs in Level 5
  for (const orb of game.levelData.orbs) {
    game.handleOrbCollection(orb);
  }
  test('Collecting all orbs unlocks Grand Exit Portal', game.isPortalUnlocked === true);
  test('Level 5 triggers MEMORY STABILIZED banner', !getElem('hud-stabilized-alert').classList.contains('hidden'));
  test('Portal bloom lighting active', game.portalBloomActive === true);

  // Bloom factor increases smoothly
  game.update(0.5);
  test('Portal bloomFactor ramps smoothly over time', game.portalBloomFactor > 0);

  // Step on exit portal -> triggers cinematic ending
  game.player.x = game.levelData.exitPortal.x;
  game.player.y = game.levelData.exitPortal.y;
  game.update(0.016);
  test('Stepping into Grand Portal triggers CINEMATIC_ENDING', game.state === GAME_STATE.CINEMATIC_ENDING);
  test('Ending overlay displayed', !getElem('ending-overlay').classList.contains('hidden'));

  // Verify all 4 exact required statistics displayed
  test('Ending stat TIME populated', getElem('ending-time').textContent.length > 0);
  test('Ending stat ORBS COLLECTED shows cumulative orbs', getElem('ending-orbs').textContent.includes('/'));
  test('Ending stat ECHOES CREATED populated', getElem('ending-echoes').textContent.length > 0);
  test('Ending stat PARADOXES SOLVED populated', getElem('ending-paradoxes').textContent.length > 0);

  // Play Again from ending
  getElem('btn-ending-replay').click();
  test('PLAY AGAIN restarts at Level 1 in PLAYING state', game.state === GAME_STATE.PLAYING && game.currentLevelIndex === 0);

  console.log('\n================================================================');
  console.log(`TOTAL AUDIT CHECKS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${total - passed}`);
  console.log('================================================================');

  if (passed === total) {
    console.log('\n>>> COMPETITION AUDIT PASSED: 100% SUCCESS RATE! <<<');
  } else {
    throw new Error(`${total - passed} checks failed in competition audit!`);
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
