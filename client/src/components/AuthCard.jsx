import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FirebaseConfigModal from './FirebaseConfigModal';

export default function AuthCard() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const {
    signInWithEmail,
    signUpWithEmail,
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

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
        setInfoMessage('Account created successfully! Logging you in...');
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err) {
      console.error('Email auth error:', err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setFormError('Please enter your email address to receive a password reset link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setInfoMessage(`Password reset link sent to ${email.trim()}. Please check your inbox!`);
    } catch (err) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  function handleFirebaseError(err) {
    const code = err.code || '';
    if (code === 'auth/invalid-email') {
      setFormError('Please provide a valid email address.');
    } else if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      setFormError('Invalid email or password. Please verify your credentials.');
    } else if (code === 'auth/wrong-password') {
      setFormError('Incorrect password. Try again or click "Forgot password?".');
    } else if (code === 'auth/email-already-in-use') {
      setFormError('An account with this email address already exists. Please sign in instead.');
    } else if (code === 'auth/weak-password') {
      setFormError('Password is too weak. Please use at least 6 characters.');
    } else if (code === 'auth/too-many-requests') {
      setFormError('Access temporarily disabled due to many failed login attempts. Please reset your password or try again later.');
    } else if (code === 'auth/operation-not-allowed') {
      setFormError('Email/Password sign-in is not enabled in your Firebase Console. Go to Authentication &rarr; Sign-in method &rarr; Enable Email/Password.');
    } else {
      setFormError(err.message || 'Authentication error. Please try again.');
    }
  }

  return (
    <div className="auth-card glass-panel">
      {/* Brand & Heading */}
      <div className="auth-header">
        <div className="brand-badge-circle">
          <svg className="sparkle-icon" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
          </svg>
        </div>
        <h2 className="auth-title">
          {mode === 'signin' ? 'Sign In to Workspace' : 'Create an Account'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Access your private AI journaling and reflection vault'
            : 'Get started with secure, user-isolated AI journaling'}
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
          <div className="password-input-wrapper">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              className="text-input"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈 Hide" : "👁️ Show"}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label className="input-label" htmlFor="auth-confirm-password">Confirm Password</label>
            <input
              id="auth-confirm-password"
              type={showPassword ? "text" : "password"}
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
            <span>{mode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
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
