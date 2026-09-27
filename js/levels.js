/**
 * ECHO - 5-Level Campaign Definitions
 * Tile grid: 30 columns x 20 rows (32px per tile = 960 x 640)
 * 
 * Legend:
 * '#' = Solid Facility Wall
 * '.' = Floor
 * 'P' = Player Start Spawn
 * 'O' = Energy Orb
 * 'E' = Exit Portal (Standard)
 * 'X' = Grand Exit Portal (Level 5)
 * 'C' = Server Console / Obstacle
 * 'Z' = Paradox Zone (Rewinds player position by ~3 seconds)
 * 'B' = Blue Switch (Activated ONLY by the Player -> controls Door 'D')
 * 'R' = Red Switch (Activated ONLY by an Echo -> controls Door 'G')
 * 'D' = Security Door 1 (Blocks passage when locked by Switch 'B')
 * 'G' = Security Door 2 (Blocks passage when locked by Switch 'R')
 */

export const LEVELS = [
  // =========================================================================
  // LEVEL 1 — THE FIRST ECHO
  // =========================================================================
  {
    id: 1,
    name: "Sector 01: The First Echo",
    subtitle: "Facility Intake & Decontamination",
    lore: "Learn the temporal law: Whatever path you tread today, your Echo will retrace tomorrow. Dodge your past self.",
    cycleDuration: 10.0,
    maxEchoes: 1,
    isGrandFinal: false,
    map: [
      "##############################",
      "#............................#",
      "#..P........#####............#",
      "#...........#####............#",
      "#...........#####.....O......#",
      "#............................#",
      "#......###..........###......#",
      "#......###..........###......#",
      "#......###..........###......#",
      "#..........O.................#",
      "#............................#",
      "#......###..........###......#",
      "#......###..........###......#",
      "#......###..........###......#",
      "#............................#",
      "#............#####...........#",
      "#......O.....#####...........#",
      "#............#####.......E...#",
      "#............................#",
      "##############################"
    ]
  },

  // =========================================================================
  // LEVEL 2 — MULTIPLE ECHOES
  // =========================================================================
  {
    id: 2,
    name: "Sector 02: Multiple Echoes",
    subtitle: "Sub-level Ventilation & Transit",
    lore: "Paced 9-second cycles. Up to 3 Echoes will patrol simultaneously. Strategic routing is vital.",
    cycleDuration: 9.0,
    maxEchoes: 3,
    isGrandFinal: false,
    map: [
      "##############################",
      "#P...................#......E#",
      "#..######..######....#..###..#",
      "#..#....#..#....#....#..#.#..#",
      "#..#..O.#..#.O..######..#.#..#",
      "#..#....#..#...............#.#",
      "#..##..##..##..##....#######.#",
      "#............................#",
      "#######..############..#######",
      "#.....#..#..........#..#.....#",
      "#..O.....#....##....#.....O..#",
      "#.....#..#....##....#..#.....#",
      "#######..############..#######",
      "#............................#",
      "#..######..######....#######.#",
      "#..#....#..#....#..........#.#",
      "#..#....#..#....######..#..#.#",
      "#..#....#..#....#....#..#..#.#",
      "#............................#",
      "##############################"
    ]
  },

  // =========================================================================
  // LEVEL 3 — PARADOX ZONES
  // =========================================================================
  {
    id: 3,
    name: "Sector 03: Paradox Zones",
    subtitle: "Chronometric Distortion Chamber",
    lore: "Glowing red Paradox Zones displace present matter 3 seconds into the past. Echoes remain unaffected.",
    cycleDuration: 10.5,
    maxEchoes: 2,
    isGrandFinal: false,
    map: [
      "##############################",
      "#P.......#..........#.......E#",
      "#..C..C..#....O.....#..C..C..#",
      "#........#..........#........#",
      "####..########..########..####",
      "#............................#",
      "#..C..C..C...ZZZZ...C..C..C..#",
      "#............ZZZZ............#",
      "####..####..........####..####",
      "#........#....O.....#........#",
      "#..ZZZZ..#..........#..ZZZZ..#",
      "####..####..........####..####",
      "#............ZZZZ............#",
      "#..C..C..C...ZZZZ...C..C..C..#",
      "#............................#",
      "####..########..########..####",
      "#........#..........#........#",
      "#..C..C..#....O.....#..C..C..#",
      "#........#..........#........#",
      "##############################"
    ]
  },

  // =========================================================================
  // LEVEL 4 — SWITCHES & SECURITY DOORS
  // =========================================================================
  {
    id: 4,
    name: "Sector 04: Switches & Security Doors",
    subtitle: "Automated Biometric Core",
    lore: "Blue switches accept only living hands. Red switches require an Echo's temporal signature. Coordinate across cycles.",
    cycleDuration: 11.0,
    maxEchoes: 2,
    isGrandFinal: false,
    map: [
      "##############################",
      "#P..................#.......E#",
      "#........#....B.....#........#",
      "#...O....#..........#...O....#",
      "#######DD##############GG#####",
      "#............................#",
      "#..######....####....######..#",
      "#..#....#....#..#....#....#..#",
      "#..#....######..######....#..#",
      "#..#......................#..#",
      "#..#....######..######....#..#",
      "#..#....#....#..#....#....#..#",
      "#..######....#..#....######..#",
      "#............#..#............#",
      "#######GG#####..#####DD#######",
      "#............#..#............#",
      "#...R........#..#........O...#",
      "#............#..#............#",
      "#............................#",
      "##############################"
    ]
  },

  // =========================================================================
  // LEVEL 5 — THE FINAL PARADOX
  // =========================================================================
  {
    id: 5,
    name: "Sector 05: The Final Paradox",
    subtitle: "Chrono-Singularity Vault",
    lore: "The nexus collapses. Multiple Echoes, Paradox Zones, and bi-temporal switches guard the Grand Portal. Escape your past.",
    cycleDuration: 12.0,
    maxEchoes: 3,
    isGrandFinal: true,
    map: [
      "##############################",
      "#P..........######..........X#",
      "#...........######...........#",
      "#.####..##..######..##..####.#",
      "#.#..#..##....B.....##..#..#.#",
      "#.#..#..##############..#..#.#",
      "#....#........O.........#....#",
      "####.#..######DD######..#.####",
      "#....#..#............#..#....#",
      "#.##.#..#....ZZZZ....#..#.##.#",
      "#.##.#..#....ZZZZ....#..#.##.#",
      "#....#..#......O.....#..#....#",
      "####.#..######GG######..#.####",
      "#....#..................#....#",
      "#.#..#..##############..#..#.#",
      "#.#..#..##....R.....##..#..#.#",
      "#.####..##..######..##..####.#",
      "#....O......######......O....#",
      "#...........######...........#",
      "##############################"
    ]
  }
];

