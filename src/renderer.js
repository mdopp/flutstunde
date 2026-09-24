/**
 * Flutstunde — Canvas Renderer
 * Renders the cross-section view with rising water, beavers, and dam
 */

import { state, WORLD_WIDTH, WORLD_HEIGHT, DAMM_X, DAMM_Y, DAMM_HEIGHT } from './game.js';

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const container = this.canvas.parentElement;
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 540;
    
    // Skip resize if container has no size (hidden)
    if (w === 0 || h === 0) return;
    
    this.canvas.width = w;
    this.canvas.height = h;
    this.draw();
  }

  // Call this when canvas becomes visible
  init() {
    this.resize();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    if (!state) {
      // Draw placeholder when no game
      ctx.fillStyle = '#fff';
      ctx.font = '24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Kein Spiel aktiv', w / 2, h / 2);
      ctx.textAlign = 'left';
      return;
    }

    // Calculate world-to-screen transform
    const worldToScreenX = w / WORLD_WIDTH;
    const worldToScreenY = h / WORLD_HEIGHT;
    const worldToScreen = Math.min(worldToScreenX, worldToScreenY);

    // Draw world
    ctx.save();
    ctx.scale(worldToScreen, worldToScreen);

    // Sky gradient (darker as water rises)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT * 0.4);
    const danger = Math.min(1, state?.waterLevel || 0) / 100;
    skyGradient.addColorStop(0, `rgb(${30 + danger * 40}, ${20 + danger * 10}, ${50 - danger * 20})`);
    skyGradient.addColorStop(1, `rgb(${60 + danger * 30}, ${50 + danger * 20}, ${40 + danger * 10})`);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Ground
    const groundY = WORLD_HEIGHT - 100;
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, WORLD_HEIGHT);
    groundGradient.addColorStop(0, '#4a6741');
    groundGradient.addColorStop(1, '#3a5030');
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    ctx.moveTo(0, groundY);

    // Terrain
    for (let x = 0; x <= WORLD_WIDTH; x += 20) {
      const terrainHeight = Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 8;
      ctx.lineTo(x, groundY + terrainHeight);
    }
    ctx.lineTo(WORLD_WIDTH, WORLD_HEIGHT);
    ctx.lineTo(0, WORLD_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Left forest
    this.drawForest(ctx, WORLD_WIDTH, groundY);

    // Right bank
    this.drawRightBank(ctx, WORLD_WIDTH, groundY);

    // Dam
    this.drawDamm(ctx, WORLD_WIDTH, groundY);

    // Water (rising from right)
    this.drawWater(ctx, WORLD_WIDTH, WORLD_HEIGHT, groundY);

    // Beavers
    this.drawBeavers(ctx, WORLD_WIDTH, groundY);

    // UI overlay
    this.drawUI(ctx, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.restore();

    // Draw world border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);
  }

  drawForest(ctx, w, groundY) {
    const treePositions = [
      { x: 60, h: 120 },
      { x: 120, h: 100 },
      { x: 180, h: 130 },
      { x: 240, h: 90 }
    ];

    for (const tree of treePositions) {
      // Trunk
      ctx.fillStyle = '#5a3e28';
      ctx.fillRect(tree.x - 4, groundY - tree.h, 8, tree.h);

      // Canopy
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.arc(tree.x, groundY - tree.h, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3a7a32';
      ctx.beginPath();
      ctx.arc(tree.x + 8, groundY - tree.h + 5, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawRightBank(ctx, w, groundY) {
    // Right bank slope
    ctx.fillStyle = '#5a7a4a';
    ctx.beginPath();
    ctx.moveTo(w - 150, groundY);
    ctx.lineTo(w, groundY);
    ctx.lineTo(w, groundY + 40);
    ctx.lineTo(w - 150, groundY + 60);
    ctx.closePath();
    ctx.fill();

    // Resources on right bank
    if (state) {
      // Food storage
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(w - 80, groundY - 30, 30, 30);
      ctx.fillStyle = '#654321';
      ctx.fillText('🍎', w - 75, groundY - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '12px system-ui';
      ctx.fillText(state.resources?.food || 0, w - 78, groundY - 40);

      // Children
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(w - 130, groundY - 25, 25, 25);
      ctx.fillStyle = '#654321';
      ctx.fillText('👶', w - 125, groundY - 7);
      ctx.fillStyle = '#fff';
      ctx.fillText(state.resources?.children || 0, w - 128, groundY - 35);
    }
  }

  drawDamm(ctx, w, groundY) {
    const dammX = DAMM_X;
    const dammWidth = 80;
    const dammHeight = DAMM_HEIGHT;

    // Dam structure
    const healthColor = state?.dammHealth > 60 ? '#6b8e6b' :
                       state?.dammHealth > 30 ? '#b8860b' : '#8b0000';

    // Main dam body
    ctx.fillStyle = healthColor;
    ctx.fillRect(dammX - dammWidth / 2, groundY - dammHeight, dammWidth, dammHeight);

    // Dam texture (layers)
    for (let i = 0; i < 5; i++) {
      const y = groundY - dammHeight + i * 40;
      ctx.strokeStyle = `rgba(0,0,0,${0.1 + i * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(dammX - dammWidth / 2, y);
      for (let x = dammX - dammWidth / 2; x <= dammX + dammWidth / 2; x += 5) {
        ctx.lineTo(x, y + Math.sin(x * 0.1 + i) * 3);
      }
      ctx.stroke();
    }

    // Built-up width indicator
    if (state?.dammWidth) {
      const widthBonus = (state.dammWidth / 100) * 40;
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(dammX + dammWidth / 2, groundY - dammHeight, widthBonus, dammHeight);
      ctx.fillRect(dammX - dammWidth / 2 - widthBonus, groundY - dammHeight, widthBonus, dammHeight);
    }

    // Health bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(dammX - 30, groundY - dammHeight - 25, 60, 8);
    ctx.fillStyle = healthColor;
    ctx.fillRect(dammX - 30, groundY - dammHeight - 25, 60 * (state?.dammHealth / 100 || 0), 8);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dammX - 30, groundY - dammHeight - 25, 60, 8);
  }

  drawWater(ctx, w, h, groundY) {
    if (!state) return;

    const waterHeight = (state.waterLevel / 100) * (h - groundY);
    const waterY = groundY - waterHeight;

    // Water body (from right)
    const waterGradient = ctx.createLinearGradient(0, waterY, 0, groundY);
    waterGradient.addColorStop(0, 'rgba(30, 60, 120, 0.6)');
    waterGradient.addColorStop(0.5, 'rgba(20, 50, 100, 0.7)');
    waterGradient.addColorStop(1, 'rgba(10, 30, 80, 0.8)');

    ctx.fillStyle = waterGradient;
    ctx.beginPath();
    ctx.moveTo(w / 3 - 40, groundY);

    // Wave surface
    const time = Date.now() / 1000;
    for (let x = w / 3 - 40; x <= w; x += 3) {
      const wave = Math.sin((x - time * 30) * 0.02) * 4 +
                   Math.sin((x - time * 50) * 0.05) * 2;
      ctx.lineTo(x, waterY + wave);
    }

    ctx.lineTo(w, groundY);
    ctx.lineTo(w / 3 - 40, groundY);
    ctx.closePath();
    ctx.fill();

    // Water surface shimmer
    ctx.strokeStyle = 'rgba(100, 150, 220, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const shimmerY = waterY + 10 + i * 20;
      ctx.beginPath();
      for (let x = w / 3; x <= w - 20; x += 5) {
        const wave = Math.sin((x - time * 20 + i * 50) * 0.03) * 3;
        if (x === w / 3) ctx.moveTo(x, shimmerY + wave);
        else ctx.lineTo(x, shimmerY + wave);
      }
      ctx.stroke();
    }
  }

  drawBeavers(ctx, w, groundY) {
    if (!state) return;

    for (const beaver of state.beavers) {
      const x = beaver.x;
      const y = beaver.y;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(x, groundY + 5, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = '#6B4423';
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#8B6342';
      ctx.beginPath();
      ctx.arc(x + 8, y - 5, 7, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x + 10, y - 7, 2, 0, Math.PI * 2);
      ctx.fill();

      // Task indicator
      if (beaver.task) {
        const task = TASKS[beaver.task];
        ctx.font = '14px system-ui';
        ctx.fillText(task?.icon || '⚒️', x - 7, y - 20);

        // Progress bar
        if (beaver.taskTimer > 0 && beaver.taskProgress < 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(x - 10, y + 12, 20, 3);
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(x - 10, y + 12, 20 * beaver.taskProgress, 3);
        }
      }

      // Name label
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '9px system-ui';
      ctx.fillText(beaver.name, x - 12, y - 25);
    }
  }

  drawUI(ctx, w, h) {
    if (!state) return;

    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, 40);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';

    // Timer
    const remaining = Math.max(0, state.duration - state.elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, 15, 26);

    // Water level
    ctx.fillText(`🌊 ${Math.round(state.waterLevel)}%`, 180, 26);

    // Dam health
    const dammColor = state.dammHealth > 60 ? '#4CAF50' :
                     state.dammHealth > 30 ? '#FFC107' : '#f44336';
    ctx.fillStyle = dammColor;
    ctx.fillText(`🏗️ ${Math.round(state.dammHealth)}%`, 340, 26);

    // Officer name
    ctx.fillStyle = '#aaa';
    ctx.font = '12px system-ui';
    ctx.fillText(`Offizier: ${state.officer?.name || '—'}`, w - 180, 26);

    // Command cooldown indicator
    const now = Date.now();
    const timeSinceLast = (now - state.lastCommandTime) / 1000;
    if (state.lastCommandTime > 0 && timeSinceLast < state.commandCooldown) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(0, 40, w * (timeSinceLast / state.commandCooldown), 3);
    }

    // Bottom bar - resource panel
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, h - 35, w, 35);

    ctx.font = '13px system-ui';
    ctx.fillStyle = '#fff';
    ctx.fillText(`🪵 ${state.resources?.wood || 0}`, 15, h - 14);
    ctx.fillText(`🍎 ${state.resources?.food || 0}`, 100, h - 14);
    ctx.fillText(`👶 ${state.resources?.children || 0}`, 190, h - 14);
    ctx.fillText(`🦫 ${state.beavers?.filter(b => !b.task)?.length || 0} frei`, 280, h - 14);

    // Command cooldown text
    if (state.lastCommandTime > 0 && timeSinceLast < state.commandCooldown) {
      ctx.fillStyle = '#f44336';
      ctx.fillText(`⏳ ${Math.ceil(state.commandCooldown - timeSinceLast)}s`, w - 120, h - 14);
    }

    // Paused overlay
    if (state.phase === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSE', w / 2, h / 2);
      ctx.textAlign = 'left';
    }

    // End screen overlay
    if (state.phase === 'finished') {
      const lastHistory = state.history[state.history.length - 1];
      if (lastHistory && lastHistory.type === 'finished') {
        this.drawEndScreen(lastHistory.score, lastHistory.comment);
      }
    }
  }

  drawEndScreen(score, comment) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('BILANZ', w / 2, 80);

    ctx.font = '18px system-ui';
    ctx.fillText(`Punkte: ${score}`, w / 2, 130);

    ctx.font = '16px system-ui';
    ctx.fillText(`🦫 Biber gerettet: ${state?.saved?.beavers || 0}`, w / 2, 180);
    ctx.fillText(`🍎 Vorräte gerettet: ${state?.saved?.food || 0}`, w / 2, 210);
    ctx.fillText(`👶 Kinder gerettet: ${state?.saved?.children || 0}`, w / 2, 240);

    // Officer comment
    ctx.fillStyle = '#aaa';
    ctx.font = 'italic 14px system-ui';
    const lines = this.wrapText(comment, w - 100, 14);
    let lineY = 300;
    for (const line of lines) {
      ctx.fillText(line, w / 2, lineY);
      lineY += 20;
    }

    // Reset button
    const btnX = w / 2 - 80;
    const btnY = 420;
    const btnW = 160;
    const btnH = 45;

    ctx.fillStyle = '#2a5a8a';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText('Neue Partie', w / 2, btnY + 28);

    ctx.textAlign = 'left';

    // Store button bounds for click detection
    this.buttonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
      const test = current + (current ? ' ' : '') + word;
      if (ctx?.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}

// ── Task definitions (for renderer) ──
const TASKS = {
  FALLEN: { name: 'fällen', icon: '🪓', duration: 8000 },
  SCHLEPPEN: { name: 'schleppen', icon: '📦', duration: 6000 },
  STOPFEN: { name: 'Lehm stopfen', icon: '✋', duration: 10000 },
  TRAGEN: { name: 'Vorräte tragen', icon: '🍎', duration: 7000 },
  BAUEN: { name: 'bauen', icon: '🔨', duration: 12000 },
  SICHERN: { name: 'sichern', icon: '👁️', duration: 5000 }
};

// Export
export default Renderer;
export { TASKS };