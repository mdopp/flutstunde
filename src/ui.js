/**
 * Flutstunde — UI Controller
 * Manages the game UI: officer selection, commands, pause, results
 */

class GameController {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.currentView = 'menu'; // menu, officer-select, playing, ended
    this.selectedOfficer = 'espen'; // Default officer
    this.selectedDuration = 15;
    this.commandInput = document.getElementById('commandInput');
    this.sendBtn = document.getElementById('sendCommand');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.menuScreen = document.getElementById('menuScreen');
    this.officerSelectScreen = document.getElementById('officerSelectScreen');
    this.gameContainer = document.getElementById('gameContainer');
    this.officerResponse = document.getElementById('officerResponse');
    this.gameLog = document.getElementById('gameLog');
    this.gameState = null;
    
    // Setup officer selection
    document.querySelectorAll('.officer-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.officer-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedOfficer = card.dataset.officer;
        localStorage.setItem('flutstunde_officer', card.dataset.officer);
        
        // Update avatar and name
        const avatar = card.querySelector('.officer-icon').textContent;
        const name = card.querySelector('h3').textContent;
        if (document.getElementById('officerAvatar')) {
          document.getElementById('officerAvatar').textContent = avatar;
        }
        if (document.getElementById('officerName')) {
          document.getElementById('officerName').textContent = name;
        }
      });
    });

    // Setup duration selection
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDuration = parseInt(btn.dataset.duration);
        localStorage.setItem('flutstunde_duration', btn.dataset.duration);
      });
    });

    // Setup command input
    this.sendBtn.addEventListener('click', () => this.sendCommand());
    this.commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendCommand();
    });

    // Setup pause button
    this.pauseBtn.addEventListener('click', () => this.togglePause());

    // Setup quick action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const commandMap = {
          'damm': 'Sichere den Damm',
          'vorrat': 'Rette die Vorräte',
          'bauen': 'Erweitere den Damm'
        };
        this.sendCommand(commandMap[action] || action);
        btn.disabled = true;
        setTimeout(() => {
          btn.disabled = false;
        }, 15000); // 15 second cooldown
      });
    });

    // Setup start button
    document.getElementById('startBtn').addEventListener('click', () => {
      if (!this.selectedOfficer) {
        alert('Wähle einen Offizier!');
        return;
      }
      this.startGame();
    });

    // Setup back button
    document.getElementById('backToMenuBtn').addEventListener('click', () => {
      if (confirm('Möchtest du die Partie beenden?')) {
        this.resetGame();
      }
    });

    // Setup canvas click for end screen button
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    this.showMenu();
  }

  // Lazy-accessor for renderer (available after main.js initializes)
  get renderer() {
    return window.__flutRenderer;
  }

  set renderer(val) {
    // No-op: renderer is provided by main.js
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
    this.gameContainer.style.display = 'flex';
    this.gameLog.innerHTML = '';
    this.commandInput.disabled = false;
    this.sendBtn.disabled = false;
    
    // Update officer info
    if (this.gameState?.officer) {
      const officerNameEl = document.getElementById('gameOfficerName');
      const officerAvatarEl = document.getElementById('officerAvatar');
      const officerInfoEl = document.getElementById('officerName');
      const officerStatusEl = document.getElementById('officerStatus');
      
      if (officerNameEl) officerNameEl.textContent = `— ${this.gameState.officer.name}`;
      if (officerAvatarEl) officerAvatarEl.textContent = this.getOfficerAvatar(this.gameState.officer.id);
      if (officerInfoEl) officerInfoEl.textContent = this.gameState.officer.name;
      if (officerStatusEl) officerStatusEl.textContent = 'Wartet auf Befehle...';
    }
    
    // Initialize and resize canvas now that game container is visible
    requestAnimationFrame(() => {
      this.renderer?.init();
      this.updateStatus();
    });
  }

  getOfficerAvatar(officerId) {
    const avatars = {
      'espen': '🪶',
      'brack': '⚡',
      'erle': '🌿'
    };
    return avatars[officerId] || '👤';
  }

  startGame() {
    const { createGame, startGameLoop, getCurrentState } = window.game;
    this.gameState = createGame(this.selectedDuration, this.selectedOfficer);
    this.showGame();
    startGameLoop();
    
    // Start status update interval
    if (this.statusInterval) clearInterval(this.statusInterval);
    this.statusInterval = setInterval(() => {
      if (this.currentView === 'playing') {
        this.updateStatus();
      }
    }, 1000);
  }

  updateStatus() {
    if (!this.gameState) return;
    
    const waterLevelEl = document.getElementById('waterLevel');
    const dammHealthEl = document.getElementById('dammHealth');
    const timerEl = document.getElementById('timer');
    
    if (waterLevelEl) waterLevelEl.textContent = `${Math.round(this.gameState.waterLevel)}%`;
    if (dammHealthEl) dammHealthEl.textContent = `${Math.round(this.gameState.dammHealth)}%`;
    if (timerEl) {
      const remaining = Math.max(0, this.gameState.duration - this.gameState.elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Update officer status
    const officerStatusEl = document.getElementById('officerStatus');
    if (officerStatusEl) {
      const workingBeavers = this.gameState.beavers.filter(b => b.task).length;
      officerStatusEl.textContent = workingBeavers > 0 
        ? `${workingBeaver} Biber arbeiten` 
        : 'Wartet auf Befehle...';
    }
  }

  sendCommand(text) {
    if (!text) {
      text = this.commandInput.value.trim();
    }
    if (!text) return;

    const { sendCommand, getCurrentState } = window.game;
    const state = getCurrentState();

    try {
      sendCommand(text);
      if (typeof this.commandInput !== 'undefined') {
        this.commandInput.value = '';
      }

      // Add to log
      this.addLogEntry(`General: "${text}"`, 'command');

      // Show officer response after a short delay
      setTimeout(() => {
        if (state && state.lastResponse) {
          this.showOfficerResponse(state.lastResponse);
          this.addLogEntry(`Offizier: ${state.lastResponse.sprechblase}`, 'response');
        }
      }, 1000);

    } catch (err) {
      this.addLogEntry(`⏳ ${err.message}`, 'error');
      if (typeof this.commandInput !== 'undefined') {
        this.commandInput.disabled = true;
      }
      this.sendBtn.disabled = true;
      setTimeout(() => {
        if (typeof this.commandInput !== 'undefined') {
          this.commandInput.disabled = false;
        }
        this.sendBtn.disabled = false;
      }, state.commandCooldown * 1000);
    }
  }

  showOfficerResponse(response) {
    const responseEl = document.getElementById('officerResponse');
    if (responseEl) {
      const contentEl = responseEl.querySelector('.response-text');
      if (contentEl) {
        contentEl.textContent = response.sprechblase;
        responseEl.style.opacity = '1';
        responseEl.style.transform = 'translateY(0)';
      }
      
      // Clear after 8 seconds
      setTimeout(() => {
        responseEl.style.opacity = '0.7';
        responseEl.style.transform = 'translateY(5px)';
      }, 8000);
    }
  }

  togglePause() {
    const { getCurrentState } = window.game;
    const state = getCurrentState();
    if (!state) return;

    if (state.phase === 'playing') {
      state.phase = 'paused';
      this.pauseBtn.textContent = '▶ Fortsetzen';
      if (typeof this.commandInput !== 'undefined') {
        this.commandInput.disabled = true;
      }
      this.sendBtn.disabled = true;
      if (this.statusInterval) clearInterval(this.statusInterval);
    } else if (state.phase === 'paused') {
      state.phase = 'playing';
      this.pauseBtn.textContent = '⏸ Pause';
      if (typeof this.commandInput !== 'undefined') {
        this.commandInput.disabled = false;
      }
      this.sendBtn.disabled = false;
      // Reset last command time so cooldown doesn't apply immediately
      state.lastCommandTime = Date.now() - state.commandCooldown * 1000;
      // Restart status update interval
      if (this.statusInterval) clearInterval(this.statusInterval);
      this.statusInterval = setInterval(() => {
        if (this.currentView === 'playing') {
          this.updateStatus();
        }
      }, 1000);
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
    if (this.statusInterval) clearInterval(this.statusInterval);
    this.gameState = null;
    this.showMenu();
  }
}

// Export for module use
export default GameController;
