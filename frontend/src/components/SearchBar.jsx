/**
 * CodeGalaxy — SearchBar Component
 * Command-palette style search (Ctrl+K) that fuzzy-matches file paths.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { getRiskLevel } from '../utils/colors';

export default function SearchBar({ nodes, isOpen, onClose, onSelect }) {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    // Filter nodes by query
    const results = useMemo(() => {
        if (!query.trim()) return nodes.slice(0, 20);
        const lower = query.toLowerCase();
        return nodes
            .filter((n) => n.path.toLowerCase().includes(lower) || n.filename.toLowerCase().includes(lower))
            .slice(0, 20);
    }, [nodes, query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[activeIndex]) {
                onSelect(results[activeIndex]);
                onClose();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, results, activeIndex, onClose, onSelect]);

    // Reset active index when query changes
    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const langColors = {
        python: '#3572A5', javascript: '#f1e05a', typescript: '#3178c6',
        java: '#b07219', go: '#00ADD8', rust: '#dea584', ruby: '#701516',
        cpp: '#f34b7d', c: '#555555', csharp: '#178600', php: '#4F5D95',
    };

    return (
        <div className={`search-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="search-container" onClick={(e) => e.stopPropagation()}>
                <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        className="search-input"
                        type="text"
                        placeholder="Search files..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <span className="search-kbd">ESC</span>
                </div>
                <div className="search-results">
                    {results.length > 0 ? (
                        results.map((node, i) => (
                            <div
                                key={node.id}
                                className={`search-result ${i === activeIndex ? 'active' : ''}`}
                                onClick={() => {
                                    onSelect(node);
                                    onClose();
                                }}
                                onMouseEnter={() => setActiveIndex(i)}
                            >
                                <div
                                    className="search-result-icon"
                                    style={{ background: langColors[node.language] || '#8892a8' }}
                                />
                                <div className="search-result-text">
                                    <div className="search-result-name">{node.filename}</div>
                                    <div className="search-result-path">{node.path}</div>
                                </div>
                                <span className={`risk-badge ${getRiskLevel(node.risk_score)}`}>
                                    {(node.risk_score * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="search-empty">
                            No files matching "{query}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
