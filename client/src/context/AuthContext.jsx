import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextObject';
import {
  auth,
  googleProvider,
  isConfigured
} from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

export { useAuth } from './useAuth';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          setCurrentUser(user);
        } catch (e) {
          console.error('Error fetching Firebase ID token:', e);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setToken(null);
      }
      // Ensure smooth, visible loading presentation on refresh
      setTimeout(() => {
        setLoading(false);
      }, 650);
    });

    return () => unsubscribe();
  }, []);

  async function signUpWithEmail(email, password, displayName) {
    setError(null);
    if (!auth) throw new Error('Firebase is not configured yet.');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    setCurrentUser(userCredential.user);
    return userCredential.user;
  }

  async function signInWithEmail(email, password) {
    setError(null);
    if (!auth) throw new Error('Firebase is not configured yet.');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    setCurrentUser(userCredential.user);
    return userCredential.user;
  }

  async function signInWithGoogle() {
    setError(null);
    if (!auth) throw new Error('Firebase is not configured yet.');
    const userCredential = await signInWithPopup(auth, googleProvider);
    const idToken = await userCredential.user.getIdToken();
    setToken(idToken);
    setCurrentUser(userCredential.user);
    return userCredential.user;
  }

  async function logout() {
    setError(null);
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setToken(null);
  }

  async function resetPassword(email) {
    setError(null);
    if (!auth) throw new Error('Firebase is not configured yet.');
    await sendPasswordResetEmail(auth, email);
  }

  const value = {
    currentUser,
    token,
    loading,
    error,
    setError,
    isConfigured,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
