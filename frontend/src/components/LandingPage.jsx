import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointer2, Info, ArrowRight, Loader2, Github } from 'lucide-react';
import { ingestRepo, getIngestStatus } from '../api/client';

// --- Helper Functions ---

const randomRange = (min, max) => Math.random() * (max - min) + min;

// --- Configuration Constants ---

const PARTICLE_DENSITY = 0.00015;
const BG_PARTICLE_DENSITY = 0.00005;
const MOUSE_RADIUS = 180;
const RETURN_SPEED = 0.08;
const DAMPING = 0.90;
const REPULSION_STRENGTH = 1.2;

// --- Components ---

const AntiGravityCanvas = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [debugInfo, setDebugInfo] = useState({ count: 0, fps: 0 });

    const particlesRef = useRef([]);
    const backgroundParticlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000, isActive: false });
    const frameIdRef = useRef(0);
    const lastTimeRef = useRef(0);

    const initParticles = useCallback((width, height) => {
        const particleCount = Math.floor(width * height * PARTICLE_DENSITY);
        const newParticles = [];

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;

            newParticles.push({
                x: x,
                y: y,
                originX: x,
                originY: y,
                vx: 0,
                vy: 0,
                size: randomRange(1, 2.5),
                color: Math.random() > 0.9 ? '#4285F4' : '#ffffff',
                angle: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = newParticles;

        const bgCount = Math.floor(width * height * BG_PARTICLE_DENSITY);
        const newBgParticles = [];

        for (let i = 0; i < bgCount; i++) {
            newBgParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: randomRange(0.5, 1.5),
                alpha: randomRange(0.1, 0.4),
                phase: Math.random() * Math.PI * 2
            });
        }
        backgroundParticlesRef.current = newBgParticles;

        setDebugInfo(prev => ({ ...prev, count: particleCount + bgCount }));
    }, []);

    const animate = useCallback((time) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;
        if (delta > 0) {
            setDebugInfo(prev => ({ ...prev, fps: Math.round(1000 / delta) }));
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pulseSpeed = 0.0008;
        const pulseOpacity = Math.sin(time * pulseSpeed) * 0.035 + 0.085;

        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(canvas.width, canvas.height) * 0.7
        );
        gradient.addColorStop(0, `rgba(66, 133, 244, ${pulseOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const bgParticles = backgroundParticlesRef.current;
        ctx.fillStyle = "#ffffff";

        for (let i = 0; i < bgParticles.length; i++) {
            const p = bgParticles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
            const currentAlpha = p.alpha * (0.3 + 0.7 * twinkle);

            ctx.globalAlpha = currentAlpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        const particles = particlesRef.current;
        const mouse = mouseRef.current;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (mouse.isActive && distance < MOUSE_RADIUS) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;

                const repulsion = force * REPULSION_STRENGTH;
                p.vx -= forceDirectionX * repulsion * 5;
                p.vy -= forceDirectionY * repulsion * 5;
            }

            const springDx = p.originX - p.x;
            const springDy = p.originY - p.y;

            p.vx += springDx * RETURN_SPEED;
            p.vy += springDy * RETURN_SPEED;
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx * dx + dy * dy;
                const minDist = p1.size + p2.size;

                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq);

                    if (dist > 0.01) {
                        const nx = dx / dist;
                        const ny = dy / dist;

                        const overlap = minDist - dist;
                        const pushX = nx * overlap * 0.5;
                        const pushY = ny * overlap * 0.5;

                        p1.x -= pushX;
                        p1.y -= pushY;
                        p2.x += pushX;
                        p2.y += pushY;

                        const dvx = p1.vx - p2.vx;
                        const dvy = p1.vy - p2.vy;

                        const velocityAlongNormal = dvx * nx + dvy * ny;

                        if (velocityAlongNormal > 0) {
                            const m1 = p1.size;
                            const m2 = p2.size;
                            const restitution = 0.85;

                            const impulseMagnitude = (-(1 + restitution) * velocityAlongNormal) / (1 / m1 + 1 / m2);

                            const impulseX = impulseMagnitude * nx;
                            const impulseY = impulseMagnitude * ny;

                            p1.vx += impulseX / m1;
                            p1.vy += impulseY / m1;
                            p2.vx -= impulseX / m2;
                            p2.vy -= impulseY / m2;
                        }
                    }
                }
            }
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.vx *= DAMPING;
            p.vy *= DAMPING;

            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            const velocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const opacity = Math.min(0.3 + velocity * 0.1, 1);

            ctx.fillStyle = p.color === '#ffffff'
                ? `rgba(255, 255, 255, ${opacity})`
                : p.color;

            ctx.fill();
        }

        frameIdRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const dpr = window.devicePixelRatio || 1;

                canvasRef.current.width = width * dpr;
                canvasRef.current.height = height * dpr;

                canvasRef.current.style.width = `${width}px`;
                canvasRef.current.style.height = `${height}px`;

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);

                initParticles(width, height);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [initParticles]);

    useEffect(() => {
        frameIdRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameIdRef.current);
    }, [animate]);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            isActive: true,
        };
    };

    const handleMouseLeave = () => {
        mouseRef.current.isActive = false;
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0 overflow-hidden bg-black cursor-crosshair delay-0 duration-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};

const Navigation = () => {
    return (
        <nav className="absolute top-0 left-0 w-full z-20 flex justify-between items-center p-6 md:p-8 pointer-events-none">
            <div className="flex items-center space-x-2 pointer-events-auto">
                <div className="logo-icon w-8 h-8 rounded-full flex items-center justify-center">✦</div>
                <span className="text-white font-medium tracking-wide text-lg">CodeGalaxy</span>
            </div>
        </nav>
    )
}

const IngestFormInline = ({ onSubmit, onCancel, loading, progress, error }) => {
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(owner, repo);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-6 flex flex-col items-center animate-fade-in-up">
            <div className="space-y-4 w-full">
                {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg backdrop-blur-md">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <input
                        type="text"
                        required
                        disabled={loading}
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 text-white placeholder-white/30 backdrop-blur-md transition-all font-mono"
                        placeholder="Owner (e.g., facebook)"
                    />
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        required
                        disabled={loading}
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 text-white placeholder-white/30 backdrop-blur-md transition-all font-mono"
                        placeholder="Repository (e.g., react)"
                    />
                </div>
            </div>

            {progress && (
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-white/50 font-mono tracking-wider uppercase">
                        <span>{progress.status}</span>
                        {progress.processed != null && <span>{progress.processed} / {progress.total}</span>}
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress.progress || Math.random() * 20}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-4 w-full pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 py-4 text-white/50 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={loading || !owner.trim() || !repo.trim()}
                    className="flex-[2] relative overflow-hidden group py-4 bg-white text-black rounded-xl uppercase tracking-widest text-xs font-bold transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loading ? 'Processing...' : 'Generate Universe'}
                    </span>
                    <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
            </div>
        </form>
    );
};

const HeroContent = ({ onStartFlow, showForm, handleIngest, loading, error, progress, onCancel }) => {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pointer-events-none">
            <div className="max-w-4xl w-full text-center space-y-8">
                <div className="inline-block animate-fade-in-up">
                    <span className="py-1 px-3 border border-white/20 rounded-full text-xs font-mono text-white/60 tracking-widest uppercase bg-white/5 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        Technical Visualization
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tighter mix-blend-difference pointer-events-none">
                    Code<br />Galaxy
                </h1>

                <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 font-light leading-relaxed pointer-events-none">
                    Navigate your codebase like a universe. Map technical debt, visualize dependencies, and understand architecture in interactive 3D.
                </p>

                <div className="pt-8 h-48 flex items-start justify-center pointer-events-auto">
                    {!showForm ? (
                        <button
                            onClick={onStartFlow}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold tracking-wide overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            <span className="relative z-10">Create Repo Galaxy</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out opacity-10"></div>
                        </button>
                    ) : (
                        <IngestFormInline
                            onSubmit={handleIngest}
                            loading={loading}
                            progress={progress}
                            error={error}
                            onCancel={onCancel}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default function LandingPage({ onSuccess }) {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(null);

    const handleStartFlow = () => {
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setError('');
        setProgress(null);
    };

    const handleIngest = async (owner, repo) => {
        setLoading(true);
        setError('');
        setProgress({ status: 'starting', progress: 0 });

        try {
            const result = await ingestRepo(owner.trim(), repo.trim(), 'main');
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
                        onSuccess(repoId);
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

    return (
        <div className="relative w-full min-h-screen bg-black overflow-y-auto selection:bg-blue-500 selection:text-white font-sans">
            <AntiGravityCanvas />
            <Navigation />
            <HeroContent
                showForm={showForm}
                onStartFlow={handleStartFlow}
                handleIngest={handleIngest}
                loading={loading}
                error={error}
                progress={progress}
                onCancel={handleCancel}
            />

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 pointer-events-none">
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono">Interact</span>
                <MousePointer2 className="animate-pulse" size={16} />
            </div>
        </div>
    );
}
