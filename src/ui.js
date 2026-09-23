/**
 * Flutstunde — UI Controller
 * Manages the game UI: officer selection, commands, pause, results
 */

// Renderer is provided by main.js (window.__flutRenderer)
class GameController {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.currentView = 'menu'; // menu, officer-select, playing, ended
    this.selectedOfficer = null;
    this.selectedDuration = 15;
    this.commandInput = document.getElementById('commandInput');
    this.sendBtn = document.getElementById('sendCommand');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.menuScreen = document.getElementById('menuScreen');
    this.officerSelectScreen = document.getElementById('officerSelectScreen');
    this.gameContainer = document.getElementById('gameContainer');
    this.commandArea = document.getElementById('commandArea');
    this.officerResponse = document.getElementById('officerResponse');
    this.gameLog = document.getElementById('gameLog');

    this.setupEventListeners();
    this.showMenu();
  }

  // Lazy-accessor for renderer (available after main.js initializes)
  get renderer() {
    return window.__flutRenderer;
  }

  set renderer(val) {
    // No-op: renderer is provided by main.js
  }

  setupEventListeners() {
    // Send command
    this.sendBtn.addEventListener('click', () => this.sendCommand());
    this.commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendCommand();
    });

    // Pause button
    this.pauseBtn.addEventListener('click', () => this.togglePause());

    // Canvas click for end screen button
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    // Duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDuration = parseInt(btn.dataset.duration);
      });
    });

    // Officer cards
    document.querySelectorAll('.officer-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.officer-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedOfficer = card.dataset.officer;
      });
    });

    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
      if (!this.selectedOfficer) {
        alert('Wähle einen Offizier!');
        return;
      }
      this.startGame();
    });

    // Suggestions buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.commandInput.value = btn.dataset.suggestion;
        this.sendCommand();
      });
    });
  }

  showMenu() {
    this.currentView = 'menu';
    this.menuScreen.style.display = 'flex';
    this.officerSelectScreen.style.display = 'none';
    this.gameContainer.style.display = 'none';
    this.renderer?.draw();
  }

  showOfficerSelect() {
    this.currentView = 'officer-select';
    this.menuScreen.style.display = 'none';
    this.officerSelectScreen.style.display = 'flex';
    this.gameContainer.style.display = 'none';
  }

  showGame() {
    this.currentView = 'playing';
    this.menuScreen.style.display = 'none';
    this.officerSelectScreen.style.display = 'none';
    this.gameContainer.style.display = 'block';
    this.gameLog.innerHTML = '';
    this.commandInput.disabled = false;
    this.sendBtn.disabled = false;
    if (this.gameState?.officer) {
      const officerNameEl = document.getElementById('gameOfficerName');
      if (officerNameEl) officerNameEl.textContent = `— ${this.gameState.officer.name}`;
    }
    // Resize and redraw canvas now that game container is visible
    requestAnimationFrame(() => {
      this.renderer?.resize();
    });
  }

  startGame() {
    const { createGame, startGameLoop, getCurrentState } = window.game;
    this.gameState = createGame(this.selectedDuration, this.selectedOfficer);
    this.showGame();
    startGameLoop();
  }

  sendCommand() {
    const text = this.commandInput.value.trim();
    if (!text) return;

    const { sendCommand, getCurrentState } = window.game;
    const state = getCurrentState();

    try {
      sendCommand(text);
      this.commandInput.value = '';

      // Add to log
      this.addLogEntry(`General: "${text}"`, 'command');

      // Show officer response after a short delay
      setTimeout(() => {
        if (state.lastResponse) {
          this.showOfficerResponse(state.lastResponse);
          this.addLogEntry(`Offizier: ${state.lastResponse.sprechblase}`, 'response');
        }
      }, 500);

    } catch (err) {
      this.addLogEntry(`⏳ ${err.message}`, 'error');
      this.commandInput.disabled = true;
      setTimeout(() => {
        this.commandInput.disabled = false;
      }, state.commandCooldown * 1000);
    }
  }

  showOfficerResponse(response) {
    this.officerResponse.textContent = response.sprechblase;
    this.officerResponse.style.opacity = '1';
    this.officerResponse.style.transform = 'translateY(0)';

    // Clear after 8 seconds
    setTimeout(() => {
      this.officerResponse.style.opacity = '0';
      this.officerResponse.style.transform = 'translateY(10px)';
    }, 8000);
  }

  togglePause() {
    const { getCurrentState } = window.game;
    const state = getCurrentState();
    if (!state) return;

    if (state.phase === 'playing') {
      state.phase = 'paused';
      this.pauseBtn.textContent = '▶ Fortsetzen';
      this.commandInput.disabled = true;
      this.sendBtn.disabled = true;
    } else if (state.phase === 'paused') {
      state.phase = 'playing';
      this.pauseBtn.textContent = '⏸ Pause';
      this.commandInput.disabled = false;
      this.sendBtn.disabled = false;
      // Reset last command time so cooldown doesn't apply immediately
      state.lastCommandTime = Date.now() - state.commandCooldown * 1000;
    }
  }

  addLogEntry(text, type) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    this.gameLog.appendChild(entry);
    this.gameLog.scrollTop = this.gameLog.scrollHeight;

    // Keep only last 20 entries
    while (this.gameLog.children.length > 20) {
      this.gameLog.removeChild(this.gameLog.firstChild);
    }
  }

  handleCanvasClick(e) {
    if (this.currentView !== 'playing') return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for end screen button
    if (this.renderer.buttonBounds) {
      const { x: bx, y: by, w, h } = this.renderer.buttonBounds;
      if (x >= bx && x <= bx + w && y >= by && y <= by + h) {
        this.resetGame();
      }
    }
  }

  resetGame() {
    const { resetGame } = window.game;
    resetGame();
    this.showMenu();
  }
}

// Export for module use
export default GameController;
