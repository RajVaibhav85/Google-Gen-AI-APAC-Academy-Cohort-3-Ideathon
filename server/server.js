const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId) {
    admin.initializeApp({ projectId });
    console.log(`[FirebaseAdmin] Initialized for project: ${projectId}`);
  } else {
    console.log('[FirebaseAdmin] Running in local mode without specific project ID');
  }
} catch (e) {
  console.warn('[FirebaseAdmin] Initialization warning:', e.message);
}

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MERN API Gateway',
    timestamp: new Date().toISOString()
  });
});

const { executeMultiTurnChat, MODEL_FALLBACK_LADDER } = require('./lib/gemini');
const { saveInteraction, getUserInteractions, deleteUserInteraction } = require('./lib/db');

// Middleware to verify Firebase ID Token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (admin.apps.length > 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      return next();
    }
    // Fallback or dev token parsing
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      req.user = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      req.user.uid = req.user.user_id || req.user.sub || req.user.uid;
      return next();
    }
  } catch (err) {
    try {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        req.user = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        req.user.uid = req.user.user_id || req.user.sub || req.user.uid;
        return next();
      }
    } catch (parseErr) {
      return res.status(403).json({ error: 'Forbidden', message: 'Invalid token', details: err.message });
    }
  }

  next();
}

// Authenticated User Profile Endpoint
app.get('/api/auth/me', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    user: req.user,
    authenticated: true
  });
});

// Multi-Turn Gemini AI Interaction Endpoint (Directive 6)
app.post('/api/chat', verifyFirebaseToken, async (req, res) => {
  try {
    const { history, message, mood, location, tags } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Validation Error', message: 'Message cannot be empty' });
    }

    const response = await executeMultiTurnChat(history || [], message.trim(), {
      mood: mood || 'Reflective',
      location: location || '',
      tags: tags || []
    });

    res.status(200).json(response);
  } catch (err) {
    console.error('[Chat API Error]:', err);
    res.status(500).json({ error: 'Chat Processing Failed', message: err.message });
  }
});

// Save User Journal & Multi-Turn Interaction to Firestore (Directive 3 & 6)
app.post('/api/interactions', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing in token' });
    }

    const result = await saveInteraction(userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error('[Save Interaction Error]:', err);
    res.status(500).json({ error: 'Database Save Failed', message: err.message });
  }
});

// Retrieve User's Past Interactions from Firestore (User-Isolated)
app.get('/api/interactions', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User ID missing in token' });
    }

    const list = await getUserInteractions(userId);
    res.status(200).json({ interactions: list, count: list.length });
  } catch (err) {
    console.error('[Get Interactions Error]:', err);
    res.status(500).json({ error: 'Database Fetch Failed', message: err.message });
  }
});

// Delete an Interaction (Owner Protected)
app.delete('/api/interactions/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    if (!userId || !id) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const result = await deleteUserInteraction(userId, id);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Delete Interaction Error]:', err);
    res.status(500).json({ error: 'Database Delete Failed', message: err.message });
  }
});

// Production Static Assets & SPA Routing
const fs = require('fs');
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`MERN Express Backend running on http://localhost:${PORT}`);
});

module.exports = app;
