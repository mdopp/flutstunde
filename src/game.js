/**
 * Flutstunde — The Flood Hour
 * Main game engine
 */

// ── Constants ──
const WORLD_WIDTH = 1200;
const WORLD_HEIGHT = 800;
const DAMM_X = 600; // x position of the dam
const DAMM_HEIGHT = 300;
const DAMM_Y = WORLD_HEIGHT - 100; // base Y position

// Beaver names
const BEAVER_NAMES = [
  'Zahn', 'Krallen', 'Pelz', 'Stamm', 'Rücken',
  'Schwanz', 'Borke', 'Lehm', 'Damm', 'Bach'
];

// Task types
const TASKS = {
  FALLEN: { name: 'fällen', icon: '🪓', duration: 8000 },
  SCHLEPPEN: { name: 'schleppen', icon: '📦', duration: 6000 },
  STOPFEN: { name: 'Lehm stopfen', icon: '✋', duration: 10000 },
  TRAGEN: { name: 'Vorräte tragen', icon: '🍎', duration: 7000 },
  BAUEN: { name: 'bauen', icon: '🔨', duration: 12000 },
  SICHERN: { name: 'sichern', icon: '👁️', duration: 5000 }
};

// ── Game State ──
export let state = null;

function createGame(durationMinutes, officerId) {
  const beaverCount = 6 + Math.floor(durationMinutes / 5);
  const beavers = [];
  
  for (let i = 0; i < beaverCount; i++) {
    beavers.push({
      id: i,
      name: BEAVER_NAMES[i % BEAVER_NAMES.length],
      task: null,
      x: 100 + i * 120,
      y: DAMM_Y - 50,
      targetX: 100 + i * 120,
      targetY: DAMM_Y - 50,
      moving: false,
      taskTimer: 0,
      taskProgress: 0,
      health: 100,
      activity: 'idle' // idle, working, moving, resting
    });
  }

  state = {
    phase: 'playing', // playing, paused, finished
    duration: durationMinutes * 60, // seconds
    elapsed: 0,
    waterLevel: 0, // 0-100
    dammHealth: 100,
    dammWidth: 0, // how much the dam has been built up
    resources: {
      wood: 50,
      food: 50,
      children: 10
    },
    saved: {
      beavers: beaverCount,
      food: 50,
      children: 10
    },
    beavers,
    officerId,
    officer: loadOfficer(officerId),
    lastCommandTime: 0,
    commandCooldown: 15, // seconds
    history: [],
    startTime: Date.now(),
    lastFrameTime: performance.now(),
    lastResponse: null
  };

  return state;
}

function loadOfficer(officerId) {
  const officers = getDefaultOfficers();
  return officers.find(o => o.id === officerId) || officers[0];
}

function getDefaultOfficers() {
  return [
    {
      id: 'espen',
      name: 'Espen',
      traits: ['wortkarg', 'ordnungsliebend'],
      stats: { auffassung: 2, organisation: 4, weitblick: 1, durchsetzung: 3 },
      description: 'Tut genau das, was du gesagt hast, nie mehr.'
    },
    {
      id: 'brack',
      name: 'Brack',
      traits: ['eigenmaechtig', 'ungeduldig'],
      stats: { auffassung: 3, organisation: 2, weitblick: 4, durchsetzung: 1 },
      description: 'Legt deine Absicht großzügig aus.'
    },
    {
      id: 'erle',
      name: 'Erle',
      traits: ['vorsichtig', 'fuersorglich'],
      stats: { auffassung: 5, organisation: 3, weitblick: 2, durchsetzung: 0 },
      description: 'Versteht dich am besten von allen.'
    }
  ];
}

// ── Game Loop ──
let animationFrame = null;

