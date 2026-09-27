// Headless DOM & Canvas mock simulation to verify all JS modules together
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
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
  createRadialGradient() {
    return {
      addColorStop() {}
    };
  }
  createLinearGradient() {
    return {
      addColorStop() {}
    };
  }
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

global.document = {
  createElement(tag) {
    if (tag === 'canvas') return new MockCanvas();
    return {
      classList: { add() {}, remove() {} },
      appendChild() {},
      addEventListener() {},
      style: {}
    };
  },
  getElementById() {
    return {
      classList: { add() {}, remove() {}, contains() { return false; } },
      addEventListener() {},
      appendChild() {},
      innerHTML: '',
      textContent: '',
      style: {}
    };
  }
};

global.window = {
  addEventListener() {},
  AudioContext: class {
    createGain() { return { connect() {}, gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
    createBufferSource() { return { connect() {}, start() {}, buffer: null }; }
    createBuffer() { return { getChannelData() { return new Float32Array(100); } }; }
    createBiquadFilter() { return { connect() {}, frequency: { setValueAtTime() {} } }; }
  }
};
global.performance = { now: () => Date.now() };

async function runSimulation() {
  console.log('--- Testing Full Game Engine Simulation ---');
  const { Game, GAME_STATE } = await import('../js/game.js');

  const canvas = new MockCanvas();
  const game = new Game(canvas);
  console.log('✓ Game engine initialized');

  // Test start new game
  game.startNewGame();
  console.log('✓ Level 1 started');

  // Simulate 60 frames of update and render
  for (let f = 0; f < 60; f++) {
    game.player.keys.right = true;
    game.update(0.016);
    game.render();
  }
  console.log('✓ 60 frames of Level 1 update & render passed cleanly');

  // Test Level 2
  game.loadLevel(1, true);
  for (let f = 0; f < 30; f++) {
    game.update(0.016);
    game.render();
  }
  console.log('✓ Level 2 (Multiple Echoes) simulated cleanly');

  // Test Level 3 (Paradox Zones)
  game.loadLevel(2, true);
  for (let f = 0; f < 30; f++) {
    game.update(0.016);
    game.render();
  }
  console.log('✓ Level 3 (Paradox Zones) simulated cleanly');

  // Test Level 4 (Switches & Doors)
  game.loadLevel(3, true);
  for (let f = 0; f < 30; f++) {
    game.update(0.016);
    game.render();
  }
  console.log('✓ Level 4 (Switches & Doors) simulated cleanly');

  // Test Level 5 (The Final Paradox)
  game.loadLevel(4, true);
  for (let f = 0; f < 30; f++) {
    game.update(0.016);
    game.render();
  }
  console.log('✓ Level 5 (The Final Paradox) simulated cleanly');

  // Test manual cycle sync & screen distortion
  game.triggerManualCycleSync();
  game.triggerScreenEffect('paradox_warp', 0.5);
  game.render();
  console.log('✓ Screen glitch and distortion rendering verified');

  console.log('=== ALL CLIENT SIMULATIONS PASSED WITH 0 ERRORS! ===');
}

runSimulation().catch(err => {
  console.error('Simulation Failed:', err);
  process.exit(1);
});
