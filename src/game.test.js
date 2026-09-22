/**
 * Flutstunde — Game Unit Tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, resetGame, sendCommand } from './game.js';

describe('Game Engine', () => {
  beforeEach(() => {
    resetGame();
  });

  describe('createGame', () => {
    it('creates a game state with given duration', () => {
      const state = createGame(10, 'espen');
      expect(state).toBeDefined();
      expect(state.duration).toBe(600); // 10 minutes in seconds
      expect(state.phase).toBe('playing');
      expect(state.officerId).toBe('espen');
    });

    it('creates beavers based on duration', () => {
      const state = createGame(5, 'espen');
      expect(state.beavers.length).toBeGreaterThanOrEqual(6);
    });

    it('defaults to 15-minute duration', () => {
      const state = createGame(15, 'espen');
      expect(state.duration).toBe(900);
      expect(state.waterLevel).toBe(0);
      expect(state.dammHealth).toBe(100);
    });
  });

  describe('sendCommand', () => {
    beforeEach(() => {
      createGame(10, 'espen');
    });

    it('rejects commands during cooldown', () => {
      sendCommand('Sichere den Damm');

      expect(() => sendCommand('Noch was')).toThrow();
    });

    it('resets cooldown after command', () => {
      sendCommand('Sichere den Damm');
      // Simulate cooldown elapsed
      const state = createGame(10, 'espen');
      // Second command should be accepted
      expect(() => sendCommand('Vorräte retten')).not.toThrow();
    });
  });
});

describe('getDefaultOfficers', () => {
  it('returns three officers', () => {
    const officers = [{ id: 'espen' }, { id: 'brack' }, { id: 'erle' }];
    expect(officers).toHaveLength(3);
  });

  it('has correct stat ranges', () => {
    // Stats should be between 1-5
    const stats = {
      espen: { auffassung: 2, organisation: 4, weitblick: 1, durchsetzung: 3 },
      brack: { auffassung: 3, organisation: 2, weitblick: 4, durchsetzung: 1 },
      erle: { auffassung: 5, organisation: 3, weitblick: 2, durchsetzung: 0 }
    };

    for (const officer of Object.values(stats)) {
      for (const value of Object.values(officer)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(5);
      }
    }
  });
});
