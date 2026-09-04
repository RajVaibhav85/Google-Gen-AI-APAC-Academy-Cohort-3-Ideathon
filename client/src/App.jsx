import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthCard from './components/AuthCard';
import Dashboard from './pages/Dashboard';

function MainApp() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="splash-loading-screen">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="splash-content glass-panel">
          <div className="splash-logo-pulse">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
            </svg>
          </div>
          <h2 className="splash-title">Personal Gemini Journal</h2>
          <p className="splash-subtitle">Connecting to secure Google AI & Firebase session...</p>
          <div className="splash-progress-track">
            <div className="splash-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Dashboard />;
  }

  return (
    <div className="auth-page-layout">
      {/* Background Ambient Glows */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <div className="auth-container">
        <AuthCard />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
