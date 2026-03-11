/**
 * CodeGalaxy — IngestModal Component
 * Modal dialog for inputting GitHub repo details to trigger ingestion.
 */
import { useState } from 'react';
import { ingestRepo, getIngestStatus } from '../api/client';

export default function IngestModal({ isOpen, onClose, onSuccess }) {
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');
    const [branch, setBranch] = useState('main');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(null);

    const handleSubmit = async () => {
        if (!owner.trim() || !repo.trim()) {
            setError('Owner and repo name are required');
            return;
        }

        setLoading(true);
        setError('');
        setProgress({ status: 'starting', progress: 0 });

        try {
            const result = await ingestRepo(owner.trim(), repo.trim(), branch.trim());
            const repoId = result.repo_id;

            // Poll for status
            const pollInterval = setInterval(async () => {
                try {
                    const status = await getIngestStatus(repoId);
                    setProgress({
                        status: status.status,
                        progress: status.progress,
                        processed: status.processed_files,
                        total: status.total_files,
                    });

                    if (status.status === 'done') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        if (onSuccess) onSuccess(repoId);
                        onClose();
                    } else if (status.status === 'error') {
                        clearInterval(pollInterval);
                        setLoading(false);
                        setError('Ingestion failed. Check backend logs.');
                    }
                } catch {
                    // Keep polling
                }
            }, 2000);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.detail || 'Failed to start ingestion. Is the backend running?');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={!loading ? onClose : undefined}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⬆ Ingest Repository</h2>
                </div>

                <div className="modal-body">
                    {error && (
                        <div style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 82, 82, 0.1)',
                            border: '1px solid rgba(255, 82, 82, 0.2)',
                            color: 'var(--risk-high)',
                            fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Owner / Organization</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. facebook"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Repository Name</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. react"
                            value={repo}
                            onChange={(e) => setRepo(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Branch</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="main"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {progress && (
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'capitalize' }}>
                                {['done', 'error', 'pending'].includes(progress.status)
                                    ? progress.status === 'done' ? '✓ Complete!' : progress.status === 'pending' ? 'Starting pipeline...' : progress.status
                                    : progress.status === 'processing'
                                        ? `Downloading & Parsing... ${progress.processed || 0} / ${progress.total || '?'} files`
                                        : `${progress.status}...`}
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${progress.progress || 0}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Processing...' : 'Start Ingestion'}
                    </button>
                </div>
            </div>
        </div>
    );
}
