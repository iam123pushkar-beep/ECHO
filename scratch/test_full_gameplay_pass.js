/**
 * ECHO - Comprehensive Gameplay Balancing & Progression QA Test Suite
 * Validates all 8 requirements of the complete gameplay pass.
 */

import { CONFIG } from '../js/constants.js';
import { LEVELS, parseLevel } from '../js/levels.js';
import { EchoManager, EchoEntity } from '../js/echo.js';
import { Player } from '../js/player.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('ECHO - GAMEPLAY BALANCING & PROGRESSION QA TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. LEVEL PROGRESSION & DIFFICULTY BALANCE
// -----------------------------------------------------------------------------
console.log('TEST 1: Level Progression & Balance Checks');

assert(LEVELS.length === 5, 'Exactly 5 levels defined in the campaign');

// Level 1
assert(LEVELS[0].cycleDuration === 10.0, 'Level 1 has 10s recording cycle');
assert(LEVELS[0].maxEchoes === 1, 'Level 1 introduces exactly 1 Echo');
const parsedL1 = parseLevel(LEVELS[0]);
assert(parsedL1.requiredOrbs === 3, 'Level 1 has 3 energy orbs to collect');

// Level 2
assert(LEVELS[1].cycleDuration === 9.0, 'Level 2 has paced 9s recording cycle');
assert(LEVELS[1].maxEchoes === 3, 'Level 2 allows up to 3 Echoes');
const parsedL2 = parseLevel(LEVELS[1]);
assert(parsedL2.requiredOrbs === 4, 'Level 2 has 4 energy orbs');

// Level 3
assert(LEVELS[2].cycleDuration === 10.5, 'Level 3 has 10.5s recording cycle');
assert(LEVELS[2].maxEchoes === 2, 'Level 3 has 2 Echoes');
const parsedL3 = parseLevel(LEVELS[2]);
assert(parsedL3.paradoxZones.length > 0, 'Level 3 contains Paradox Zones');
assert(parsedL3.requiredOrbs === 3, 'Level 3 has 3 energy orbs');

// Level 4
assert(LEVELS[3].cycleDuration === 11.0, 'Level 4 has 11s cycle for deliberate switch coordination');
assert(LEVELS[3].maxEchoes === 2, 'Level 4 allows 2 Echoes');
const parsedL4 = parseLevel(LEVELS[3]);
assert(parsedL4.switches.some(s => s.type === 'player'), 'Level 4 has Blue Player switch');
assert(parsedL4.switches.some(s => s.type === 'echo'), 'Level 4 has Red Echo switch');
assert(parsedL4.doors.length >= 2, 'Level 4 has security blast doors');
assert(parsedL4.requiredOrbs === 3, 'Level 4 has 3 energy orbs');

// Level 5
assert(LEVELS[4].cycleDuration === 12.0, 'Level 5 has 12s culmination cycle');
assert(LEVELS[4].maxEchoes === 3, 'Level 5 allows 3 Echoes');
assert(LEVELS[4].isGrandFinal === true, 'Level 5 is marked as Grand Final Nexus');
const parsedL5 = parseLevel(LEVELS[4]);
assert(parsedL5.exitPortal.isGrand === true, 'Level 5 features the Grand Exit Portal');
assert(parsedL5.switches.length >= 2, 'Level 5 has multiple switch conduits');
assert(parsedL5.paradoxZones.length > 0, 'Level 5 combines Paradox Zones');
assert(parsedL5.requiredOrbs === 4, 'Level 5 has 4 energy orbs');

console.log('\n----------------------------------------------------------------');
// -----------------------------------------------------------------------------
// 2. ECHO INTELLIGENCE & ACCURACY
// -----------------------------------------------------------------------------
console.log('TEST 2: Echo Intelligence, Precision & Stopping');

const echoManager = new EchoManager();
echoManager.initLevel(10.0, 2);

// Simulate player recording 6.0 seconds of movement
const simulatedPlayer = new Player(100, 100);
for (let t = 0; t <= 6.0; t += 0.1) {
  simulatedPlayer.x = 100 + t * 20; // Moves from 100 to 220
  simulatedPlayer.y = 100;
  simulatedPlayer.angle = 0;
  echoManager.recordSample(simulatedPlayer, 0.1);
}

