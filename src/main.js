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
// Don't draw yet — canvas is hidden until game starts

// Initialize game controller
const controller = new GameController();
window.gameController = controller;

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

// ── Menu Navigation ──
document.getElementById('startGameBtn').addEventListener('click', () => {
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('officerSelectScreen').style.display = 'flex';
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
  document.getElementById('officerSelectScreen').style.display = 'none';
  document.getElementById('menuScreen').style.display = 'flex';
});

document.getElementById('backToMenuBtn2').addEventListener('click', () => {
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('menuScreen').style.display = 'flex';
  document.getElementById('gameContainer').style.display = 'none';
  document.getElementById('officerSelectScreen').style.display = 'none';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('menuScreen').style.display = 'flex';
  document.getElementById('gameContainer').style.display = 'none';
  document.getElementById('officerSelectScreen').style.display = 'none';
});

// Load officers API
fetch('/api/officers')
  .then(r => r.json())
  .then(() => {})
  .catch(() => {}); // Non-critical

console.log('🦫 Flutstunde loaded');
