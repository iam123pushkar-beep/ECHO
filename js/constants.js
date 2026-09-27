/**
 * ECHO - Game Constants & Configuration
 */
export const CONFIG = {
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 640,
  TILE_SIZE: 32,
  
  PLAYER: {
    RADIUS: 14,
    SPEED: 210, // Pixels per second
    ACCELERATION: 1600,
    FRICTION: 0.84,
    START_LIVES: 3,
    INVULNERABILITY_DURATION: 1.8, // Seconds after hit
    COLOR_CORE: '#00f0ff',
    COLOR_GLOW: 'rgba(0, 240, 255, 0.4)',
    COLOR_TRAIL: 'rgba(0, 240, 255, 0.25)',
    HISTORY_MAX_TIME: 5.0, // Retain 5s history for rewinding
  },

  ECHO: {
    RADIUS: 14,
    COLORS: [
      { core: '#ff2a6d', glow: 'rgba(255, 42, 109, 0.45)', trail: 'rgba(255, 42, 109, 0.3)' }, // Echo 1: Crimson
      { core: '#ff9900', glow: 'rgba(255, 153, 0, 0.45)', trail: 'rgba(255, 153, 0, 0.3)' },   // Echo 2: Amber
      { core: '#d02aff', glow: 'rgba(208, 42, 255, 0.45)', trail: 'rgba(208, 42, 255, 0.3)' }  // Echo 3: Violet
    ],
    GLITCH_FREQUENCY: 0.15,
  },

  PARADOX_ZONE: {
    REWIND_SECONDS: 3.0,
    COOLDOWN: 1.5,
    COLOR_FILL: 'rgba(255, 30, 80, 0.15)',
    COLOR_GRID: 'rgba(255, 42, 109, 0.4)',
    LIGHT_RADIUS: 80,
  },

  SWITCH: {
    RADIUS: 16,
    COLOR_PLAYER: '#00f0ff',
    COLOR_ECHO: '#ff2a6d',
  },

  DOOR: {
    COLOR_LOCKED: '#ff2a6d',
    COLOR_UNLOCKED: '#05ffa1',
  },

  ORB: {
    RADIUS: 10,
    COLOR_CORE: '#ffe600',
    COLOR_GLOW: 'rgba(255, 230, 0, 0.5)',
    BOB_SPEED: 2.8,
    BOB_AMPLITUDE: 4,
  },

  PORTAL: {
    RADIUS: 26,
    GRAND_RADIUS: 38,
    COLOR_LOCKED: '#555566',
    COLOR_ACTIVE: '#05ffa1',
    COLOR_CORE_ACTIVE: '#b967ff',
  },

  LIGHTING: {
    AMBIENT_DARKNESS: 0.92, // Sci-fi dark facility vignette
    PLAYER_LIGHT_RADIUS: 140,
    ORB_LIGHT_RADIUS: 90,
    PORTAL_LIGHT_RADIUS: 130,
    GRAND_PORTAL_LIGHT_RADIUS: 190,
    ECHO_LIGHT_RADIUS: 110,
    PARADOX_LIGHT_RADIUS: 70,
  }
};
