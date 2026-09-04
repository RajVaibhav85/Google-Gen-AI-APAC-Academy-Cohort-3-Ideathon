import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthCard from './components/AuthCard';
import Dashboard from './pages/Dashboard';

function MainApp() {
  const { currentUser } = useAuth();

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
