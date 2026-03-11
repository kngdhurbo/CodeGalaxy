/**
 * CodeGalaxy — Header Component
 * Top navigation bar with logo, repo info, and action buttons.
 */
import { useState } from 'react';

export default function Header({ repoName, nodeCount, useMock, onIngest, onSearch, onLoadMock }) {
    return (
        <header className="header">
            <div className="header-logo">
                <div className="logo-icon">✦</div>
                <span>CodeGalaxy</span>
                {repoName && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>
                        / {repoName}
                    </span>
                )}
            </div>

            <div className="header-actions">
                {useMock && (
                    <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(178, 102, 255, 0.15)',
                        color: 'var(--accent-purple)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                    }}>
                        Demo Mode
                    </span>
                )}

                <button className="btn" onClick={onSearch} title="Search files (Ctrl+K)">
                    🔍 Search
                </button>

                <button className="btn" onClick={onLoadMock}>
                    ✦ Load Demo
                </button>

                <button className="btn btn-primary" onClick={onIngest}>
                    ⬆ Ingest Repo
                </button>
            </div>
        </header>
    );
}
