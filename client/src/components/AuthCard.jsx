import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import FirebaseConfigModal from './FirebaseConfigModal';

export default function AuthCard() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    isConfigured
  } = useAuth();

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setInfoMessage('');

    if (!isConfigured) {
      setIsConfigModalOpen(true);
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      console.error('Auth submission error:', err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setInfoMessage('');

    if (!isConfigured) {
      setIsConfigModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setFormError('Please enter your email address to receive a password reset link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setInfoMessage(`Password reset link sent to ${email}. Check your inbox!`);
    } catch (err) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  function handleFirebaseError(err) {
    const code = err.code || '';
    if (code === 'auth/invalid-email') {
      setFormError('Invalid email address format.');
    } else if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      setFormError('Incorrect email or password.');
    } else if (code === 'auth/wrong-password') {
      setFormError('Incorrect password.');
    } else if (code === 'auth/email-already-in-use') {
      setFormError('An account with this email already exists.');
    } else if (code === 'auth/weak-password') {
      setFormError('Password is too weak. Please use at least 6 characters.');
    } else if (code === 'auth/popup-closed-by-user') {
      setFormError('Google sign-in window was closed before completion.');
    } else if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
      setFormError('Google Sign-In or Email Auth is not enabled in your Firebase Console. Go to Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Enable Google & Email/Password.');
    } else {
      setFormError(err.message || 'Authentication failed. Please try again.');
    }
  }

  return (
    <div className="auth-card glass-panel">
      {/* Configuration Status Banner */}
      {!isConfigured && (
        <div className="setup-banner">
          <div className="setup-banner-content">
            <span className="setup-icon">⚙️</span>
            <div>
              <strong>Firebase Project Not Yet Connected</strong>
              <p>Click below to paste your Firebase credentials from your console.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-setup"
            onClick={() => setIsConfigModalOpen(true)}
          >
            Connect Project
          </button>
        </div>
      )}

      {/* Brand & Heading */}
      <div className="auth-header">
        <div className="brand-badge-circle">
          <svg className="sparkle-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
          </svg>
        </div>
        <h2 className="auth-title">
          {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Sign in to access your personal Gemini workspace and private vault'
            : 'Join to start reflective AI journaling with user-isolated persistence'}
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
          onClick={() => { setMode('signin'); setFormError(''); setInfoMessage(''); }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => { setMode('signup'); setFormError(''); setInfoMessage(''); }}
        >
          Create Account
        </button>
      </div>

      {/* Error & Info Alerts */}
      {formError && (
        <div className="alert alert-danger" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      {infoMessage && (
        <div className="alert alert-success" role="alert">
          <span className="alert-icon">✅</span>
          <span>{infoMessage}</span>
        </div>
      )}

      {/* One-Click Federated Google Sign-In */}
      <div className="social-auth-section">
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          loading={loading}
          text={mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
        />
      </div>

      <div className="divider">
        <span className="divider-line"></span>
        <span className="divider-text">OR CONTINUE WITH EMAIL</span>
        <span className="divider-line"></span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleAuthSubmit} className="auth-form" noValidate>
        {mode === 'signup' && (
          <div className="form-group">
            <label className="input-label" htmlFor="auth-name">Full Name</label>
            <input
              id="auth-name"
              type="text"
              className="text-input"
              placeholder="e.g. Vaibhav Raj"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required={mode === 'signup'}
            />
          </div>
        )}

        <div className="form-group">
          <label className="input-label" htmlFor="auth-email">Email Address</label>
          <input
            id="auth-email"
            type="email"
            className="text-input"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label className="input-label" htmlFor="auth-password">Password</label>
            {mode === 'signin' && (
              <button
                type="button"
                className="forgot-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="auth-password"
            type="password"
            className="text-input"
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label className="input-label" htmlFor="auth-confirm-password">Confirm Password</label>
            <input
              id="auth-confirm-password"
              type="password"
              className="text-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          className="btn-submit btn-primary"
          disabled={loading}
        >
          {loading ? (
            <span className="btn-spinner"></span>
          ) : (
            <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
          )}
        </button>
      </form>

      {/* Footer Switcher */}
      <div className="auth-footer">
        {mode === 'signin' ? (
          <p>
            Don't have an account yet?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setMode('signup'); setFormError(''); setInfoMessage(''); }}
            >
              Sign up free
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setMode('signin'); setFormError(''); setInfoMessage(''); }}
            >
              Sign in
            </button>
          </p>
        )}
      </div>

      {/* Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
