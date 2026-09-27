/**
 * ECHO - Application Bootstrap Entrypoint
 */
import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found!');
    return;
  }

  const game = new Game(canvas);
  game.start();

  // Expose game instance for debugging or console testing if needed
  window.__ECHO_GAME__ = game;
});
