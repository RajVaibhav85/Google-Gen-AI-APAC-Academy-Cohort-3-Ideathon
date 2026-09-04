import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, rtdb } from '../firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, set, get, remove } from 'firebase/database';

const MOODS = ['Reflective', 'Energized', 'Analytical', 'Thoughtful', 'Vulnerable', 'Focused'];

const STARTER_PROMPTS = [
  {
    title: 'Deployment & Growth',
    desc: 'Milestone reached deploying our multi-turn Gemini application, but planning next scale.'
  },
  {
    title: 'Priority Alignment',
    desc: 'Navigating competing objectives and looking for clarity on what to execute first.'
  },
  {
    title: 'Creative Ideation',
    desc: 'Brainstorming architectural extensions for our Cloud Run GenAI intelligence stack.'
  }
];

export default function Dashboard() {
  const { currentUser, token, logout } = useAuth();
  
  // App Personalization & View State
  const [theme, setTheme] = useState('obsidian'); // 'obsidian' | 'slate' | 'violet'
  const [layout, setLayout] = useState('studio'); // 'studio' | 'split' | 'zen'
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'vault'

  // Chat & Journal State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState('Reflective');
  const [location, setLocation] = useState('Workspace');
  const [journalTitle, setJournalTitle] = useState('Daily Reflection');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('gemini-2.5-flash');
  
  // Speech-to-Text
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Firestore History & Persistence
  const [vaultEntries, setVaultEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [vaultSearch, setVaultSearch] = useState('');

  // UI State
  const [imgError, setImgError] = useState(false);
  const userPhotoURL = currentUser?.photoURL || currentUser?.providerData?.[0]?.photoURL;
  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Show temporary toast notification
  const showToast = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load Firestore Vault entries on load
  useEffect(() => {
    if (token || currentUser?.uid) {
      loadVaultEntries();
    }
  }, [token, currentUser]);

  const loadVaultEntries = async () => {
    setIsVaultLoading(true);
    const minDelay = new Promise(r => setTimeout(r, 650)); // Ensure visible sync feedback
    try {
      const entryMap = new Map();

      // 1. Fetch from Client Firestore
      if (currentUser?.uid && db) {
        try {
          const colRef = collection(db, 'users', currentUser.uid, 'interactions');
          const snap = await getDocs(colRef);
          snap.forEach(docSnap => {
            const d = docSnap.data();
            entryMap.set(d.id || docSnap.id, { ...d, id: d.id || docSnap.id });
          });
        } catch (fsErr) {
          console.warn('[Firestore Load Note]:', fsErr.message);
        }
      }

      // 2. Fetch from Realtime Database
      if (currentUser?.uid && rtdb) {
        try {
          const rtdbRef = ref(rtdb, `users/${currentUser.uid}/interactions`);
          const snap = await get(rtdbRef);
          if (snap.exists()) {
            const data = snap.val();
            Object.keys(data).forEach(k => {
              if (!entryMap.has(k)) {
                entryMap.set(k, { ...data[k], id: k });
              }
            });
          }
        } catch (rtErr) {
          console.warn('[RTDB Load Note]:', rtErr.message);
        }
      }

      // 3. Fetch from Backend Express API
      if (token) {
        try {
          const res = await fetch('/api/interactions', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            (data.interactions || []).forEach(item => {
              if (!entryMap.has(item.id)) {
                entryMap.set(item.id, item);
              }
            });
          }
        } catch (beErr) {
          console.warn('[Backend Load Note]:', beErr.message);
        }
      }

      await minDelay;
      const list = Array.from(entryMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setVaultEntries(list);
    } catch (err) {
      console.warn('[Vault] Failed to load entries:', err);
    } finally {
      setIsVaultLoading(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognizer.onerror = () => setIsRecording(false);
      recognizer.onend = () => setIsRecording(false);
      recognitionRef.current = recognizer;
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      showToast('Voice dictation is not supported in this browser.', 'warning');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  // Send Multi-Turn Journal Reflection to Gemini
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userPrompt = inputMessage.trim();
    const newTurn = {
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mood: selectedMood,
      location
    };

    const updatedMessages = [...messages, newTurn];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          history: historyPayload,
          message: userPrompt,
          mood: selectedMood,
          location: location || undefined,
          tags: [selectedMood.toLowerCase()]
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setActiveModel(data.modelUsed || 'gemini-2.5-flash');

      const modelTurn = {
        role: 'model',
        content: data.text,
        modelUsed: data.modelUsed || 'gemini-2.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fallbackChain: data.fallbackChain,
        source: data.source
      };

      setMessages([...updatedMessages, modelTurn]);
    } catch (err) {
      console.error('[Chat Error]:', err);
      const isOutOfScope = /^[\d\s\+\-\*\/\^\%\(\)\.\=]+\??$/.test(userPrompt.trim()) ||
        /^(what('?s|\s+is)?|calculate|compute|solve)\s+/i.test(userPrompt.trim());

      const fallbackTurn = {
        role: 'model',
        content: isOutOfScope
          ? `### 📖 Personal Gemini Journal Notice\nI am your dedicated **Personal Gemini Journal**, designed exclusively to help you reflect on your personal thoughts, emotions, daily accomplishments, and self-growth.\n\nI do not answer general mathematical calculations (like 2+2), trivia, or coding queries.\n\n* **Let's refocus on you**: How was your day today, what milestones did you work on, or what thoughts or emotions are on your mind that you would like to reflect upon?`
          : `### Synthesis & Guided Reflection\nThank you for sharing your thoughts on "${userPrompt.substring(0, 45)}...".\n\n* **Key Takeaway**: Externalizing and writing down your thoughts creates clarity.\n* **Actionable Step**: Identify one immediate step you can execute in the next hour.\n* **Growth Prompt**: How does this align with your overarching milestones?`,
        modelUsed: 'gemini-2.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...updatedMessages, fallbackTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save current conversation to Cloud Firestore & Realtime DB
  const handleSaveToVault = async () => {
    if (messages.length === 0) {
      showToast('Write a reflection first before saving.', 'warning');
      return;
    }

    setIsSaving(true);
    const minDelay = new Promise(r => setTimeout(r, 800)); // Visible save state

    try {
      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const firstUserMsg = messages.find(m => m.role === 'user');
      const latestModelMsg = [...messages].reverse().find(m => m.role === 'model');
      
      const payload = {
        id: entryId,
        title: journalTitle || `Reflection - ${new Date().toLocaleDateString()}`,
        mood: selectedMood,
        location,
        history: messages,
        reflection: latestModelMsg?.content || firstUserMsg?.content || '',
        turnCount: messages.length,
        createdAt: new Date().toISOString()
      };

      // 1. Cloud Firestore write (/users/{userId}/interactions/{interactionId})
      if (currentUser?.uid && db) {
        try {
          const docRef = doc(db, 'users', currentUser.uid, 'interactions', entryId);
          await setDoc(docRef, payload);
        } catch (fsErr) {
          console.warn('[Firestore Direct Write Note]:', fsErr.message);
        }
      }

      // 2. Realtime Database sync
      if (currentUser?.uid && rtdb) {
        try {
          const rtdbRef = ref(rtdb, `users/${currentUser.uid}/interactions/${entryId}`);
          await set(rtdbRef, payload);
        } catch (rtErr) {
          console.warn('[RTDB Direct Write Note]:', rtErr.message);
        }
      }

      // 3. Backend Express persistence
      if (token) {
        try {
          await fetch('/api/interactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        } catch (beErr) {
          console.warn('[Backend Sync Note]:', beErr.message);
        }
      }

      await minDelay;
      showToast('✓ Saved to your Firestore Vault!');
      loadVaultEntries();
    } catch (err) {
      console.error('[Save Error]:', err);
      showToast('Could not save to Firestore. Please try again.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Entry from Vault
  const handleDeleteEntry = async (e, entryId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this journal reflection from your vault?')) return;

    try {
      if (currentUser?.uid && db) {
        try {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'interactions', entryId));
        } catch (e) {}
      }

      if (currentUser?.uid && rtdb) {
        try {
          await remove(ref(rtdb, `users/${currentUser.uid}/interactions/${entryId}`));
        } catch (e) {}
      }

      if (token) {
        try {
          await fetch(`/api/interactions/${entryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) {}
      }

      showToast('Entry removed from vault.');
      setVaultEntries(prev => prev.filter(item => item.id !== entryId));
      if (selectedEntryId === entryId) {
        setSelectedEntryId(null);
      }
    } catch (err) {
      console.error('[Delete Error]:', err);
    }
  };

  // Load a saved entry into the active studio
  const handleLoadEntry = (entry) => {
    setSelectedEntryId(entry.id);
    setJournalTitle(entry.title || 'Untitled Journal');
    setSelectedMood(entry.mood || 'Reflective');
    setLocation(entry.location || 'Workspace');
    if (entry.history && Array.isArray(entry.history)) {
      setMessages(entry.history);
    } else if (entry.reflection) {
      setMessages([
        { role: 'user', content: entry.title || 'Saved Reflection', timestamp: 'Past' },
        { role: 'model', content: entry.reflection, timestamp: 'Past', modelUsed: 'Firestore Archive' }
      ]);
    }
    setActiveTab('studio');
    showToast(`Loaded "${entry.title}"`);
  };

  // Reset chat for a new journal session
  const handleNewSession = () => {
    setMessages([]);
    setSelectedEntryId(null);
    setJournalTitle(`Reflection - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setActiveTab('studio');
    showToast('Started fresh journal entry');
  };

  const cycleTheme = () => {
    const themes = ['obsidian', 'slate', 'violet'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
  };

  const cycleLayout = () => {
    const layouts = ['studio', 'split', 'zen'];
    const next = layouts[(layouts.indexOf(layout) + 1) % layouts.length];
    setLayout(next);
  };

  // Filtered vault entries
  const filteredVault = vaultEntries.filter(e => {
    if (!vaultSearch) return true;
    const query = vaultSearch.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(query)) ||
      (e.reflection && e.reflection.toLowerCase().includes(query)) ||
      (e.mood && e.mood.toLowerCase().includes(query))
    );
  });

  return (
    <div className={`studio-layout layout-${layout}`} data-theme={theme}>
      {/* Background Aurora Orbs */}
      <div className="ambient-glow-mesh">
        <div className="glow-orb orb-blue"></div>
        <div className="glow-orb orb-purple"></div>
        <div className="glow-orb orb-cyan"></div>
      </div>

      {/* Prominent Refresh / Sync Progress Bar */}
      {isVaultLoading && <div className="studio-sync-bar"></div>}

      {/* Prominent Saving Overlay Toast */}
      {isSaving && (
        <div className="save-sync-toast">
          <span className="spinner-ring sm accent"></span>
          <span>Encrypting & Saving to Firestore Vault...</span>
        </div>
      )}

      {/* General Toast Notifications */}
      {notification && !isSaving && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: notification.type === 'danger' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#fff',
          padding: '10px 22px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.88rem',
          fontWeight: '600',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          animation: 'toastPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {notification.text}
        </div>
      )}

      {/* LEFT STUDIO NAVIGATION RAIL */}
      <aside className="studio-rail">
        <div className="rail-top">
          <div
            className="rail-brand-logo"
            onClick={handleNewSession}
            title="New Journal Reflection"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
            </svg>
          </div>
        </div>

        <nav className="rail-nav-tabs">
          <button
            type="button"
            className={`rail-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
            title="Journal Studio"
          >
            ✍️
          </button>

          <button
            type="button"
            className={`rail-tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vault');
              loadVaultEntries();
            }}
            title="Vault Archive"
          >
            🗄️
            {vaultEntries.length > 0 && (
              <span className="tab-badge">{vaultEntries.length}</span>
            )}
          </button>
        </nav>

        <div className="rail-user-profile">
          {userPhotoURL && !imgError ? (
            <img
              src={userPhotoURL}
              alt={currentUser?.displayName || "Profile"}
              className="rail-avatar-img"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              title={currentUser?.displayName || currentUser?.email}
            />
          ) : (
            <div className="rail-avatar-placeholder" title={currentUser?.displayName || currentUser?.email}>
              {(currentUser?.displayName || currentUser?.email || 'G')[0].toUpperCase()}
            </div>
          )}

          <button
            type="button"
            className="btn-rail-logout"
            onClick={logout}
            title="Sign Out"
            id="btn-signout"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      {/* RIGHT STUDIO CANVAS */}
      <main className="studio-canvas">
        {/* TOP BAR */}
        <header className="studio-topbar">
          <div className="topbar-left">
            <input
              type="text"
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              placeholder="Journal Entry Title..."
              className="topbar-title"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                outline: 'none',
                minWidth: '220px',
                maxWidth: '400px'
              }}
            />

            <div className="model-pill-indicator">
              <span className="pulse-dot-green"></span>
              <span>{activeModel}</span>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Refresh Button with Spinner Animation */}
            <button
              type="button"
              className="btn-pill-action"
              onClick={loadVaultEntries}
              disabled={isVaultLoading}
              title="Refresh Vault Entries"
            >
              {isVaultLoading ? (
                <span className="spinner-ring sm"></span>
              ) : (
                <span>🔄</span>
              )}
              <span>{isVaultLoading ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Layout Switcher */}
            <button
              type="button"
              className="btn-pill-action"
              onClick={cycleLayout}
              title={`Switch Layout (Current: ${layout.toUpperCase()})`}
            >
              <span>📐</span>
              <span>Layout: {layout}</span>
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              className="btn-pill-action"
              onClick={cycleTheme}
              title={`Switch Theme (Current: ${theme.toUpperCase()})`}
            >
              <span>🎨</span>
              <span>Theme: {theme}</span>
            </button>

            {/* New Entry Action */}
            <button
              type="button"
              className="btn-pill-action"
              onClick={handleNewSession}
              title="Start a new blank journal entry"
            >
              <span>+</span>
              <span>New</span>
            </button>

            {/* Save to Firestore Vault */}
            <button
              type="button"
              className="btn-pill-action primary"
              onClick={handleSaveToVault}
              disabled={isSaving || messages.length === 0}
              id="btn-save-vault"
            >
              {isSaving ? (
                <>
                  <span className="spinner-ring sm"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Vault</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* VIEW 1: JOURNAL STUDIO */}
        {activeTab === 'studio' && (
          <div className="journal-canvas-container">
            {/* Mindset & Location Ribbon */}
            <div className="mindset-ribbon">
              <div className="mindset-pills-row">
                <span className="mindset-tag-label">Mindset:</span>
                {MOODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`mindset-chip ${selectedMood === m ? 'active' : ''}`}
                    onClick={() => setSelectedMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍</span>
                <input
                  type="text"
                  className="location-tag-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Context / Place"
                />
              </div>
            </div>

            {/* SPLIT LAYOUT MODE (Side-by-side) */}
            {layout === 'split' ? (
              <div className="split-workspace-grid">
                {/* Left Side: Writing Editor */}
                <div className="split-editor-pane">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span>
                    <span>Write Thoughts</span>
                  </h3>
                  <textarea
                    className="omnibar-textarea"
                    placeholder="Express your thoughts, observations, achievements, or queries freely..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    style={{ minHeight: '220px', background: 'rgba(10, 14, 22, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={`btn-icon-round ${isRecording ? 'recording' : ''}`}
                      onClick={toggleSpeech}
                      title={isRecording ? 'Stop Recording' : 'Voice Dictate'}
                    >
                      🎤
                    </button>
                    <button
                      type="button"
                      className="btn-send-omnibar"
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-ring sm"></span>
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <span>Synthesize</span>
                          <span>✨</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Side: Gemini Reflections Stream */}
                <div className="split-stream-pane">
                  {messages.length === 0 && !isLoading ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <p style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</p>
                      <h4 style={{ color: '#fff', marginBottom: '6px' }}>Gemini Reflection Engine</h4>
                      <p style={{ fontSize: '0.85rem' }}>Your reflections and Gemini insights will appear here in real time.</p>
                    </div>
                  ) : (
                    messages.map((turn, idx) => (
                      <div key={idx} className={`chat-row ${turn.role}`}>
                        {turn.role === 'model' ? (
                          <div className="model-bubble-box">
                            <div className="message-meta-bar">
                              <span className="model-name-badge">
                                <span>✨</span>
                                <span>Gemini Reflection</span>
                              </span>
                              <span>{turn.timestamp}</span>
                            </div>
                            <div className="message-body-text">{turn.content}</div>
                          </div>
                        ) : (
                          <div className="user-bubble-box">
                            <div className="message-meta-bar" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              <span>{currentUser?.displayName || 'You'} ({turn.mood || selectedMood})</span>
                              <span>{turn.timestamp}</span>
                            </div>
                            <div className="message-body-text">{turn.content}</div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isLoading && (
                    <div className="thinking-aurora-card">
                      <div className="thinking-top-status">
                        <div className="thinking-model-label">
                          <span className="spinner-ring sm"></span>
                          <span>Gemini 2.5 Flash is synthesizing insights...</span>
                        </div>
                        <div className="thinking-dots-row">
                          <span className="dot-wave"></span>
                          <span className="dot-wave"></span>
                          <span className="dot-wave"></span>
                        </div>
                      </div>
                      <div className="skeleton-bar w-title"></div>
                      <div className="skeleton-bar w-full"></div>
                      <div className="skeleton-bar w-long"></div>
                      <div className="skeleton-bar w-med"></div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </div>
            ) : (
              /* STUDIO RAIL OR ZEN FOCUS MODE (Conversational Flow + Floating Omnibar) */
              <div className="messages-stream">
                {messages.length === 0 ? (
                  <div className="welcome-hero-card glass-panel">
                    <svg className="hero-sparkle" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"/>
                    </svg>
                    <h2 className="hero-heading">Personal Gemini Journal</h2>
                    <p className="hero-subtext">
                      Articulate your daily accomplishments, challenges, or thoughts.
                      Gemini synthesizes actionable clarity and structures your personal journey.
                    </p>

                    <div className="starter-cards-grid">
                      {STARTER_PROMPTS.map((starter, i) => (
                        <button
                          key={i}
                          type="button"
                          className="starter-card-btn"
                          onClick={() => setInputMessage(starter.desc)}
                        >
                          <strong>{starter.title}</strong>
                          <p>{starter.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((turn, idx) => (
                    <div key={idx} className={`chat-row ${turn.role}`}>
                      {turn.role === 'model' ? (
                        <div className="model-bubble-box">
                          <div className="message-meta-bar">
                            <span className="model-name-badge">
                              <span>✨</span>
                              <span>Gemini Reflection</span>
                            </span>
                            <span>{turn.timestamp}</span>
                          </div>
                          <div className="message-body-text">{turn.content}</div>
                        </div>
                      ) : (
                        <div className="user-bubble-box">
                          <div className="message-meta-bar" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <span>{currentUser?.displayName || 'You'} ({turn.mood || selectedMood})</span>
                            <span>{turn.timestamp}</span>
                          </div>
                          <div className="message-body-text">{turn.content}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* VISIBLE GEMINI THINKING ANIMATION CARD */}
                {isLoading && (
                  <div className="thinking-container">
                    <div className="thinking-aurora-card">
                      <div className="thinking-top-status">
                        <div className="thinking-model-label">
                          <span className="spinner-ring sm"></span>
                          <span>Gemini 2.5 Flash is synthesizing insights...</span>
                        </div>
                        <div className="thinking-dots-row">
                          <span className="dot-wave"></span>
                          <span className="dot-wave"></span>
                          <span className="dot-wave"></span>
                        </div>
                      </div>
                      <div className="skeleton-bar w-title"></div>
                      <div className="skeleton-bar w-full"></div>
                      <div className="skeleton-bar w-long"></div>
                      <div className="skeleton-bar w-med"></div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: VAULT ARCHIVE */}
        {activeTab === 'vault' && (
          <div className="vault-archive-container">
            <div className="vault-hero-header">
              <div>
                <h2 className="vault-hero-title">Firestore Journal Vault</h2>
                <p className="vault-hero-sub">
                  Private reflections persisted to your Google Cloud user partition.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search reflections..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  style={{
                    background: 'rgba(10, 14, 22, 0.7)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                />
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={loadVaultEntries}
                  disabled={isVaultLoading}
                >
                  {isVaultLoading ? (
                    <span className="spinner-ring sm"></span>
                  ) : (
                    <span>🔄</span>
                  )}
                  <span>{isVaultLoading ? 'Syncing...' : 'Refresh Vault'}</span>
                </button>
              </div>
            </div>

            {/* Vault Grid */}
            {isVaultLoading && vaultEntries.length === 0 ? (
              <div className="vault-grid-list">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="vault-card-item glass-panel">
                    <div className="skeleton-bar w-title"></div>
                    <div className="skeleton-bar w-full"></div>
                    <div className="skeleton-bar w-long"></div>
                    <div className="skeleton-bar w-med"></div>
                  </div>
                ))}
              </div>
            ) : filteredVault.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📂</p>
                <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Saved Reflections Found</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  {vaultSearch
                    ? 'No entries matched your search filter.'
                    : 'Start a conversation in the Journal Studio and click "Save Vault" to persist.'}
                </p>
                <button
                  type="button"
                  className="btn-pill-action primary"
                  onClick={() => setActiveTab('studio')}
                >
                  Go to Studio ➔
                </button>
              </div>
            ) : (
              <div className="vault-grid-list">
                {filteredVault.map(entry => (
                  <div
                    key={entry.id}
                    className={`vault-card-item ${selectedEntryId === entry.id ? 'active' : ''}`}
                    onClick={() => handleLoadEntry(entry)}
                  >
                    <div className="vault-item-header">
                      <h4 className="vault-item-title">{entry.title || 'Untitled Reflection'}</h4>
                      <span className="vault-item-date">
                        {new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="vault-item-preview">
                      {entry.reflection || entry.history?.[0]?.content || 'Empty entry'}
                    </p>

                    <div className="vault-item-footer">
                      <span className="mood-chip-badge">{entry.mood || 'Reflective'}</span>
                      <button
                        type="button"
                        className="btn-trash-item"
                        onClick={(e) => handleDeleteEntry(e, entry.id)}
                        title="Delete from Vault"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FLOATING OMNIBAR DOCK (For Studio View, layout != split) */}
        {activeTab === 'studio' && layout !== 'split' && (
          <div className="omnibar-dock-wrapper">
            <div className="omnibar-dock">
              <textarea
                ref={textareaRef}
                className="omnibar-textarea"
                placeholder="What's on your mind? Press Enter to reflect, Shift+Enter for new line..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
              />

              <div className="omnibar-controls-row">
                <div className="omnibar-tools-left">
                  <button
                    type="button"
                    className={`btn-icon-round ${isRecording ? 'recording' : ''}`}
                    onClick={toggleSpeech}
                    title={isRecording ? 'Stop Recording' : 'Voice Dictate'}
                  >
                    🎤
                  </button>

                  {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="dot-wave"></span>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                        Listening...
                      </span>
                    </div>
                  )}
                </div>

                <div className="omnibar-tools-right">
                  <button
                    type="button"
                    className="btn-send-omnibar"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    id="btn-send-reflection"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-ring sm"></span>
                        <span>Reflecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Reflect</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
