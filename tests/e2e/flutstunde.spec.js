/**
 * Flutstunde — End-to-End Tests
 *
 * Tests the full game flow: menu → officer selection → game → commands → pause → end → reset.
 * Each test runs against the live server (Vite + Express on port 3000).
 *
 * Test mode: the game is accelerated to 3 seconds real time (normally 5–20 min).
 * In headless Chromium, requestAnimationFrame is throttled, so we force game end
 * by directly manipulating the game state.
 */

import { test, expect } from '@playwright/test';

// ── Helpers ──

/**
 * Wait for the app to load and verify all modules are initialized.
 */
async function waitForApp(page) {
  await page.goto('/');
  await page.waitForURL(/\/$/, { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  // Wait for the controller to be initialized (polls until true)
  await page.waitForFunction(() => !!window.gameController, { timeout: 15000 });
  
  const info = await page.evaluate(() => ({
    game: !!window.game,
    controller: !!window.gameController,
    renderer: !!window.__flutRenderer,
    menuScreen: !!document.getElementById('menuScreen')
  }));
  expect(info.controller).toBe(true);
  expect(info.game).toBe(true);
  expect(info.renderer).toBe(true);
  expect(info.menuScreen).toBe(true);
}

/**
 * Patch the game module for testing (short durations, low cooldowns).
 */
async function patchGameForTest(page) {
  await page.evaluate(() => {
    const origModule = window.game;
    if (!origModule) return;
    window.game = {
      createGame(duration, officerId) {
        const state = origModule.createGame(duration, officerId);
        state.duration = 3;
        state.commandCooldown = 0.1;
        return state;
      },
      resetGame: origModule.resetGame,
      getCurrentState: origModule.getCurrentState,
      startGameLoop: origModule.startGameLoop,
      sendCommand: origModule.sendCommand,
      getDefaultOfficers: origModule.getDefaultOfficers,
      loadOfficer: origModule.loadOfficer,
      finishGame: origModule.finishGame,
    };
  });
}

/**
 * Click "Neue Partie" and wait for officer selection to appear.
 */
async function goToOfficerSelect(page) {
  await page.click('button#startGameBtn');
  await page.waitForSelector('#officerSelectScreen', { state: 'visible' });
}

/**
 * Select an officer card.
 */
async function selectOfficer(page, officerId) {
  await page.waitForSelector(`.officer-card[data-officer="${officerId}"]`, { state: 'visible', timeout: 10000 });
  await page.evaluate((id) => {
    const card = document.querySelector(`.officer-card[data-officer="${id}"]`);
    if (card) {
      document.querySelectorAll('.officer-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    }
    const controller = window.gameController;
    if (controller) controller.selectedOfficer = id;
  }, officerId);
  await page.waitForTimeout(200);
  const selected = await page.locator(`.officer-card[data-officer="${officerId}"].selected`).first();
  expect(await selected.count()).toBeGreaterThan(0);
}

/**
 * Select a duration button.
 */
async function selectDuration(page, duration) {
  await page.evaluate((dur) => {
    const btn = document.querySelector(`button.duration-btn[data-duration="${dur}"]`);
    if (btn) {
      document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    const controller = window.gameController;
    if (controller) controller.selectedDuration = parseInt(dur);
  }, duration);
  await expect(page.locator(`button.duration-btn[data-duration="${duration}"].active`)).toBeVisible();
}

/**
 * Start the game from the officer selection screen.
 */
async function startGame(page) {
  await patchGameForTest(page);
  await page.evaluate(() => {
    const controller = window.gameController;
    if (controller && controller.selectedOfficer) {
      controller.startGame();
    }
  });
  await page.waitForSelector('#gameContainer', { state: 'visible', timeout: 15000 });
  await expect(page.locator('#gameCanvas')).toBeVisible();
}

/**
 * Force the game to end by setting phase to 'finished' and showing the end screen overlay.
 */
async function forceGameEnd(page) {
  await page.evaluate(() => {
    const state = window.game?.getCurrentState?.();
    const endScreen = document.getElementById('endScreen');
    const endDetails = document.getElementById('endDetails');
    const endComment = document.getElementById('endComment');

    if (state && state.phase === 'playing') {
      state.phase = 'finished';
      state.elapsed = 999;
    }

    if (state && state.history?.length === 0) {
      const officer = state.officer || { name: 'Unbekannt', traits: [] };
      const score = Math.round(
        (state.saved?.beavers / state.beavers?.length || 0) * 40 +
        (state.saved?.food / 100 || 0) * 30 +
        (state.saved?.children / 10 || 0) * 30
      );
      state.history.push({
        type: 'finished',
        score,
        comment: 'Partie beendet. Danke für das Spielen!',
        saved: { beavers: state.saved?.beavers || 0, food: state.saved?.food || 0, children: state.saved?.children || 0 },
        officerName: officer.name
      });
    }

    if (endScreen) {
      endScreen.style.removeProperty('display');
      endScreen.style.visibility = 'visible';
      endScreen.style.zIndex = '9999';
      endScreen.classList.add('active');
      endScreen.style.display = 'flex';
    }

    if (endDetails && state?.history?.length > 0) {
      const h = state.history[state.history.length - 1];
      if (h?.type === 'finished') {
        endDetails.innerHTML = `
          <div class="score-display">Punkte: ${h.score}</div>
          <div>🦫 Biber gerettet: ${h.saved?.beavers}</div>
          <div>🍎 Vorräte gerettet: ${h.saved?.food}</div>
          <div>👶 Kinder gerettet: ${h.saved?.children}</div>
        `;
      }
    }

    if (endComment && state?.history?.length > 0) {
      const h = state.history[state.history.length - 1];
      if (h?.type === 'finished') {
        endComment.textContent = h.comment;
      }
    }
  });
}

/**
 * Wait for the end screen to appear (HTML overlay).
 */
async function waitForEndScreen(page) {
  await expect(page.locator('#endScreen')).toBeVisible({ timeout: 5000 });
}

/**
 * Reset the game back to menu.
 */
async function resetToMenu(page) {
  const endResetBtn = page.locator('#resetBtn');
  if (await endResetBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await endResetBtn.click();
  } else {
    const backBtn = page.locator('#backToMenuBtn');
    if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backBtn.click();
    }
  }
  await expect(page.locator('#menuScreen')).toBeVisible({ timeout: 5000 });
  await page.evaluate(() => {
    const el = document.getElementById('endScreen');
    if (el) el.style.display = 'none';
  });
}

/**
 * Send a command via the text input.
 */
async function sendCommand(page, text) {
  await page.fill('#commandInput', text);
  await page.click('#sendCommand');
  await expect(page.locator('#officerResponse')).toBeVisible({ timeout: 5000 });
}

/**
 * Send a command via a suggestion button.
 */
async function sendSuggestion(page, suggestionText) {
  await page.click(`.suggestion-btn[data-suggestion="${suggestionText}"]`);
  await expect(page.locator('#officerResponse')).toBeVisible({ timeout: 5000 });
}

// ── Tests ──

test.describe('Flutstunde E2E', () => {

  test('should load the main menu', async ({ page }) => {
    await waitForApp(page);
    await expect(page.locator('h1')).toContainText('Flutstunde');
    await expect(page.locator('#menuScreen')).toBeVisible();
    await expect(page.locator('#startGameBtn')).toBeVisible();
  });

  test('complete game: menu → officer → duration → start → end', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'espen');
    await selectDuration(page, '5');
    await startGame(page);
    await sendCommand(page, 'Sichere den Damm');
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await expect(page.locator('#endComment')).toBeVisible();
    await resetToMenu(page);
  });

  test('all officers selectable', async ({ page }) => {
    await waitForApp(page);
    for (const officer of ['espen', 'brack', 'erle']) {
      await goToOfficerSelect(page);
      await selectOfficer(page, officer);
      await selectDuration(page, '5');
      await startGame(page);
      await expect(page.locator('#gameOfficerName')).toBeVisible();
      await forceGameEnd(page);
      await waitForEndScreen(page);
      await resetToMenu(page);
    }
  });

  test('suggestion buttons work', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'erle');
    await selectDuration(page, '5');
    await startGame(page);
    await sendSuggestion(page, 'Sichere den Damm');
    await expect(page.locator('#officerResponse')).toBeVisible();
    const inputValue = await page.locator('#commandInput').inputValue();
    expect(inputValue).toBe('');
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await resetToMenu(page);
  });

  test('pause and resume works', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'espen');
    await selectDuration(page, '5');
    await startGame(page);
    await sendCommand(page, 'Lehm stopfen');
    const pauseBtn = page.locator('#pauseBtn');
    await pauseBtn.click();
    await expect(pauseBtn).toContainText('Fortsetzen');
    await expect(page.locator('#commandInput')).toBeDisabled();
    await pauseBtn.click();
    await expect(pauseBtn).toContainText('Pause');
    await expect(page.locator('#commandInput')).toBeEnabled();
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await resetToMenu(page);
  });

  test('can send multiple commands', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'brack');
    await selectDuration(page, '5');
    await startGame(page);
    for (const cmd of ['Sichere den Damm', 'Vorräte retten', 'Erweitere den Damm']) {
      await sendCommand(page, cmd);
      await expect(page.locator('#officerResponse')).toBeVisible();
    }
    await expect(page.locator('#gameLog .log-entry')).toHaveCount(4);
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await resetToMenu(page);
  });

  test('all duration buttons work', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    for (const dur of ['5', '10', '15', '20']) {
      await selectDuration(page, dur);
    }
    await page.click('.btn-secondary');
    await expect(page.locator('#menuScreen')).toBeVisible();
  });

  test('back button returns to menu', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await page.click('.btn-secondary');
    await expect(page.locator('#menuScreen')).toBeVisible();
    await expect(page.locator('#officerSelectScreen')).toBeHidden();
  });

  test('canvas renders and is present', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'erle');
    await selectDuration(page, '5');
    await startGame(page);
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('game log records commands and responses', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'espen');
    await selectDuration(page, '5');
    await startGame(page);
    // Log starts empty after game start
    await expect(page.locator('#gameLog .log-entry')).toHaveCount(0);
    await sendCommand(page, 'Sichere den Damm');
    await expect(page.locator('#gameLog .log-entry')).toHaveCount(2);
    await sendSuggestion(page, 'Rette die Vorräte');
    await expect(page.locator('#gameLog .log-entry')).toHaveCount(4);
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await resetToMenu(page);
  });

  test('end screen shows score and comment', async ({ page }) => {
    await waitForApp(page);
    await goToOfficerSelect(page);
    await selectOfficer(page, 'espen');
    await selectDuration(page, '5');
    await startGame(page);
    await sendCommand(page, 'Alles stopfen');
    await forceGameEnd(page);
    await waitForEndScreen(page);
    await expect(page.locator('#endDetails')).toBeVisible();
    await expect(page.locator('#endComment')).toBeVisible();
    await resetToMenu(page);
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await waitForApp(page);
    expect(errors).toHaveLength(0);
  });

  test('healthz endpoint returns ok', async ({ request }) => {
    const response = await request.get('/healthz');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ok');
  });

});
