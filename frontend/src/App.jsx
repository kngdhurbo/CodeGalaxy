import React, { useState, useCallback } from 'react';
import VanillaGalaxy from './components/VanillaGalaxy';
import LandingPage from './components/LandingPage';

export default function App() {
  const [appState, setAppState] = useState('landing');
  const [repoUrl, setRepoUrl] = useState('');

  const handleIngestSuccess = useCallback((repoId, url) => {
    // We use the URL as the primary identifier for the vanilla Three.js engine
    setRepoUrl(url);
    setAppState('canvas');
  }, []);

  if (appState === 'landing') {
    return (
      <LandingPage 
        onSuccess={(repoId, url) => handleIngestSuccess(repoId, url)} 
      />
    );
  }

  // The 'canvas' state launches the Vanilla Three.js CodeGalaxy
  return (
    <div className="app">
      <VanillaGalaxy initialRepoUrl={repoUrl} />
    </div>
  );
}
