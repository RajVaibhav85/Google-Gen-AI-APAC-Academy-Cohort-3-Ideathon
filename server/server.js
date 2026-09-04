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

// Middleware to verify Firebase ID Token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (admin.apps.length > 0) {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      return next();
    } else {
      // Decode base64 JWT payload safely if admin SDK is not yet bound to GCP
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        req.user = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        return next();
      }
    }
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden', message: 'Invalid token', details: err.message });
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

app.listen(PORT, () => {
  console.log(`MERN Express Backend running on http://localhost:${PORT}`);
});

module.exports = app;
