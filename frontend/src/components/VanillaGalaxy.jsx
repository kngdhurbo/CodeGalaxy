import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { SessionNavBar } from './ui/sidebar';
import { MenuVertical } from './ui/menu-vertical';
import { ScrollArea } from './ui/scroll-area';
import { X, Fingerprint, Activity, Network, Code, Zap, ArrowRight, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/VanillaGalaxy.css';

const GITHUB = 'https://api.github.com';
const RAW_URL = 'https://raw.githubusercontent.com';

// ── FILE TYPE MAP ───────────────────────────────────────
const FT = {
    js: { c: '#F0DB4F', t: 'gas', i: '⚡', l: 'JavaScript' },
    jsx: { c: '#61DAFB', t: 'ice', i: '⚛', l: 'React JSX' },
    ts: { c: '#3178C6', t: 'ocean', i: '📘', l: 'TypeScript' },
    tsx: { c: '#61DAFB', t: 'ocean', i: '⚛', l: 'React TSX' },
    py: { c: '#4EA4D4', t: 'terran', i: '🐍', l: 'Python' },
    css: { c: '#7B42BC', t: 'crystal', i: '🎨', l: 'CSS' },
    scss: { c: '#C6538C', t: 'crystal', i: '🎨', l: 'SCSS' },
    html: { c: '#E44D26', t: 'lava', i: '🌐', l: 'HTML' },
    json: { c: '#CB7C3A', t: 'rocky', i: '{}', l: 'JSON' },
    yaml: { c: '#CB3837', t: 'rocky', i: '⚙', l: 'YAML' },
    yml: { c: '#CB3837', t: 'rocky', i: '⚙', l: 'YAML' },
    md: { c: '#00BCD4', t: 'terran', i: '📄', l: 'Markdown' },
    txt: { c: '#78909C', t: 'rocky', i: '📝', l: 'Text' },
    svg: { c: '#FF7043', t: 'gas', i: '🖼', l: 'SVG' },
    png: { c: '#AB47BC', t: 'aurora', i: '🖼', l: 'PNG' },
    jpg: { c: '#AB47BC', t: 'aurora', i: '🖼', l: 'JPEG' },
    gif: { c: '#FF4081', t: 'aurora', i: '🖼', l: 'GIF' },
    rs: { c: '#F74C00', t: 'lava', i: '⚙', l: 'Rust' },
    go: { c: '#00ADD8', t: 'ice', i: '🐹', l: 'Go' },
    java: { c: '#B07219', t: 'rocky', i: '☕', l: 'Java' },
    rb: { c: '#CC342D', t: 'lava', i: '💎', l: 'Ruby' },
    php: { c: '#777BB4', t: 'gas', i: '🐘', l: 'PHP' },
    sh: { c: '#89E051', t: 'terran', i: '💻', l: 'Shell' },
    c: { c: '#555555', t: 'rocky', i: '⚙', l: 'C' },
    cpp: { c: '#F34B7D', t: 'rocky', i: '⚙', l: 'C++' },
    toml: { c: '#9C4121', t: 'rocky', i: '⚙', l: 'TOML' },
    xml: { c: '#F37B23', t: 'rocky', i: '📋', l: 'XML' },
    vue: { c: '#42B883', t: 'terran', i: '💚', l: 'Vue' },
    dart: { c: '#00B4AB', t: 'ice', i: '🎯', l: 'Dart' },
    lock: { c: '#607D8B', t: 'rocky', i: '🔒', l: 'Lockfile' },
    env: { c: '#ECD53F', t: 'rocky', i: '🔐', l: 'Env Config' },
    _: { c: '#78909C', t: 'rocky', i: '📁', l: 'File' },
};

function cfg(name) { const e = name.split('.').pop().toLowerCase(); return FT[e] || FT['_'] }
// ── RECURSIVE FILE TREE COMPONENTS ────────────────────
const TreeNode = ({ node, name, depth, onSelect, activePath }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = node.type === 'folder';

    if (!isFolder) {
        const f = node;
        const ext = f.name.split('.').pop().toLowerCase();
        let tint = 'var(--dim)';
        if (['js','jsx','ts','tsx'].includes(ext)) tint = 'var(--accent)';
        else if (ext === 'css') tint = '#ef233c'; 
        else if (['json','yml','yaml'].includes(ext)) tint = 'var(--gold)';
        else if (ext === 'html') tint = '#ff7b00';
        else if (ext === 'md') tint = 'var(--dim)';

        const isActive = activePath === f.path;

        return (
            <div 
                className={cn("vg-tf", isActive && "active")} 
                onClick={() => onSelect(f.path)}
            >
                <span style={{color: tint, marginRight: '8px', fontSize: '10px', opacity: 0.8}}>⬡</span>
                <span>{f.name}</span>
            </div>
        );
    }

    return (
        <div className={cn("vg-folder", isOpen && "open")}>
            <div className="vg-folder-lbl" onClick={() => setIsOpen(!isOpen)}>
                <span className="vg-chev"></span>
                <span className="vg-fdot">⬡</span>
                <span>{name}</span>
            </div>
            {isOpen && (
                <div className="vg-folder-kids">
                    {Object.entries(node.children)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([childName, childNode]) => (
                            <TreeNode 
                                key={childName} 
                                node={childNode} 
                                name={childName} 
                                depth={depth + 1} 
                                onSelect={onSelect}
                                activePath={activePath}
                            />
                        ))}
                    {node.files
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(f => (
                            <TreeNode 
                                key={f.path} 
                                node={{...f, type: 'file'}} 
                                name={f.name} 
                                depth={depth + 1} 
                                onSelect={onSelect}
                                activePath={activePath}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};

const FileTree = ({ tree, searchTerm, onSelect, activePath }) => {
    const root = useMemo(() => {
        const r = { type: 'folder', children: {}, files: [] };
        const term = searchTerm.toLowerCase();

        tree.forEach(item => {
            if (item.type !== 'blob') return;
            const matches = item.path.toLowerCase().includes(term);
            if (!matches && term) return;

            const parts = item.path.split('/');
            const name = parts[parts.length - 1];
            let node = r;
            parts.slice(0, -1).forEach(part => { 
                if (!node.children[part]) node.children[part] = { type: 'folder', children: {}, files: [] }; 
                node = node.children[part]; 
            });
            node.files.push({ name, path: item.path, size: item.size });
        });
        return r;
    }, [tree, searchTerm]);

    return (
        <div className="file-tree-root">
            {Object.entries(root.children).map(([name, node]) => (
                <TreeNode key={name} node={node} name={name} depth={0} onSelect={onSelect} activePath={activePath} />
            ))}
            {root.files.map(f => (
                <TreeNode key={f.path} node={{...f, type: 'file'}} name={f.name} depth={0} onSelect={onSelect} activePath={activePath} />
            ))}
        </div>
    );
};


const VanillaGalaxy = ({ initialRepoUrl }) => {
    const [sidebarLocked, setSidebarLocked] = useState(false);
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const timerRef = useRef(new THREE.Timer());
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouse2dRef = useRef(new THREE.Vector2());
    const texturesRef = useRef({});

    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [selectedPlanet, setSelectedPlanet] = useState(null);
    const [activeTab, setActiveTab] = useState("intelligence");
    const [sourceCode, setSourceCode] = useState("");
    const [isLoadingSource, setIsLoadingSource] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [intelligenceError, setIntelligenceError] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const stateRef = useRef({
        owner: '', repo: '', branch: 'main',
        tree: [],
        meshToFile: new Map(),
        allPlanets: [],
        summaryCache: new Map(),
        selected: null,
        systems: [],
        pulses: [], 
        camTheta: 0.4, camPhi: 1.0, camDist: 140, camDistGoal: 140,
        camTarget: new THREE.Vector3(),
        camTargetGoal: new THREE.Vector3(),
        isDrag: false, isPan: false,
        lm: { x: 0, y: 0 },
        time: 0,
        rippleGroup: null,
        selectedMesh: null,
    });

    const h2r = (hex) => ({
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    });

    const h2n = (hex) => parseInt(hex.replace('#', ''), 16);

    const makeGlowTex = (color, scale, opacity = 1) => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, color + 'ff'); 
        g.addColorStop(0.2, color + '88');
        g.addColorStop(1, 'transparent'); 
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({ 
            map: tex, 
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false, 
            opacity: opacity 
        });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(scale, scale, 1);
        return sp;
    };

    const loadCelestialAssets = async () => {
        const loader = new THREE.TextureLoader();
        const load = (url) => new Promise((res, rej) => {
            loader.load(url, tex => { tex.flipY = false; res(tex); }, undefined, err => rej(err));
        });
        
        if (!texturesRef.current) texturesRef.current = {};
        const t = texturesRef.current;
        const setStatus = (t) => { const el = document.getElementById('vg-statusBar'); if(el) el.textContent = t; };
        
        setStatus('✨ Loading Celestial Textures...');
        try {
            t.terran = await load('/textures/terran.png');
            t.lava = await load('/textures/lava.png');
            t.gas = await load('/textures/gas.png');
            t.ice = await load('/textures/ice.png');
            t.rocky = await load('/textures/rocky.png');
            t.star = await load('/textures/star.png');
        } catch (e) {
            console.warn('⚠️ AI Textures unavailable, using procedural generation.', e);
        }
    };

    // ── HIGH-FIDELITY PROCEDURAL TEXTURE ENGINE ──────────────────
    const genPlanetTex = (type, colorHex) => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const ctx = c.getContext('2d');
        const { r, g, b } = h2r(colorHex);
        const rnd = (m = 1) => Math.random() * m;

        if (type === 'terran') {
            // Deep Ocean Base
            const grad = ctx.createLinearGradient(0, 0, 0, 512);
            grad.addColorStop(0, '#04152d'); grad.addColorStop(1, '#0b2a5c');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 512);
            // Landmasses (Bezier)
            ctx.fillStyle = `rgb(${Math.max(0,r-40)}, ${Math.min(255,g+30)}, ${Math.max(0,b-40)})`;
            for (let i = 0; i < 12; i++) {
                ctx.beginPath();
                let x = rnd(1024), y = rnd(512);
                ctx.moveTo(x, y);
                for (let j = 0; j < 5; j++) {
                    ctx.bezierCurveTo(x + rnd(200)-100, y + rnd(200)-100, x + rnd(200)-100, y + rnd(200)-100, x + rnd(150)-75, y + rnd(150)-75);
                }
                ctx.fill();
            }
            // Clouds
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 20;
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                ctx.moveTo(0, rnd(512));
                ctx.bezierCurveTo(300, rnd(512), 700, rnd(512), 1024, rnd(512));
                ctx.stroke();
            }
        } 
        else if (type === 'lava') {
            ctx.fillStyle = '#0f0f0f'; ctx.fillRect(0, 0, 1024, 512);
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff4400';
            for (let i = 0; i < 50; i++) {
                ctx.strokeStyle = i % 2 === 0 ? '#ff6600' : '#ffcc00';
                ctx.lineWidth = 1 + rnd(2);
                ctx.beginPath();
                let x = rnd(1024), y = rnd(512);
                ctx.moveTo(x, y);
                for (let j = 0; j < 8; j++) {
                    x += rnd(60) - 30; y += rnd(60) - 30;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                if (rnd() > 0.8) {
                    ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
                }
            }
            ctx.shadowBlur = 0;
        } 
        else if (type === 'gas') {
            for (let y = 0; y < 512; y += 4) {
                const shift = Math.sin(y * 0.05) * 20;
                ctx.fillStyle = `rgb(${r * (0.6 + rnd(0.4))}, ${g * (0.6 + rnd(0.4))}, ${b * (0.6 + rnd(0.4))})`;
                ctx.fillRect(0, y, 1024, 4);
            }
            // Storms
            for (let i = 0; i < 6; i++) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                const sx = rnd(1024), sy = rnd(512), sw = 40 + rnd(80), sh = 20 + rnd(40);
                ctx.beginPath(); ctx.ellipse(sx, sy, sw, sh, rnd(), 0, Math.PI*2); ctx.fill();
            }
        } 
        else if (type === 'ocean') {
            const g = ctx.createRadialGradient(512, 256, 10, 512, 256, 500);
            g.addColorStop(0, '#00e5ff'); g.addColorStop(1, '#0077be');
            ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
            // Archipelagos
            ctx.fillStyle = '#ccff00';
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                const x = rnd(1024), y = rnd(512), rad = 2 + rnd(10);
                ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
            }
        }
        else if (type === 'crystal') {
            ctx.fillStyle = '#1a0033'; ctx.fillRect(0, 0, 1024, 512);
            ctx.strokeStyle = '#bc13fe'; ctx.lineWidth = 1;
            for (let i = 0; i < 100; i++) {
                ctx.beginPath();
                const x = rnd(1024), y = rnd(512);
                ctx.moveTo(x, y);
                ctx.lineTo(x + rnd(100) - 50, y + rnd(100) - 50);
                ctx.lineTo(x + rnd(100) - 50, y + rnd(100) - 50);
                ctx.closePath(); ctx.stroke();
            }
        }
        else if (type === 'aurora') {
            ctx.fillStyle = '#000814'; ctx.fillRect(0, 0, 1024, 512);
            for (let i = 0; i < 5; i++) {
                const g = ctx.createLinearGradient(0, 0, 1024, 0);
                g.addColorStop(0, 'transparent'); g.addColorStop(0.5, `rgba(${rnd(100)}, 255, ${rnd(255)}, 0.1)`); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.beginPath();
                ctx.moveTo(0, 100 + rnd(300));
                ctx.bezierCurveTo(300, rnd(512), 700, rnd(512), 1024, 100+rnd(300));
                ctx.lineTo(1024, 512); ctx.lineTo(0, 512); ctx.fill();
            }
        }
        else if (type === 'ice') {
            ctx.fillStyle = '#e0f3ff'; ctx.fillRect(0, 0, 1024, 512);
            ctx.strokeStyle = 'rgba(100,150,255,0.4)'; ctx.lineWidth = 0.5;
            for (let i = 0; i < 1500; i++) {
                ctx.beginPath();
                const x = rnd(1024), y = rnd(512);
                ctx.moveTo(x, y); ctx.lineTo(x + rnd(40)-20, y + rnd(40)-20);
                ctx.stroke();
            }
            const g = ctx.createRadialGradient(512, 256, 0, 512, 256, 600);
            g.addColorStop(0, 'transparent'); g.addColorStop(1, 'rgba(255,255,255,0.6)');
            ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
        } 
        else { // Rocky
            ctx.fillStyle = '#4a4a4a'; ctx.fillRect(0, 0, 1024, 512);
            for (let i = 0; i < 80; i++) {
                const x = rnd(1024), y = rnd(512), rad = 3 + rnd(15);
                ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 1, y + 1, rad, 0, Math.PI, true); ctx.stroke();
            }
        }
        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4; return tex;
    };

    const genStarTex = (colorHex) => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const ctx = c.getContext('2d');
        const { r, g, b } = h2r(colorHex);
        const rnd = (m = 1) => Math.random() * m;
        
        ctx.fillStyle = colorHex; ctx.fillRect(0, 0, 1024, 512);
        // Convection Cells
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(${Math.min(255, r+50)}, ${Math.min(255, g+50)}, ${Math.min(255, b+50)}, 0.3)`;
            ctx.beginPath();
            const x = rnd(1024), y = rnd(512), rad = 20 + rnd(40);
            ctx.moveTo(x, y);
            for (let j = 0; j < 6; j++) {
                ctx.bezierCurveTo(x + rnd(60)-30, y + rnd(60)-30, x + rnd(60)-30, y + rnd(60)-30, x + rnd(40)-20, y + rnd(40)-20);
            }
            ctx.fill();
        }
        // Energy Filaments
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5;
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.moveTo(rnd(1024), rnd(512));
            ctx.bezierCurveTo(rnd(1024), rnd(512), rnd(1024), rnd(512), rnd(1024), rnd(512));
            ctx.stroke();
        }
        return new THREE.CanvasTexture(c);
    };

    const buildGalaxy = (tree) => {
        const s = stateRef.current;
        clearGalaxy();
        const folders = new Map();
        folders.set('(root)', { files: [] });
        tree.forEach(item => { if (item.type === 'tree') folders.set(item.path, { files: [] }); });
        tree.forEach(item => {
            if (item.type === 'blob') {
                const parts = item.path.split('/');
                const par = parts.length === 1 ? '(root)' : parts.slice(0, -1).join('/');
                const f = folders.get(par) || folders.get('(root)');
                if (f) f.files.push(item);
            }
        });

        const golden = 2.39996323;
        let idx = 0;
        folders.forEach((folder, name) => {
            if (folder.files.length === 0) return;
            const r = idx === 0 ? 0 : 22 + Math.sqrt(idx) * 17;
            const th = idx * golden;
            const x = r * Math.cos(th), y = (Math.random() - .5) * 14, z = r * Math.sin(th);
            if (idx > 0) {
                const oMesh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 }));
                oMesh.rotation.x = Math.PI / 2; sceneRef.current.add(oMesh);
                s.systems.push({ orbitMesh: oMesh });
            }
            createSolarSystem(name, new THREE.Vector3(x, y, z), folder.files);
            idx++;
        });
    };

    const clearGalaxy = () => {
        const s = stateRef.current; if (!sceneRef.current) return;
        s.systems.forEach(sys => { if (sys.group) sceneRef.current.remove(sys.group); if (sys.orbitMesh) sceneRef.current.remove(sys.orbitMesh); });
        s.systems = []; s.allPlanets = []; s.meshToFile = new Map();
        s.pulses.forEach(p => sceneRef.current.remove(p.mesh)); s.pulses = [];
        if (s.rippleGroup && s.rippleGroup.parent) s.rippleGroup.parent.remove(s.rippleGroup);
        s.rippleGroup = null;
        document.querySelectorAll('.vg-slabel, .plabel').forEach(el => el.remove());
    };

    const STAR_COLORS = ['#FFF8E0', '#FFE8A0', '#FFD4A0', '#AFCFFF', '#FFEEDD', '#FFEEBB'];
    const hsh = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return Math.abs(h) };

    const createSolarSystem = (name, pos, files) => {
        const s = stateRef.current;
        const group = new THREE.Group(); group.position.copy(pos); sceneRef.current.add(group);
        const sc = STAR_COLORS[hsh(name) % STAR_COLORS.length];
        const sr = 1.8 + Math.random() * 1.8;
        // Star - MeshBasicMaterial for high vibrancy
        const sTex = (texturesRef.current && texturesRef.current.star) || genStarTex(sc);
        const sMesh = new THREE.Mesh(new THREE.SphereGeometry(sr, 32, 32), new THREE.MeshBasicMaterial({ color: sc, map: sTex }));
        group.add(sMesh);
        // Corrected Light Intensity (Balanced)
        const light = new THREE.PointLight(h2n(sc), 12.0, 200); group.add(light);
        group.add(makeGlowTex(sc, sr * 5.2, 0.22)); group.add(makeGlowTex(sc, sr * 24, 0.12));
        const sys = { group, name, pos, files, planets: [], orbitData: [] }; s.systems.push(sys);
        const sorted = [...files].sort((a, b) => (b.size || 0) - (a.size || 0));
        const maxPlanets = Math.min(sorted.length, 18);
        sorted.slice(0, maxPlanets).forEach((file, i) => {
            const orbitR = sr + 5 + i * (2.2 + Math.random() * .8), speed = (0.18 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1), tilt = (Math.random() - 0.5) * 0.15, startA = Math.random() * Math.PI * 2;
            const oPath = new THREE.Mesh(new THREE.TorusGeometry(orbitR, 0.015, 8, 90), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035 }));
            oPath.rotation.x = Math.PI / 2 + tilt; group.add(oPath);
            const fc = cfg(file.path.split('/').pop()), bytes = file.size || 1000, pr = Math.max(0.28, Math.min(2.4, 0.28 + Math.log(bytes + 1) * 0.185));
            // Corrected Planet Material (Unlit Override)
            const pTex = (texturesRef.current && texturesRef.current[fc.t]) || genPlanetTex(fc.t, fc.c);
            const pMesh = new THREE.Mesh(new THREE.SphereGeometry(pr, 30, 30), new THREE.MeshBasicMaterial({ 
                color: 0xffffff, // White base ensuring raw texture fidelity
                map: pTex 
            }));
            group.add(pMesh);
            
            const pLabel = document.createElement('div');
            pLabel.className = 'plabel';
            pLabel.textContent = file.path.split('/').pop();
            wrapRef.current.appendChild(pLabel);

            const fd = { path: file.path, name: file.path.split('/').pop(), size: file.size || 0, sha: file.sha, type: fc.t, color: fc.c, label: fc.l, icon: fc.i, pr, orbitR, speed, tilt, startA, systemPos: pos.clone(), folder: name, domLabel: pLabel };
            s.meshToFile.set(pMesh.uuid, fd); s.allPlanets.push(pMesh); sys.planets.push(pMesh);
            sys.orbitData.push({ mesh: pMesh, orbitR, speed, tilt, angle: startA, label: pLabel });
        });
        const lbl = document.createElement('div'); lbl.className = 'vg-slabel';
        lbl.textContent = name === '(root)' ? '/' + s.repo : '/' + name.split('/').pop();
        wrapRef.current.appendChild(lbl); sys.label = lbl;
    };

    const spawnPulse = (pos, color) => {
        const s = stateRef.current;
        const pulse = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.15, 32), new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
        pulse.position.copy(pos); pulse.lookAt(cameraRef.current.position); sceneRef.current.add(pulse);
        s.pulses.push({ mesh: pulse, age: 0, maxAge: 1.5 });
    };

    const fetchAISummary = async (code, path) => {
        if (stateRef.current.summaryCache.has(path)) return;
        
        setIsAnalyzing(true);
        setIntelligenceError("");
        
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const PROXY_URL = `${BACKEND_URL}/api/ai/summarize-code`;

        try {
            const response = await fetch(PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, path })
            });

            if (!response.ok) throw new Error("STATION_UPLINK_OFFLINE");
            const data = await response.json();
            const summary = data.summary || "Analysis incomplete.";
            
            stateRef.current.summaryCache.set(path, summary);
        } catch (err) {
            console.error("Intelligence failure:", err);
            setIntelligenceError("COMMUNICATION LINK SEVERED - ENSURE BACKEND UPLINK IS ACTIVE.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const selectPlanet = useCallback((mesh, fd) => {
        const s = stateRef.current;
        if (s.selected && s.selected.material.emissive) s.selected.material.emissiveIntensity = 0.12;
        
        // Remove old ripples
        if (s.rippleGroup && s.rippleGroup.parent) s.rippleGroup.parent.remove(s.rippleGroup);
        
        s.selected = mesh;
        s.selectedMesh = mesh; // Store for frame-by-frame tracking
        if (mesh.material.emissive) mesh.material.emissiveIntensity = 0.45;
        const worldPos = new THREE.Vector3(); mesh.getWorldPosition(worldPos);
        spawnPulse(worldPos, fd.color);
        s.camTargetGoal.copy(worldPos); // Target the actual planet world pos
        s.camDistGoal = 38;
        
        // Create Stellar Echo Ripples
        const rippleGroup = new THREE.Group();
        const rippleGeo = new THREE.TorusGeometry(1, 0.04, 6, 30);
        for (let i = 0; i < 3; i++) {
            const mat = new THREE.MeshBasicMaterial({ 
                color: 0xff0a2e, 
                transparent: true, 
                opacity: 1, 
                blending: THREE.AdditiveBlending,
                depthWrite: false 
            });
            const ring = new THREE.Mesh(rippleGeo, mat);
            ring.rotation.x = Math.PI / 2;
            ring.userData = { progress: i / 3 }; // Stagger initial progress
            rippleGroup.add(ring);
        }
        mesh.add(rippleGroup);
        s.rippleGroup = rippleGroup;

        document.querySelectorAll('.vg-tf').forEach(el => el.classList.remove('active'));
        const el = document.querySelector(`.vg-tf[data-path="${fd.path}"]`);
        if (el) { el.classList.add('active'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        
        // Highlight labels
        document.querySelectorAll('.plabel').forEach(el => el.classList.remove('selected'));
        if (fd.domLabel) fd.domLabel.classList.add('selected');

        setSelectedPlanet(fd);
        setInspectorOpen(true);
        setActiveTab('intelligence');
        
        // Fetch real source code from GitHub
        if (fd.path) {
            setIsLoadingSource(true);
            setSourceCode('// Establishing uplink to GitHub RAW...');
            const { owner, repo, branch } = stateRef.current;
            const rawUrl = `${RAW_URL}/${owner}/${repo}/${branch}/${fd.path}`;
            
            fetch(rawUrl)
                .then(res => res.text())
                .then(code => {
                    setSourceCode(code);
                    setIsLoadingSource(false);
                    // Trigger AI Analysis
                    fetchAISummary(code, fd.path);
                })
                .catch(err => {
                    console.error("Link failed:", err);
                    setSourceCode("// ERROR: SECURE_LINK_TERMINATED\n// Reason: Resource unreachable or private repository.");
                    setIsLoadingSource(false);
                });
        }
    }, []);





    const loadRepo = async (url) => {
        const s = stateRef.current;
        const setStatus = (t) => { const el = document.getElementById('vg-statusBar'); if(el) el.textContent = t; };
        try {
            await loadCelestialAssets();
            const m = url.match(/github\.com[/:]([^/]+)\/([^/?\s]+)/); if (!m) return;
            s.owner = m[1]; s.repo = m[2].replace(/\.git$/, ''); setStatus('🛸 Ingressing repository...');
            const ri = await fetch(`${GITHUB}/repos/${s.owner}/${s.repo}`).then(r => r.json()); if (ri.message) return;
            const tr = await fetch(`${GITHUB}/repos/${s.owner}/${s.repo}/git/trees/${ri.default_branch || 'main'}?recursive=1`).then(r => r.json());
            if (tr.tree) { s.tree = tr.tree; buildGalaxy(s.tree); setStatus(`✅ ${s.repo} ready.`); }
        } catch (err) { setStatus('❌ ' + err.message); }
    };



    useEffect(() => {
        const wrap = wrapRef.current, canvas = canvasRef.current, W = wrap.clientWidth, H = wrap.clientHeight;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(W, H); renderer.toneMapping = THREE.ACESFilmicToneMapping;
        const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x000005, 0.0008); sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 4000); cameraRef.current = camera;
        scene.add(new THREE.AmbientLight(0x0a0a30, 1.2));
        const mkStars = (count, rMin, rMax, size) => {
            const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) { const r = rMin + Math.random() * (rMax - rMin), th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); pos[i*3] = r * Math.sin(ph) * Math.cos(th); pos[i*3+1] = r * Math.sin(ph) * Math.sin(th); pos[i*3+2] = r * Math.cos(ph); }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size, color: 0xffffff, transparent: true, opacity: 0.6 })));
        };
        mkStars(3000, 400, 1200, 0.5);
        const animate = (timestamp) => {
            stateRef.current.frame = requestAnimationFrame(animate); 
            timerRef.current.update(timestamp);
            const dt = Math.min(0.05, timerRef.current.getDelta());
            const s = stateRef.current; 
            s.time += dt;
            s.systems.forEach(sys => { if (sys.orbitData) sys.orbitData.forEach(od => { od.angle += od.speed * dt * 0.28; od.mesh.position.x = od.orbitR * Math.cos(od.angle); od.mesh.position.z = od.orbitR * Math.sin(od.angle); od.mesh.rotation.y += dt * 0.25; }); });

            const currentPulses = []; 
            s.pulses.forEach(p => { 
                p.age += dt; 
                const progress = p.age / p.maxAge; 
                if (progress < 1) { 
                    const scale = 1 + progress * 4; 
                    p.mesh.scale.set(scale, scale, 1); 
                    p.mesh.material.opacity = 0.8 * (1 - progress); 
                    currentPulses.push(p); 
                } else { 
                    scene.remove(p.mesh); 
                } 
            }); 
            s.pulses = currentPulses;

            // DYNAMIC TRACKING: Update goal position every frame for moving planets
            if (s.selectedMesh) {
                const worldPos = new THREE.Vector3();
                s.selectedMesh.getWorldPosition(worldPos);
                s.camTargetGoal.copy(worldPos);
            }

            const lerpFactor = Math.min(1, dt * 4.5);
            s.camTarget.lerp(s.camTargetGoal, lerpFactor);
            s.camDist += (s.camDistGoal - s.camDist) * lerpFactor;
            const sinP = Math.sin(s.camPhi);

            // Calculate Viewport Offset (Accounting for Inspector Panel)
            // If inspector is open, we offset the camera's focus point to the right 
            // so the planet appears centered in the visible left 70% of the screen.
            const focusTarget = s.camTarget.clone();
            if (inspectorOpen && !isMobile) {
                const offsetAmount = s.camDist * 0.18; // Proportional offset for framing
                const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                focusTarget.sub(rightVec.clone().multiplyScalar(offsetAmount));
            }

            camera.position.set(
                s.camTarget.x + s.camDist * sinP * Math.cos(s.camTheta), 
                s.camTarget.y + s.camDist * Math.cos(s.camPhi), 
                s.camTarget.z + s.camDist * sinP * Math.sin(s.camTheta)
            ); 
            camera.lookAt(focusTarget);
            
            // ANIMATE STELLAR ECHO RIPPLES
            if (s.rippleGroup) {
                s.rippleGroup.children.forEach(ring => {
                    ring.userData.progress += dt * 0.35; // Slower timing for more presence
                    if (ring.userData.progress > 1) ring.userData.progress = 0;
                    
                    const p = ring.userData.progress;
                    const scale = (2.0 + p * 8.0); // 10x Expansion target
                    ring.scale.set(scale, scale, scale);
                    ring.material.opacity = Math.pow(1 - p, 0.8); // Slower exponential decay
                });
            }

            // PROJECT LABELS
            s.systems.forEach(sys => { 
                if (!sys.label) return; 
                const p3 = sys.pos.clone(); p3.y += 6; const pj = p3.project(camera); 
                const sx = (pj.x * 0.5 + 0.5) * W, sy = (-pj.y * 0.5 + 0.5) * H;
                if (pj.z > 1 || pj.z < -1 || sx < 0 || sx > W || sy < 0 || sy > H) { sys.label.style.display = 'none'; } 
                else { sys.label.style.display = 'block'; sys.label.style.left = sx + 'px'; sys.label.style.top = sy + 'px'; }

                // Planet Labels
                if (sys.orbitData) {
                    sys.orbitData.forEach(od => {
                        if (!od.label) return;
                        const wp = new THREE.Vector3(); od.mesh.getWorldPosition(wp);
                        const dist = camera.position.distanceTo(wp);
                        const pj2 = wp.project(camera);
                        const sx2 = (pj2.x * 0.5 + 0.5) * W, sy2 = (-pj2.y * 0.5 + 0.5) * H;

                        if (pj2.z > 1 || pj2.z < -1 || sx2 < 0 || sx2 > W || sy2 < 0 || sy2 > H || dist > 180) {
                            od.label.style.display = 'none';
                        } else {
                            od.label.style.display = 'block';
                            od.label.style.left = sx2 + 'px';
                            od.label.style.top = (sy2 - 15) + 'px';
                            // Distance Fade
                            const alpha = Math.max(0, Math.min(1, (120 - dist) / 60));
                            od.label.style.opacity = od.label.classList.contains('selected') ? 1 : alpha * 0.5;
                        }
                    });
                }
            });
            renderer.render(scene, camera);
        };
        animate();
        const onResize = () => { const w = wrap.clientWidth, h = wrap.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }; window.addEventListener('resize', onResize);
        wrap.addEventListener('mousemove', (e) => { const rect = wrap.getBoundingClientRect(); mouse2dRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; mouse2dRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1; if (stateRef.current.isDrag) { const dx = e.clientX - stateRef.current.lm.x, dy = e.clientY - stateRef.current.lm.y; stateRef.current.camTheta -= dx * 0.005; stateRef.current.camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, stateRef.current.camPhi + dy * 0.005)); stateRef.current.lm = { x: e.clientX, y: e.clientY }; } });
        wrap.addEventListener('mousedown', (e) => { stateRef.current.isDrag = true; stateRef.current.lm = { x: e.clientX, y: e.clientY }; }); window.addEventListener('mouseup', () => { stateRef.current.isDrag = false; });
        wrap.addEventListener('wheel', (e) => { stateRef.current.camDistGoal = Math.max(8, Math.min(450, stateRef.current.camDistGoal + e.deltaY * 0.12)); e.preventDefault(); }, { passive: false });
        wrap.addEventListener('click', () => { raycasterRef.current.setFromCamera(mouse2dRef.current, camera); const hits = raycasterRef.current.intersectObjects(stateRef.current.allPlanets); if (hits.length) { const fd = stateRef.current.meshToFile.get(hits[0].object.uuid); if (fd) selectPlanet(hits[0].object, fd); } });
        if (initialRepoUrl) loadRepo(initialRepoUrl);
        return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(stateRef.current.frame); renderer.dispose(); };
    }, [initialRepoUrl, selectPlanet]);

    return (
        <div className="vanilla-galaxy-container">
            <SessionNavBar 
                fileCount={stateRef.current?.allPlanets?.length || 0} 
                branch={stateRef.current.branch}
                isLocked={sidebarLocked}
                onToggle={() => setSidebarLocked(!sidebarLocked)}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            >
                <div style={{width:'100%', minHeight:'100%'}}>
                    <FileTree 
                        tree={stateRef.current.tree} 
                        searchTerm={searchTerm} 
                        onSelect={(path) => {
                            const fd = Array.from(stateRef.current.meshToFile.values()).find(x => x.path === path);
                            const mesh = stateRef.current.allPlanets.find(m => stateRef.current.meshToFile.get(m.uuid)?.path === path);
                            if (fd && mesh) selectPlanet(mesh, fd);
                        }}
                        activePath={selectedPlanet?.path}
                    />
                </div>
            </SessionNavBar>


            <div id="vg-layout" style={{ 
                marginLeft: isMobile ? '0' : (sidebarLocked ? '280px' : '48px'), 
                marginRight: (inspectorOpen && !isMobile) ? '360px' : '0',
                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                width: '100%',
                height: '100%'
            }}>
                <div id="vg-gx-wrap" ref={wrapRef}>
                    <canvas id="vg-galaxy" ref={canvasRef}></canvas>
                    
                    {/* Mobile Hamburger Menu Trigger */}
                    {isMobile && (
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="fixed top-4 left-4 z-[60] p-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-[#ef233c] hover:bg-black/70 transition-all shadow-2xl"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobile && isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                        />
                        <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-[85vw] bg-[#020206] z-[80] border-r border-[#ef233c]/20 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#ef233c]/[0.02]">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#ef233c] text-xs animate-pulse">⬡</span>
                                    <span className="text-xs font-bold tracking-widest text-white/60 uppercase">Project structure</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="px-4 py-4 border-b border-white/5">
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-[#ef233c]/20 rounded pl-4 pr-3 py-2 font-mono text-sm text-white/80 placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c]/60"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 w-full font-mono p-4">
                                <FileTree 
                                    tree={stateRef.current.tree} 
                                    searchTerm={searchTerm} 
                                    onSelect={(path) => {
                                        const fd = Array.from(stateRef.current.meshToFile.values()).find(x => x.path === path);
                                        const mesh = stateRef.current.allPlanets.find(m => stateRef.current.meshToFile.get(m.uuid)?.path === path);
                                        if (fd && mesh) {
                                            selectPlanet(mesh, fd);
                                            setIsMobileMenuOpen(false);
                                        }
                                    }}
                                    activePath={selectedPlanet?.path}
                                />
                            </ScrollArea>
                            
                            <div className="p-6 border-t border-white/5 bg-black/40">
                                <div className="flex flex-col gap-2 font-mono text-[10px] text-white/40 uppercase tracking-tighter">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-500/50"></span> 
                                        <span>branch: {stateRef.current.branch}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-500">nodes:</span>
                                        <span>{stateRef.current?.allPlanets?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {inspectorOpen && (
                    <motion.div 
                        initial={isMobile ? { y: "100%" } : { x: "100%" }}
                        animate={isMobile ? { y: 0 } : { x: 0 }}
                        exit={isMobile ? { y: "100%" } : { x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn("vg-inspector", isMobile && "is-mobile")}
                    >
                        <div className="vg-inspector-header">
                            <MenuVertical 
                                menuItems={[
                                    { label: "Intelligence", id: "INTELLIGENCE" },
                                    { label: "Source", id: "SOURCE" },
                                    { label: "Topology", id: "TOPOLOGY" }
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />
                                <button className="vg-inspector-close" onClick={() => {
                                    setInspectorOpen(false);
                                    stateRef.current.selectedMesh = null;
                                    if (stateRef.current.rippleGroup && stateRef.current.rippleGroup.parent) {
                                        stateRef.current.rippleGroup.parent.remove(stateRef.current.rippleGroup);
                                        stateRef.current.rippleGroup = null;
                                    }
                                }}>
                                    <X size={24} />
                                </button>
                        </div>

                        <div className="vg-inspector-content">
                            {activeTab === 'INTELLIGENCE' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="flex items-center gap-2 mb-6 pt-2">
                                        <div className="text-[#ef233c] text-sm animate-pulse">⬡</div>
                                        <div>
                                            <h2 className="text-2xl font-manrope font-bold tracking-tighter uppercase text-white leading-none mb-1">{selectedPlanet?.name}</h2>
                                            <p className="text-[10px] font-mono text-zinc-500 tracking-wider">/{selectedPlanet?.path}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="vg-metric-box">
                                            <span className="vg-metric-label">FILE SIZE</span>
                                            <span className="vg-metric-value">{fmtBytes(selectedPlanet?.size)}</span>
                                        </div>
                                        <div className="vg-metric-box">
                                            <span className="vg-metric-label">PLANET MASS</span>
                                            <span className="vg-metric-value">{(selectedPlanet?.pr * 3.14).toFixed(2)} M⊕</span>
                                        </div>
                                        <div className="vg-metric-box health-glow">
                                            <span className="vg-metric-label font-bold flex items-center gap-1 text-[#ef233c]">
                                                <Activity size={10} /> COMPLEXITY
                                            </span>
                                            <span className="vg-metric-value">0.82</span>
                                        </div>
                                        <div className="vg-metric-box warning-glow">
                                            <span className="vg-metric-label font-bold flex items-center gap-1 text-gold">
                                                <Zap size={10} /> TECH DEBT
                                            </span>
                                            <span className="vg-metric-value">Low</span>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-[10px] font-manrope font-bold tracking-[0.1em] text-zinc-500 uppercase mb-3 flex items-center gap-2">
                                            <Network size={12} className="text-[#ef233c]" /> AI SUMMARY
                                        </h3>
                                        <div className="vg-ai-summary font-manrope text-sm leading-relaxed text-zinc-300">
                                            {isAnalyzing ? (
                                                <div className="flex items-center gap-3 text-white/40 italic">
                                                    <span className="w-1.5 h-1.5 bg-[#ef233c] rounded-full animate-pulse" />
                                                    Analyzing stellar composition...
                                                </div>
                                            ) : intelligenceError ? (
                                                <div className="text-[#ef233c] font-bold tracking-wider animate-pulse uppercase text-xs">
                                                    ⚠ {intelligenceError}
                                                </div>
                                            ) : (
                                                stateRef.current.summaryCache.get(selectedPlanet?.path) || 
                                                "Select a node to initialize architectural synthesis."
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'SOURCE' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                                    <div className="flex items-center gap-2 mb-4 px-2">
                                        <Code size={14} className="text-[#ef233c]" />
                                        <span className="text-[10px] font-manrope font-bold uppercase tracking-[0.1em] text-zinc-500">RAW_ENCRYPTION_BUFFER</span>
                                    </div>
                                    <div className="vg-source-code-container flex-1 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
                                        <ScrollArea className="h-full w-full p-4">
                                            <pre className="font-mono text-xs leading-relaxed text-red-100/70" style={{ fontFamily: "'Space Mono', monospace" }}>
                                                <code>{sourceCode}</code>
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'TOPOLOGY' && (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-manrope font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">LANGUAGE DNA</h3>
                                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-[#ef233c]" style={{ width: '85%' }}></div>
                                            <div className="h-full bg-blue-500" style={{ width: '15%' }}></div>
                                        </div>
                                        <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-400">
                                            <span>JavaScript (85%)</span>
                                            <span>Other (15%)</span>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <h3 className="text-[10px] font-manrope font-bold tracking-[0.1em] text-zinc-500 uppercase mb-4">GRAVITY LINKS</h3>
                                        <div className="space-y-2">
                                            <div className="vg-topology-link">
                                                <ArrowRight size={12} /> util.js
                                            </div>
                                            <div className="vg-topology-link">
                                                <ArrowRight size={12} /> constants.js
                                            </div>
                                            <div className="vg-topology-link opacity-40">
                                                <ArrowRight size={12} /> external_dep
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VanillaGalaxy;

function fmtBytes(b) { if (!b) return '0 B'; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(2) + ' MB'; }