/**
 * Parses ASCII level map into actionable game objects
 */
export function parseLevel(levelData) {
  const tileSize = 32;
  const walls = [];
  const orbs = [];
  const paradoxZones = [];
  const switches = [];
  const doors = [];
  let playerSpawn = { x: 64, y: 64 };
  let exitPortal = { x: 960 - 64, y: 640 - 64, isGrand: !!levelData.isGrandFinal };

  const rows = levelData.map;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      const x = c * tileSize;
      const y = r * tileSize;
      const centerX = x + tileSize / 2;
      const centerY = y + tileSize / 2;

      if (char === '#' || char === 'C') {
        walls.push({
          x,
          y,
          width: tileSize,
          height: tileSize,
          type: char === 'C' ? 'console' : 'wall'
        });
      } else if (char === 'P') {
        playerSpawn = { x: centerX, y: centerY };
      } else if (char === 'O') {
        orbs.push({
          id: orbs.length + 1,
          x: centerX,
          y: centerY,
          collected: false
        });
      } else if (char === 'E' || char === 'X') {
        exitPortal = {
          x: centerX,
          y: centerY,
          isGrand: char === 'X'
        };
      } else if (char === 'Z') {
        paradoxZones.push({
          x,
          y,
          width: tileSize,
          height: tileSize
        });
      } else if (char === 'B') {
        // Blue Switch: Activated ONLY by Player -> controls Door 1 ('D')
        switches.push({
          id: 'switch-blue-1',
          type: 'player', // 'player' | 'echo'
          targetDoorId: 'door-1',
          x: centerX,
          y: centerY,
          radius: 16,
          isPressed: false
        });
      } else if (char === 'R') {
        // Red Switch: Activated ONLY by Echo -> controls Door 2 ('G')
        switches.push({
          id: 'switch-red-1',
          type: 'echo', // 'player' | 'echo'
          targetDoorId: 'door-2',
          x: centerX,
          y: centerY,
          radius: 16,
          isPressed: false
        });
      } else if (char === 'D') {
        // Security Door 1
        doors.push({
          id: 'door-1',
          x,
          y,
          width: tileSize,
          height: tileSize,
          locked: true,
          color: '#00f0ff'
        });
      } else if (char === 'G') {
        // Security Door 2
        doors.push({
          id: 'door-2',
          x,
          y,
          width: tileSize,
          height: tileSize,
          locked: true,
          color: '#ff2a6d'
        });
      }
    }
  }

  return {
    ...levelData,
    walls,
    orbs,
    paradoxZones,
    switches,
    doors,
    playerSpawn,
    exitPortal,
    requiredOrbs: orbs.length
  };
}
