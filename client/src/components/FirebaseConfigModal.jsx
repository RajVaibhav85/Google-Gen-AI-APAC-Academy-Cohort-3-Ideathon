import React, { useState } from 'react';
import { firebaseConfig, saveFirebaseConfig } from '../firebase/config';

export default function FirebaseConfigModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(firebaseConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [projectId, setProjectId] = useState(firebaseConfig.projectId || '');
  const [appId, setAppId] = useState(firebaseConfig.appId || '');
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setStatus('Please enter at least an API Key and Project ID.');
      return;
    }

    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(newConfig);
  };

  const handlePasteConfig = (e) => {
    const text = e.target.value;
    try {
      // Check if user pasted a firebaseConfig object snippet
      const apiKeyMatch = text.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = text.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = text.match(/projectId:\s*["']([^"']+)["']/);
      const appIdMatch = text.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch) setApiKey(apiKeyMatch[1]);
      if (authDomainMatch) setAuthDomain(authDomainMatch[1]);
      if (projectIdMatch) setProjectId(projectIdMatch[1]);
      if (appIdMatch) setAppId(appIdMatch[1]);

      if (apiKeyMatch || projectIdMatch) {
        setStatus('Extracted configuration keys successfully!');
      }
    } catch (err) {
      // Not a snippet
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge-tag">Firebase Setup</span>
            <h3 className="modal-title">Connect Your Firebase Project</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <p className="modal-desc">
          Paste your Firebase project credentials from the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">Firebase Console</a> &rarr; Project Settings &rarr; Your Apps &rarr; Web SDK.
        </p>

        {status && <div className="status-banner">{status}</div>}

        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-group">
            <label className="input-label">Paste Raw SDK Snippet (Auto-Parses)</label>
            <textarea
              className="text-input"
              rows={2}
              placeholder="const firebaseConfig = { apiKey: '...', projectId: '...' };"
              onChange={handlePasteConfig}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="input-label">Project ID *</label>
              <input
                type="text"
                className="text-input"
                placeholder="my-genai-cohort3-app"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label className="input-label">API Key *</label>
              <input
                type="text"
                className="text-input"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="input-label">Auth Domain</label>
              <input
                type="text"
                className="text-input"
                placeholder="my-app.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label className="input-label">App ID</label>
              <input
                type="text"
                className="text-input"
                placeholder="1:123456789:web:abcdef"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save & Initialize Firebase</button>
          </div>
        </form>
      </div>
    </div>
  );
}