function gameLoop(timestamp) {
  if (!state || state.phase !== 'playing') {
    animationFrame = requestAnimationFrame(gameLoop);
    return;
  }

  const dt = (timestamp - state.lastFrameTime) / 1000;
  state.lastFrameTime = timestamp;

  // Update elapsed time
  state.elapsed += dt;

  // Check game end
  if (state.elapsed >= state.duration) {
    finishGame();
    return;
  }

  // Rising water
  const waterProgress = state.elapsed / state.duration;
  state.waterLevel = Math.min(100, waterProgress * 100 + Math.random() * 0.5);

  // Dam degradation from water
  if (state.waterLevel > 30) {
    const degradationRate = (state.waterLevel - 30) / 70 * 2; // 0-2 health/sec
    const repairRate = countRepairingBeavers() * 1.5; // 1.5 health/sec per repairing beaver
    state.dammHealth = Math.max(0, state.dammHealth + (repairRate - degradationRate) * dt);
  }

  // Update beavers
  for (const beaver of state.beavers) {
    if (beaver.task) {
      const task = TASKS[beaver.task.toUpperCase()] || TASKS.FALLEN;
      beaver.taskTimer = Math.max(0, beaver.taskTimer - dt * 1000);
      beaver.taskProgress = 1 - (beaver.taskTimer / task.duration);

      if (beaver.taskTimer <= 0) {
        completeTask(beaver);
      }
    }

    // Movement
    if (beaver.moving) {
      const dx = beaver.targetX - beaver.x;
      const dy = beaver.targetY - beaver.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        beaver.moving = false;
        beaver.x = beaver.targetX;
        beaver.y = beaver.targetY;
        beaver.activity = 'working';
      } else {
        const speed = 100 * dt;
        beaver.x += (dx / dist) * speed;
        beaver.y += (dy / dist) * speed;
        beaver.activity = 'moving';
      }
    }
  }

  // Check if all beavers are done
  if (state.dammHealth <= 0) {
    finishGame();
    return;
  }

  // Render (safe for tests)
  if (typeof window !== 'undefined' && window.document) {
    const r = window.__flutRenderer;
    if (r) r.draw();
  }

  animationFrame = requestAnimationFrame(gameLoop);
}

function countRepairingBeavers() {
  return state.beavers.filter(b => b.task === 'STOPFEN' && b.taskTimer > 0).length;
}

function completeTask(beaver) {
  const task = TASKS[beaver.task.toUpperCase()] || TASKS.FALLEN;

  switch (beaver.task) {
    case 'FALLEN':
      state.resources.wood = Math.min(100, state.resources.wood + 5);
      break;
    case 'SCHLEPPEN':
      state.resources.wood = Math.max(0, state.resources.wood - 5);
      state.dammWidth = Math.min(100, state.dammWidth + 3);
      break;
    case 'STOPFEN':
      state.dammHealth = Math.min(100, state.dammHealth + 5);
      break;
    case 'TRAGEN':
      state.saved.food = Math.min(100, state.saved.food + 2);
      break;
    case 'BAUEN':
      state.dammWidth = Math.min(100, state.dammWidth + 5);
      break;
    case 'SICHERN':
      state.saved.beavers = Math.min(state.beavers.length, state.saved.beavers + 1);
      break;
  }

  beaver.task = null;
  beaver.taskTimer = 0;
  beaver.taskProgress = 0;
  beaver.activity = 'idle';
}

function finishGame() {
  state.phase = 'finished';
  if (animationFrame) cancelAnimationFrame(animationFrame);

  // Show the HTML end screen overlay (if accessible)
  if (typeof window !== 'undefined' && window.document) {
    const endScreen = window.document.getElementById('endScreen');
    const endDetails = window.document.getElementById('endDetails');
    const endComment = window.document.getElementById('endComment');
    const lastHistory = state.history[state.history.length - 1];
    if (endScreen && lastHistory) {
      endScreen.style.display = 'flex';
      if (endDetails) {
        endDetails.innerHTML = `
          <div class="score-display">Punkte: ${lastHistory.score}</div>
          <div>🦫 Biber gerettet: ${lastHistory.saved.beavers}</div>
          <div>🍎 Vorräte gerettet: ${lastHistory.saved.food}</div>
          <div>👶 Kinder gerettet: ${lastHistory.saved.children}</div>
        `;
      }
      if (endComment) {
        endComment.textContent = lastHistory.comment;
      }
    }
  }

  const officer = state.officer;
  const score = Math.round(
    (state.saved.beavers / state.beavers.length) * 40 +
    (state.saved.food / 100) * 30 +
    (state.saved.children / 10) * 30
  );

  const comments = {
    wortkarg: `Partie beendet. Bilanz: ${state.saved.beavers} Biber, ${state.saved.food} Vorräte.`,
    eigenmaechtig: `Hatte ich das richtig verstanden? Egal. Es war gut, General.`,
    vorsichtig: `Alles ist sicher. Ich bin zu langsam gewesen, aber niemand ist verloren.`,
    ungeduldig: `Zu spät? Vielleicht. Aber wir haben so viel gerettet wie möglich.`,
    ordnungsliebend: `Die Bilanz ist ordentlich geführt: ${score} Punkte.`,
    stolz: `Ein solider Auftrag. Keine Fehler, keine Ausreden.`,
    sparsam: `Habe gut gehaushaltet. Nichts wurde verschwendet.`,
    fürsorglich: `Die Kinder sind sicher. Das ist das Einzige, was zählt.`
  };

  const comment = officer.traits.map(t => comments[t]).filter(Boolean).join(' ') ||
    `Die Zusammenarbeit war in Ordnung.`;

  state.history.push({
    type: 'finished',
    score,
    comment,
    saved: { ...state.saved },
    officerName: officer.name
  });
}