assert(echoManager.recordedPath.length > 50, 'Path samples recorded correctly');

// Cycle complete spawns Echo
const spawnSuccess = echoManager.cycleComplete();
assert(spawnSuccess === true, 'Echo cycle successfully completed and spawned Echo');
assert(echoManager.echoes.length === 1, 'Active echo count is 1');

const echo1 = echoManager.echoes[0];
assert(echo1.spawnX === 100 && echo1.spawnY === 100, 'Echo preserves exact initial spawn location');
assert(echo1.totalDuration > 5.9 && echo1.totalDuration <= 6.2, 'Echo preserves recorded total duration');

// Replay update to mid-path
echo1.update(3.0, null, []);
assert(Math.abs(echo1.x - 160) < 5, `Echo accurately interpolated at 3.0s (x=${echo1.x.toFixed(1)}, expected ~160)`);
assert(echo1.isStopped === false, 'Echo is moving during recording duration');

// Replay update beyond recording duration (test stopping)
echo1.update(4.0, null, []); // Total elapsed 7.0s > 6.0s
assert(echo1.isStopped === true, 'Echo cleanly stopped when recording ended');
assert(Math.abs(echo1.x - 220) < 2, `Echo holds position at final recorded sample (x=${echo1.x.toFixed(1)}, expected 220)`);

// Test resetPlayback on new cycle
echo1.resetPlayback();
assert(echo1.playbackTime === 0, 'Echo playbackTime resets to 0 on new cycle');
assert(echo1.isStopped === false, 'Echo resumes playback from spawn on new cycle');
assert(echo1.x === 100, 'Echo returns to spawn position on cycle restart');

// Test environmental obstacle consistency (closed blast door)
const closedDoor = { x: 140, y: 80, width: 32, height: 32, locked: true };
echo1.update(2.5, null, [closedDoor]); // Would step near/inside door
assert(echo1.x < closedDoor.x || echo1.x > closedDoor.x + closedDoor.width, 'Echo resolves physical collision with closed blast door consistently');

console.log('\n----------------------------------------------------------------');
// -----------------------------------------------------------------------------
// 3. CHECKPOINTS & PLAYER LIVES PRESERVATION
// -----------------------------------------------------------------------------
console.log('TEST 3: Checkpoint Progression & Life Mechanics');

const testPlayer = new Player(64, 64);
assert(testPlayer.lives === 3, 'Player starts with 3 lives');

// Simulate life loss
const damaged = testPlayer.takeDamage();
assert(damaged === true, 'Player takes damage on collision');
assert(testPlayer.lives === 2, 'Lives reduced to 2 on hit');
assert(testPlayer.isDead === false, 'Player is still alive with 2 lives remaining');

// Test invulnerability timer
assert(testPlayer.invulnerableTimer > 1.0, 'Player receives invulnerability grace window after damage');

// Damage again
testPlayer.invulnerableTimer = 0; // Simulate invulnerability expired
testPlayer.takeDamage();
assert(testPlayer.lives === 1, 'Lives reduced to 1');
assert(testPlayer.isDead === false, 'Player still alive with 1 life');

// Final fatal damage
testPlayer.invulnerableTimer = 0;
testPlayer.takeDamage();
assert(testPlayer.lives === 0, 'Lives reduced to 0');
assert(testPlayer.isDead === true, 'Player marked dead at 0 lives');

console.log('\n----------------------------------------------------------------');
// -----------------------------------------------------------------------------
// 4. PARADOX ZONE REWIND SAFETY
// -----------------------------------------------------------------------------
console.log('TEST 4: Paradox Zone Rewind Safety');

const p2 = new Player(100, 100);
// Build 4 seconds of history
for (let t = 0; t <= 4.0; t += 0.1) {
  p2.x = 100 + t * 25;
  p2.y = 100;
  p2.update(0.1, [], null);
}

const currentX = p2.x;
const rewindData = p2.rewindPosition(3.0);
assert(rewindData !== null, 'Paradox rewind executed successfully');
assert(p2.x < currentX, `Player rewound from ${currentX} back to ${p2.x}`);
assert(p2.invulnerableTimer >= 1.2, 'Player granted invulnerability grace period after Paradox rewind');

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL GAMEPLAY BALANCE & PROGRESSION TESTS PASSED SUCCESSFULLY!');
}
