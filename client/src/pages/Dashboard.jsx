import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { currentUser, token, logout } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const providerId = currentUser?.providerData?.[0]?.providerId || 'firebase';

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="dashboard-nav glass-panel">
        <div className="nav-brand">
          <div className="brand-logo-small">
            <svg className="sparkle-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
            </svg>
          </div>
          <h1 className="brand-heading">Gemini MERN Workspace</h1>
        </div>

        <div className="nav-user-actions">
          <div className="user-pill">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="user-avatar-img" />
            ) : (
              <div className="user-avatar-placeholder">
                {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="user-pill-name">
              {currentUser?.displayName || currentUser?.email?.split('@')[0]}
            </span>
          </div>

          <button type="button" className="btn-signout" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-main">
        <div className="welcome-banner glass-panel">
          <div className="welcome-text">
            <span className="badge-tag">Authenticated Session</span>
            <h2 className="welcome-title">
              Welcome, {currentUser?.displayName || 'Developer'}! 👋
            </h2>
            <p className="welcome-desc">
              Your Firebase Authentication is active via secure Email and Password.
            </p>
          </div>

          <div className="provider-chip">
            <span className="provider-dot"></span>
            <span>Provider: Firebase Email/Password</span>
          </div>
        </div>

        {/* Profile & Security Dossier Grid */}
        <div className="dossier-grid">
          {/* User Profile Card */}
          <div className="dossier-card glass-panel">
            <h3 className="card-title">User Identity Metadata</h3>
            <div className="meta-list">
              <div className="meta-item">
                <span className="meta-label">Display Name</span>
                <span className="meta-value">{currentUser?.displayName || 'Not Set'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Email Address</span>
                <span className="meta-value">{currentUser?.email}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Firebase UID</span>
                <span className="meta-value mono">{currentUser?.uid}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Email Verified</span>
                <span className={`status-tag ${currentUser?.emailVerified ? 'verified' : 'unverified'}`}>
                  {currentUser?.emailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Token & Backend Handshake Card */}
          <div className="dossier-card glass-panel">
            <div className="card-header-row">
              <h3 className="card-title">Bearer JWT Token</h3>
              <button
                type="button"
                className="mini-copy-btn"
                onClick={handleCopyToken}
              >
                {copiedToken ? '✓ Copied' : '📋 Copy Token'}
              </button>
            </div>
            <p className="card-desc">
              This JWT is minted by Firebase Auth and sent via <code>Authorization: Bearer &lt;token&gt;</code> to your Express backend & Python RAG microservice.
            </p>
            <div className="token-preview-box">
              <code>{token ? `${token.substring(0, 80)}...` : 'Generating token...'}</code>
            </div>
          </div>
        </div>

        {/* Architecture Status */}
        <div className="architecture-status glass-panel">
          <h3 className="card-title">MERN Stack & Python RAG Foundation</h3>
          <div className="services-row">
            <div className="service-chip active">
              <span className="chip-icon">🔥</span>
              <div>
                <strong>Firebase Auth</strong>
                <p>Live & Authenticated</p>
              </div>
            </div>
            <div className="service-chip active">
              <span className="chip-icon">⚡</span>
              <div>
                <strong>React (Vite)</strong>
                <p>Frontend Layer</p>
              </div>
            </div>
            <div className="service-chip active">
              <span className="chip-icon">🟢</span>
              <div>
                <strong>Express Node API</strong>
                <p>Backend Layer</p>
              </div>
            </div>
            <div className="service-chip active">
              <span className="chip-icon">🐍</span>
              <div>
                <strong>Python RAG Service</strong>
                <p>FastAPI / ML Engine</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