// ── Commands ──
function sendCommand(goalText) {
  const now = Date.now();
  const timeSinceLast = (now - state.lastCommandTime) / 1000;

  if (timeSinceLast < state.commandCooldown && state.lastCommandTime > 0) {
    throw new Error(`Befehl warten. Noch ${Math.ceil(state.commandCooldown - timeSinceLast)}s.`);
  }

  state.lastCommandTime = now;

  // Generate orders locally (no API needed)
  const orders = generateOrders(goalText);
  applyOrders(orders.auftraege);
  state.lastResponse = orders;
  
  if (typeof window !== 'undefined' && window.document) {
    const r = window.__flutRenderer;
    if (r) r.draw();
  }
}

function generateOrders(goalText) {
  const beaverCount = state.beavers.filter(b => !b.task).length;
  const orders = [];
  
  // Simple AI: distribute beavers based on goal
  if (goalText.includes('damm') || goalText.includes('sichere')) {
    // Assign beavers to repair dam
    const stoppingCount = Math.min(3, beaverCount);
    for (let i = 0; i < state.beavers.length && orders.length < stoppingCount; i++) {
      const b = state.beavers[i];
      if (!b.task) {
        orders.push({ 
          einheit: b.name, 
          aufgabe: 'STOPFEN', 
          ort: 'zentral' 
        });
      }
    }
  } else if (goalText.includes('vorrat') || goalText.includes('retten')) {
    // Assign beavers to save food
    const gatheringCount = Math.min(2, beaverCount);
    for (let i = 0; i < state.beavers.length && orders.length < gatheringCount; i++) {
      const b = state.beavers[i];
      if (!b.task) {
        orders.push({ 
          einheit: b.name, 
          aufgabe: 'TRAGEN', 
          ort: 'vorrat' 
        });
      }
    }
  } else if (goalText.includes('bauen') || goalText.includes('erweitere')) {
    // Assign beavers to build dam
    const buildingCount = Math.min(2, beaverCount);
    for (let i = 0; i < state.beavers.length && orders.length < buildingCount; i++) {
      const b = state.beavers[i];
      if (!b.task) {
        orders.push({ 
          einheit: b.name, 
          aufgabe: 'BAUEN', 
          ort: 'zentral' 
        });
      }
    }
  }
  
  // Add some fallback orders if no beavers were assigned
  if (orders.length === 0 && beaverCount > 0) {
    const fallbackCount = Math.min(2, beaverCount);
    for (let i = 0; i < state.beavers.length && orders.length < fallbackCount; i++) {
      const b = state.beavers[i];
      if (!b.task) {
        orders.push({ 
          einheit: b.name, 
          aufgabe: 'STOPFEN', 
          ort: 'zentral' 
        });
      }
    }
  }

  // Generate officer speech bubble
  const officer = state.officer;
  const sprechblase = officer.traits.includes('wortkarg') 
    ? 'Verstanden.' 
    : officer.traits.includes('vorsichtig')
    ? 'Ich handle vorsichtig, General.'
    : 'Alles klar, General.';

  return { 
    auftraege: orders, 
    sprechblase,
    vorschlaege: [] 
  };
}

function applyOrders(orders) {
  for (const order of orders) {
    const beaver = state.beavers.find(b => b.name === order.einheit);
    if (beaver) {
      beaver.task = order.aufgabe.toUpperCase();
      beaver.taskTimer = TASKS[order.aufgabe.toUpperCase()]?.duration || 10000;
      beaver.taskProgress = 0;

      // Move beaver to location
      const locations = {
        zentral: { x: DAMM_X, y: DAMM_Y - 20 },
        wald: { x: 100, y: DAMM_Y - 40 },
        vorrat: { x: WORLD_WIDTH - 100, y: DAMM_Y - 30 },
        links: { x: DAMM_X - 100, y: DAMM_Y - 20 },
        rechts: { x: DAMM_X + 100, y: DAMM_Y - 20 }
      };

      const loc = locations[order.ort] || locations.zentral;
      beaver.targetX = loc.x;
      beaver.targetY = loc.y;
      beaver.moving = true;
      beaver.activity = 'moving';
    }
  }
}

function resetGame() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  state = null;
}

function getCurrentState() {
  return state;
}

function startGameLoop() {
  if (state) {
    state.lastFrameTime = performance.now();
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

// ── Export for module use ──
export {
  createGame,
  resetGame,
  getCurrentState,
  startGameLoop,
  sendCommand,
  getDefaultOfficers,
  loadOfficer,
  finishGame,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  DAMM_X,
  DAMM_Y,
  DAMM_HEIGHT
};
