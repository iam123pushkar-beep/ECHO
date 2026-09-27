/**
 * ECHO - End-to-End Complete Campaign Simulation Test
 * Simulates the entire game from Main Menu through Level 1..5 to Cinematic Ending and Level Select.
 */

// Mock DOM & Browser Environment
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
  }
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  rect() {}
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fill() {}
  stroke() {}
  roundRect() {}
  setLineDash() {}
  drawImage() {}
  fillText() {}
  createRadialGradient() { return { addColorStop() {} }; }
  createLinearGradient() { return { addColorStop() {} }; }
}

class MockCanvas {
  constructor() {
    this.width = 960;
    this.height = 640;
  }
  getContext() {
    return new MockCanvasContext();
  }
}

const mockElements = {};
function getOrCreateElement(id) {
  if (!mockElements[id]) {
    mockElements[id] = {
      id,
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this.classes.add(c); else this.classes.delete(c);
          } else {
            if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
          }
        },
        contains(c) { return this.classes.has(c); }
      },
      listeners: {},
      addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
      },
      click() {
        if (this.listeners['click']) {
          this.listeners['click'].forEach(fn => fn({ target: this }));
        }
      },
      appendChild(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
      },
      children: [],
      set innerHTML(val) {
        this._html = val;
        if (val === '') this.children = [];
      },
      get innerHTML() {
        return this._html || '';
      },
      textContent: '',
      value: '50',
      style: {}
    };
  }
  return mockElements[id];
}

global.document = {
  createElement(tag) {
    if (tag === 'canvas') return new MockCanvas();
    return getOrCreateElement('elem_' + Math.random().toString(36).substr(2, 6));
  },
  getElementById(id) {
    return getOrCreateElement(id);
  }
};

global.window = {
  addEventListener() {},
  AudioContext: class {
    createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } }; }
    createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
    createBiquadFilter() { return { connect() {}, frequency: { value: 1000, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, Q: { value: 1 } }; }
    createBuffer() { return { getChannelData() { return new Float32Array(100); } }; }
    resume() {}
    currentTime = 0;
  },
  webkitAudioContext: class {}
};

global.performance = { now: () => Date.now() };

let testsPassed = 0;
let testsFailed = 0;

