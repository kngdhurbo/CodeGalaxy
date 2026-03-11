/**
 * CodeGalaxy — Main App Component
 * Assembles the 3D universe canvas with all UI overlays.
 */
import { useState, useCallback, useEffect } from 'react';
import Universe from './components/Universe';
import Header from './components/Header';
import NodeTooltip from './components/NodeTooltip';
import SidePanel from './components/SidePanel';
import SearchBar from './components/SearchBar';
import IngestModal from './components/IngestModal';
import LandingPage from './components/LandingPage';
import { useGraphData } from './hooks/useGraphData';

export default function App() {
  // State
  const [appState, setAppState] = useState('landing'); // 'landing' | 'canvas'
  const [repoId, setRepoId] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);

  const { nodes, edges, folders, loading, useMock, repoName, loadGraph, loadMock } = useGraphData(repoId);

  // Hover handler
  const handleHover = useCallback((node, event) => {
    setHoveredNode(node);
    if (node && event) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    } else {
      setTooltipPos(null);
    }
  }, []);

  // Click handler
  const handleClick = useCallback((node) => {
    setSelectedNode(node);
    setSidePanelOpen(true);
  }, []);

  // Search handler
  const handleSearchSelect = useCallback((node) => {
    setSelectedNode(node);
    setSidePanelOpen(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSidePanelOpen(false);
        setSearchOpen(false);
        setIngestOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ingestion success
  const handleIngestSuccess = useCallback((newRepoId) => {
    setRepoId(newRepoId);
    loadGraph(newRepoId);
    setAppState('canvas');
  }, [loadGraph]);

  const handleLoadMock = useCallback((count) => {
    loadMock(count);
    setAppState('canvas');
  }, [loadMock]);

  if (appState === 'landing') {
    return <LandingPage onSuccess={handleIngestSuccess} />;
  }

  return (
    <div className="app">
      {/* 3D Canvas */}
      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-text">Generating universe...</div>
        </div>
      ) : (
        <Universe
          folders={folders}
          nodes={nodes}
          edges={edges}
          onHover={handleHover}
          onClick={handleClick}
          hoveredId={hoveredNode?.id}
        />
      )}

      {/* Header */}
      <Header
        repoName={repoName}
        nodeCount={nodes.length}
        useMock={useMock}
        onIngest={() => setIngestOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onLoadMock={() => handleLoadMock(250)}
      />

      {/* Node Tooltip */}
      <NodeTooltip node={hoveredNode} position={tooltipPos} />

      {/* Side Panel */}
      <SidePanel
        node={selectedNode}
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
      />

      {/* Search */}
      <SearchBar
        nodes={nodes}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />

      {/* Ingest Modal */}
      <IngestModal
        isOpen={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onSuccess={handleIngestSuccess}
      />

      {/* Status Bar */}
      <div className="status-bar">
        <span>{nodes.length} files • {edges.length} edges</span>
        <span>
          {useMock ? '✦ Demo Data' : repoName || 'No repository loaded'}
          {' | '}
          <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setSearchOpen(true)}>
            Ctrl+K to search
          </span>
        </span>
      </div>
    </div>
  );
}
