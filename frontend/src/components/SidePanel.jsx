/**
 * CodeGalaxy — SidePanel Component
 * Slide-in panel showing file details: code, metrics, and dependencies.
 */
import { useState, useEffect } from 'react';
import { getRiskLevel, getRiskLabel } from '../utils/colors';
import { getFileDetail, getFileSummary } from '../api/client';
import { Bot, Loader2 } from 'lucide-react';

export default function SidePanel({ node, isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('code');
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    // AI Summary State
    const [aiSummary, setAiSummary] = useState(null);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);

    useEffect(() => {
        if (!node) return;
        setLoading(true);
        setAiSummary(null); // Reset summary when node changes

        getFileDetail(node.id)
            .then((data) => setDetail(data))
            .catch(() => setDetail(node))
            .finally(() => setLoading(false));

        setActiveTab('analysis'); // Default to Analysis tab now, it's more interesting
    }, [node]);

    const handleGenerateSummary = async () => {
        if (!node) return;
        setIsGeneratingAi(true);
        try {
            const result = await getFileSummary(node.id);
            setAiSummary(result.summary);
        } catch (e) {
            setAiSummary("Failed to generate summary. Ensure OPENROUTER_API_KEY or OPENAI_API_KEY is configured in the backend.");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    if (!node) return null;

    const riskLevel = getRiskLevel(node.risk_score);
    const riskLabel = getRiskLabel(node.risk_score);

    const displayData = detail || node;

    // Derived qualitative metrics
    const getCognitiveLoad = (complexity) => {
        if (complexity > 10) return { label: 'High', class: 'high' };
        if (complexity > 5) return { label: 'Moderate', class: 'medium' };
        return { label: 'Low', class: 'low' };
    };

    const getBlastRadiusLevel = (fanIn) => {
        if (fanIn > 15) return 'high';
        if (fanIn > 5) return 'medium';
        return 'low';
    };

    const cognitiveLoad = getCognitiveLoad(node.complexity);

    return (
        <div className={`side-panel ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="side-panel-header">
                <div>
                    <h2 title={node.path}>{node.filename}</h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: 500 }}>{node.language}</span>
                        <span>•</span>
                        <span>{node.loc} lines</span>
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'code' ? 'active' : ''}`}
                    onClick={() => setActiveTab('code')}
                >
                    Code
                </button>
                <button
                    className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    Analysis
                </button>
                <button
                    className={`tab ${activeTab === 'deps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deps')}
                >
                    Dependencies
                </button>
            </div>

            {/* Body */}
            <div className="side-panel-body">
                {activeTab === 'code' && (
                    <div className="animate-in">
                        <div className="section-title">Source Code</div>
                        <div className="code-block">
                            {loading ? 'Loading...' : (displayData?.content || `// Source code for ${node.filename}\n// (Available when connected to backend)\n\n// Language: ${node.language}\n// Lines of Code: ${node.loc}\n// Functions: ${node.function_count}`)}
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="animate-in flex flex-col gap-6">

                        {/* --- AI FILE PURPOSE --- */}
                        <div>
                            <div className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-3 flex items-center gap-2">
                                <Bot size={14} className="text-blue-400" /> FILE PURPOSE (AI)
                            </div>

                            {!aiSummary && !isGeneratingAi ? (
                                <button
                                    onClick={handleGenerateSummary}
                                    className="w-full py-3 px-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    ✦ Generate Architectural Summary
                                </button>
                            ) : isGeneratingAi ? (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 text-white/60">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                                    <span className="text-sm">Analyzing abstract syntax tree and dependencies...</span>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 text-white/90 text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                    {aiSummary}
                                </div>
                            )}
                        </div>

                        {/* --- ARCHITECTURE METRICS --- */}
                        <div>
                            <div className="section-title">Architecture Metrics</div>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {/* Blast Radius */}
                                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                                    <span className="text-xs text-white/40 font-medium mb-1">Blast Radius (Fan-In)</span>
                                    <span className={`text-2xl font-bold ${getBlastRadiusLevel(displayData.fan_in) === 'high' ? 'text-red-400' :
                                            getBlastRadiusLevel(displayData.fan_in) === 'medium' ? 'text-orange-400' : 'text-emerald-400'
                                        }`}>
                                        {displayData.fan_in !== undefined ? displayData.fan_in : '?'}
                                        <span className="text-[10px] uppercase ml-2 opacity-50 font-normal">dependents</span>
                                    </span>
                                </div>

                                {/* Coupling */}
                                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                                    <span className="text-xs text-white/40 font-medium mb-1">Coupling (Fan-Out)</span>
                                    <span className="text-2xl font-bold text-white/80">
                                        {displayData.fan_out !== undefined ? displayData.fan_out : '?'}
                                        <span className="text-[10px] uppercase ml-2 opacity-50 font-normal">dependencies</span>
                                    </span>
                                </div>

                                {/* Cognitive Load */}
                                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                                    <span className="text-xs text-white/40 font-medium mb-1">Cognitive Load</span>
                                    <span className={`text-lg font-bold ${cognitiveLoad.class === 'high' ? 'text-red-400' :
                                            cognitiveLoad.class === 'medium' ? 'text-orange-400' : 'text-emerald-400'
                                        }`}>
                                        {cognitiveLoad.label}
                                    </span>
                                </div>

                                {/* Tech Debt */}
                                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                                    <span className="text-xs text-white/40 font-medium mb-1">Tech Debt Markers</span>
                                    <span className={`text-lg font-bold ${node.todo_count > 3 ? 'text-orange-400' : node.todo_count > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                        {node.todo_count} <span className="text-xs font-normal opacity-50">TODOs/FIXMEs</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {displayData?.functions && displayData.functions.length > 0 && (
                            <>
                                <div className="section-title">Functions</div>
                                <div className="tag-list">
                                    {displayData.functions.map((fn, i) => (
                                        <span key={i} className="tag">{fn}</span>
                                    ))}
                                </div>
                            </>
                        )}

                        {displayData?.classes && displayData.classes.length > 0 && (
                            <>
                                <div className="section-title">Classes</div>
                                <div className="tag-list">
                                    {displayData.classes.map((cls, i) => (
                                        <span key={i} className="tag">{cls}</span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'deps' && (
                    <div className="animate-in">
                        <div className="section-title">Imports</div>
                        {displayData?.imports && displayData.imports.length > 0 ? (
                            <ul className="dep-list">
                                {displayData.imports.map((dep, i) => (
                                    <li key={i} className="dep-item">{dep}</li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                No import data available
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
