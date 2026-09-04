import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FirebaseConfigModal from './FirebaseConfigModal';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthCard() {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const { signInWithGoogle, isConfigured } = useAuth();

  const handleGoogleSignIn = async () => {
    setFormError('');
    setInfoMessage('');

    if (!isConfigured) {
      setIsConfigModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      setInfoMessage('Opening Google secure login...');
      await signInWithGoogle();
      setInfoMessage('Authentication successful! Loading your dashboard...');
    } catch (err) {
      console.error('Google auth error:', err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  function handleFirebaseError(err) {
    const code = err.code || '';
    if (code === 'auth/popup-closed-by-user') {
      setFormError('Sign-in cancelled. Please click the button again to complete login.');
    } else if (code === 'auth/popup-blocked') {
      setFormError('Login popup was blocked by your browser. Please allow popups for this site and try again.');
    } else if (code === 'auth/cancelled-popup-request') {
      setFormError('Only one popup request is allowed at a time.');
    } else if (code === 'auth/unauthorized-domain') {
      setFormError('This domain is not authorized for OAuth operations in your Firebase project. Please add your domain to Firebase Console > Authentication > Settings > Authorized domains.');
    } else if (code === 'auth/operation-not-allowed') {
      setFormError('Google Sign-In is not enabled yet in your Firebase project. Please enable Google under Authentication > Sign-in method in the Firebase Console.');
    } else {
      setFormError(err.message || 'Authentication failed. Please try again.');
    }
  }

  return (
    <div className="auth-card glass-panel" style={{ maxWidth: '460px', padding: '2.5rem 2.2rem' }}>
      {/* Brand & Heading */}
      <div className="auth-header" style={{ marginBottom: '2rem' }}>
        <div className="brand-badge-circle" style={{ width: '64px', height: '64px', marginBottom: '1.2rem' }}>
          <svg className="sparkle-icon" viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
          </svg>
        </div>
        <h2 className="auth-title" style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>
          Personal Gemini Journal
        </h2>
        <p className="auth-subtitle" style={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
          Sign in with your Google account to access your private, user-isolated conversational journal and reflection vault.
        </p>
      </div>

      {/* Error & Info Alerts */}
      {formError && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span className="alert-icon">⚠️</span>
          <span style={{ fontSize: '0.85rem' }}>{formError}</span>
        </div>
      )}

      {infoMessage && (
        <div className="alert alert-success" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span className="alert-icon">✨</span>
          <span style={{ fontSize: '0.85rem' }}>{infoMessage}</span>
        </div>
      )}

      {/* Google Single Sign-On Button */}
      <div className="social-auth-section" style={{ margin: '1.5rem 0 1rem 0' }}>
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          loading={loading}
          disabled={loading}
          text="Continue with Google"
        />
      </div>

      {/* Clean Footer Tagline */}
      <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
        <span style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600
        }}>
          Google Cloud Gen AI Academy • Cohort 3
        </span>
      </div>

      {/* Firebase Setup Modal (Fallback helper) */}
      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
