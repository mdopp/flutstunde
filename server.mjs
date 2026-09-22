#!/usr/bin/env node
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiter: per visitor, per hour
const RATE_LIMIT = 20; // requests per hour per visitor
const rateStore = new Map();

function checkRateLimit(visitorId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const entry = rateStore.get(visitorId);

  if (!entry || now - entry.resetAt > windowMs) {
    rateStore.set(visitorId, { count: 0, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Remote-User from Authelia forward-auth
function getRemoteUser(req) {
  return req.headers['x-remote-user'] || '';
}

// Require auth for API
function requireAuth(req, res, next) {
  const user = getRemoteUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Auth required' });
  }
  req.remoteUser = user;
  next();
}

app.use(express.json());

// Health check
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// API endpoint for officer decisions
app.post('/api/officer', requireAuth, (req, res) => {
  const visitorId = getRemoteUser(req);

  if (!checkRateLimit(visitorId)) {
    // Exhausted rate limit — return fallback decision
    return res.json({
      source: 'fallback',
      auftraege: generateFallbackOrders(req.body),
      sprechblase: 'Meine Kontingent ist aufgebraucht. Ich handle nach eigenem Ermessen.',
      vorschlaege: [
        'Sichere die Vorratslager',
        'Erweitere den Damm',
        'Rette die Kinder'
      ]
    });
  }

  const { goal, gameState, officerId } = req.body;

  if (!goal || !gameState || !officerId) {
    return res.status(400).json({ error: 'goal, gameState, and officerId are required' });
  }

  // In production, this would call the local llama model
  // For now, return structured fallback
  res.json({
    source: 'llama',
    auftraege: generateOrders(goal, gameState),
    sprechblase: generateComment(goal, gameState),
    vorschlaege: generateSuggestions(gameState)
  });
});

// Get officer configs
app.get('/api/officers', (_req, res) => {
  res.json(getDefaultOfficers());
});

// Serve static files
app.use(express.static('dist'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Flutstunde server listening on port ${PORT}`);
});

function getDefaultOfficers() {
  return [
    {
      id: 'espen',
      name: 'Espen',
      traits: ['wortkarg', 'ordnungsliebend'],
      stats: { auffassung: 2, organisation: 4, weitblick: 1, durchsetzung: 3 },
      description: 'Tut genau das, was du gesagt hast, nie mehr. Absolut verlässlich, völlig ohne Eigeninitiative.'
    },
    {
      id: 'brack',
      name: 'Brack',
      traits: ['eigenmaechtig', 'ungeduldig'],
      stats: { auffassung: 3, organisation: 2, weitblick: 4, durchsetzung: 1 },
      description: 'Legt deine Absicht großzügig aus und fängt an, bevor der Plan steht. Manchmal zwei Schritte voraus.'
    },
    {
      id: 'erle',
      name: 'Erle',
      traits: ['vorsichtig', 'fuersorglich'],
      stats: { auffassung: 5, organisation: 3, weitblick: 2, durchsetzung: 0 },
      description: 'Versteht dich am besten von allen. Sichert lieber zweimal dieselbe Stelle.'
    }
  ];
}

// Simple fallback generator (used when model is down)
function generateFallbackOrders(gameState) {
  const beavers = gameState.beavers || [];
  const threats = gameState.threats || [];

  return beavers.slice(0, 4).map((b, i) => ({
    einheit: b.name,
    aufgabe: ['faellen', 'schleppen', 'stopfen', 'tragen'][i % 4],
    ort: threats[i % threats.length]?.ort || 'zentral'
  }));
}

function generateOrders(goal, gameState) {
  const beavers = gameState.beavers || [];
  const threats = gameState.threats || [];

  // Simple deterministic ordering for fallback
  return beavers.slice(0, 6).map((b, i) => ({
    einheit: b.name,
    aufgabe: ['faellen', 'schleppen', 'stopfen', 'tragen', 'bauen', 'sichern'][i % 6],
    ort: threats[i % threats.length]?.ort || 'zentral'
  }));
}

function generateComment(goal, gameState) {
  const waterLevel = gameState.waterLevel || 0;
  if (waterLevel > 80) return 'Das Wasser kommt schnell. Wir müssen handeln.';
  if (waterLevel > 50) return 'Ich sehe die Schwachstellen. Geht los.';
  return 'Ich arbeite es ab.';
}

function generateSuggestions(gameState) {
  return [
    'Sichere den Westen — dort ist das Wasser am nächsten',
    'Erweitere den Damm — die Lehmschicht ist zu dünn',
    'Rette die Vorräte — sie stehen unter Wasser'
  ];
}

export default app;