function check(condition, msg) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ [PASS] ${msg}`);
  } else {
    testsFailed++;
    console.error(`  ✗ [FAIL] ${msg}`);
  }
}

async function runCampaignSimulation() {
  console.log('================================================================');
  console.log('ECHO - END-TO-END CAMPAIGN SIMULATION');
  console.log('================================================================\n');

  const { Game, GAME_STATE } = await import('../js/game.js');
  const canvas = new MockCanvas();
  const game = new Game(canvas);

  // 1. Initial State: Main Menu
  console.log('PHASE 1: Main Menu & Controls');
  check(game.state === GAME_STATE.MENU, 'Game starts in MENU state');
  check(!game.ui.menuOverlay.classList.contains('hidden'), 'Main menu overlay is visible initially');

  // 2. Start Game: Level 1
  console.log('\nPHASE 2: Level 1 (Sector 01: The First Echo)');
  document.getElementById('btn-start-game').click();
  check(game.state === GAME_STATE.PLAYING, 'Clicking PLAY transitions to PLAYING state');
  check(game.currentLevelIndex === 0, 'Current level is Level 1 (Sector 01)');
  check(game.levelData.cycleDuration === 10.0, 'Level 1 cycle duration is 10s');
  check(game.orbsCollected === 0, 'Level 1 orbs collected initialized to 0');
  check(game.requiredOrbs === 3, 'Level 1 requires 3 orbs');

  // Collect all 3 orbs in Level 1
  for (const orb of game.levelData.orbs) {
    game.handleOrbCollection(orb);
  }
  check(game.orbsCollected === 3, 'All 3 orbs collected in Level 1');
  check(game.isPortalUnlocked === true, 'Exit portal unlocked after collecting all orbs');
  check(!game.ui.hudExitAlert.classList.contains('hidden'), 'EXIT UNLOCKED alert banner displayed');

  // Step on exit portal
  game.triggerLevelComplete();
  check(game.state === GAME_STATE.LEVEL_COMPLETE, 'Stepping on exit portal triggers LEVEL_COMPLETE state');
  check(game.highestUnlockedLevel >= 1, 'Sector 02 unlocked after completing Level 1');

  // 3. Level 2: Checkpoint & Multi-Echo
  console.log('\nPHASE 3: Level 2 (Sector 02: Multiple Echoes)');
  game.nextLevel();
  check(game.currentLevelIndex === 1, 'Advanced to Level 2 (Sector 02)');
  check(game.levelData.cycleDuration === 9.0, 'Level 2 cycle duration is 9.0s');
  check(game.levelData.maxEchoes === 3, 'Level 2 allows up to 3 Echoes');

  // Collect 2 orbs
  game.handleOrbCollection(game.levelData.orbs[0]);
  game.handleOrbCollection(game.levelData.orbs[1]);
  check(game.orbsCollected === 2, 'Collected 2 of 4 orbs in Level 2');

  // Test Checkpoint Recovery: simulate echo collision
  console.log('  Testing Checkpoint on life loss:');
  const livesBefore = game.player.lives;
  game.handleEchoCollision({ active: true });
  check(game.player.lives === livesBefore - 1, `Lives reduced from ${livesBefore} to ${game.player.lives}`);
  check(game.currentLevelIndex === 1, 'Current level preserved at Level 2 (no reset to level 1)');
  check(game.orbsCollected === 0, 'Level 2 puzzle state reset cleanly for retry');
  check(game.state === GAME_STATE.PLAYING, 'Game remains in PLAYING state after checkpoint respawn');

  // Collect all 4 orbs and exit Level 2
  for (const orb of game.levelData.orbs) {
    game.handleOrbCollection(orb);
  }
  check(game.isPortalUnlocked === true, 'Exit portal unlocked in Level 2');
  game.triggerLevelComplete();
  check(game.highestUnlockedLevel >= 2, 'Sector 03 unlocked after completing Level 2');

  // 4. Level 3: Paradox Zones
  console.log('\nPHASE 4: Level 3 (Sector 03: Paradox Zones)');
  game.nextLevel();
  check(game.currentLevelIndex === 2, 'Advanced to Level 3');
  check(game.levelData.paradoxZones.length > 0, 'Level 3 contains Paradox Zones');

  // Simulate stepping into Paradox Zone
  const initialParadoxCount = game.totalParadoxesSolved;
  const pZone = game.levelData.paradoxZones[0];
  // Add some history to player
  for (let t = 0; t < 3.5; t += 0.1) {
    game.player.x = 200 + t * 10;
    game.player.y = 200;
    game.player.update(0.1, [], null);
  }
  game.player.x = pZone.x + 5;
  game.player.y = pZone.y + 5;
  game.update(0.016); // Run frame update
  check(game.totalParadoxesSolved > initialParadoxCount, 'Paradox rewind tracked in totalParadoxesSolved');
  check(game.player.invulnerableTimer >= 1.0, 'Player received invulnerability grace period after rewind');

  // Collect all 3 orbs and exit Level 3
  for (const orb of game.levelData.orbs) {
    game.handleOrbCollection(orb);
  }
  game.triggerLevelComplete();
  check(game.highestUnlockedLevel >= 3, 'Sector 04 unlocked after completing Level 3');

  // 5. Level 4: Switches & Security Doors
  console.log('\nPHASE 5: Level 4 (Sector 04: Switches & Security Doors)');
  game.nextLevel();
  check(game.currentLevelIndex === 3, 'Advanced to Level 4');
  const switchB = game.levelData.switches.find(s => s.type === 'player');
  const switchR = game.levelData.switches.find(s => s.type === 'echo');
  const door1 = game.levelData.doors.find(d => d.id === 'door-1');
  const door2 = game.levelData.doors.find(d => d.id === 'door-2');

  check(switchB !== undefined, 'Blue Player switch exists in Level 4');
  check(switchR !== undefined, 'Red Echo switch exists in Level 4');
  check(door1.locked === true, 'Door 1 is locked initially');
  check(door2.locked === true, 'Door 2 is locked initially');

  // Step on Blue switch
  game.player.x = switchB.x;
  game.player.y = switchB.y;
  game.update(0.016);
  check(door1.locked === false, 'Door 1 unlocks when Player steps on Blue Switch');

  // Collect orbs and complete Level 4
  for (const orb of game.levelData.orbs) {
    game.handleOrbCollection(orb);
  }
  game.triggerLevelComplete();
  check(game.highestUnlockedLevel >= 4, 'Sector 05 unlocked after completing Level 4');

  // 6. Level 5: The Final Paradox & Finale
  console.log('\nPHASE 6: Level 5 (Sector 05: The Final Paradox)');
  game.nextLevel();
  check(game.currentLevelIndex === 4, 'Advanced to Level 5 (The Final Paradox)');
  check(game.levelData.isGrandFinal === true, 'Level 5 recognized as Grand Final Sector');
  check(game.levelData.exitPortal.isGrand === true, 'Grand Exit Portal active');

  // Collect 3 of 4 orbs
  game.handleOrbCollection(game.levelData.orbs[0]);
  game.handleOrbCollection(game.levelData.orbs[1]);
  game.handleOrbCollection(game.levelData.orbs[2]);
  check(game.isPortalUnlocked === false, 'Exit locked before final orb');

  // Collect 4th (final) orb
  game.handleOrbCollection(game.levelData.orbs[3]);
  check(game.isPortalUnlocked === true, 'Final exit portal unlocked');
  check(game.portalBloomActive === true, 'Portal lighting bloom activated on final puzzle solve');
  check(!game.ui.hudStabilizedAlert.classList.contains('hidden'), 'MEMORY STABILIZED banner displayed');

  // Step into Grand Exit Portal
  console.log('\nPHASE 7: Cinematic Ending Sequence');
  game.triggerCinematicEnding();
  check(game.state === GAME_STATE.CINEMATIC_ENDING, 'Game enters CINEMATIC_ENDING state');
  check(!game.ui.endingOverlay.classList.contains('hidden'), 'Ending modal displayed');

  // Verify ending statistics
  check(document.getElementById('ending-time').textContent.length > 0, 'TIME stat displayed');
  check(document.getElementById('ending-orbs').textContent.includes('17'), 'ORBS COLLECTED stat accurately shows 17 orbs');
  check(parseInt(document.getElementById('ending-echoes').textContent, 10) >= 0, 'ECHOES CREATED stat displayed');
  check(parseInt(document.getElementById('ending-paradoxes').textContent, 10) >= 1, 'PARADOXES SOLVED stat displayed');

  // Verify ending buttons
  const replayBtn = document.getElementById('btn-ending-replay');
  const menuBtn = document.getElementById('btn-ending-menu');
  check(replayBtn !== null, 'PLAY AGAIN button exists');
  check(menuBtn !== null, 'MAIN MENU button exists');

  // Test Return to Menu & Level Select
  console.log('\nPHASE 8: Return to Menu & Level Select Archive');
  menuBtn.click();
  check(game.state === GAME_STATE.MENU, 'Returning to menu sets MENU state');
  check(!game.ui.menuOverlay.classList.contains('hidden'), 'Main menu overlay visible');

  // Open Level Select
  document.getElementById('btn-level-select').click();
  check(!game.ui.levelSelectOverlay.classList.contains('hidden'), 'Level select archive opens');
  const levelCards = document.getElementById('level-grid').children;
  check(levelCards.length === 5, 'All 5 levels displayed in Level Select');
  const allUnlocked = Array.from(levelCards).every(card => !card.classList.contains('locked'));
  check(allUnlocked === true, 'All 5 levels unlocked after completing campaign');

  console.log('\n================================================================');
  console.log(`TOTAL SIMULATION CHECKS: ${testsPassed + testsFailed}`);
  console.log(`PASSED: ${testsPassed}`);
  console.log(`FAILED: ${testsFailed}`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('\n>>> COMPLETE END-TO-END CAMPAIGN VALIDATION SUCCESSFUL! <<<');
  }
}

runCampaignSimulation().catch(err => {
  console.error('Fatal error in simulation:', err);
  process.exit(1);
});
