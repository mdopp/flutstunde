/**
 * Flutstunde — Main Entry Point
 */

import Renderer from './renderer.js';
import GameController from './ui.js';

// Make game module available globally for inline event handlers
import * as game from './game.js';
window.game = game;

// Initialize renderer for menu screens
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
window.__flutRenderer = renderer;

// Initialize game controller
const controller = new GameController();

// Handle resize
window.addEventListener('resize', () => {
  renderer.resize();
});

// Check if officer was saved
const savedOfficer = localStorage.getItem('flutstunde_officer');
const savedDuration = localStorage.getItem('flutstunde_duration');

if (savedOfficer) {
  controller.selectedOfficer = savedOfficer;
  document.querySelector(`.officer-card[data-officer="${savedOfficer}"]`)?.classList.add('selected');
}

if (savedDuration) {
  controller.selectedDuration = parseInt(savedDuration);
  document.querySelectorAll('.duration-btn').forEach(btn => {
    if (parseInt(btn.dataset.duration) === controller.selectedDuration) {
      btn.classList.add('active');
    }
  });
}

// Save selections
document.querySelectorAll('.officer-card').forEach(card => {
  card.addEventListener('click', () => {
    localStorage.setItem('flutstunde_officer', card.dataset.officer);
  });
});

document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    localStorage.setItem('flutstunde_duration', btn.dataset.duration);
  });
});

// Load officers API
fetch('/api/officers')
  .then(r => r.json())
  .then(() => {})
  .catch(() => {}); // Non-critical

console.log('🦫 Flutstunde loaded');
