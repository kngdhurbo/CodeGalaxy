import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Planet from './Planet';

export default function SolarSystem({ folder, onNodeClick, hoveredNode }) {
    const starRef = useRef();
    const [hovered, setHovered] = useState(false);

    // Star rotates slowly
    useFrame(() => {
        if (starRef.current) {
            starRef.current.rotation.y += 0.005;
        }
    });

    // Star size depends slightly on number of planets
    const starRadius = Math.max(1.5, Math.min(4.0, 1.5 + (folder.files.length * 0.1)));

    return (
        <group position={[folder.x, folder.y, folder.z]}>
            {/* The Central Star (Folder) */}
            <mesh
                ref={starRef}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    setHovered(false);
                }}
            >
                {/* Icosahedron looks slightly more "starlike" and techy than a perfect sphere */}
                <icosahedronGeometry args={[starRadius, 2]} />
                <meshStandardMaterial
                    color="#4dabf7" // bright cyan/blue star
                    emissive="#4dabf7"
                    emissiveIntensity={hovered ? 2.0 : 0.8}
                    wireframe={hovered}
                    toneMapped={false}
                />
            </mesh>

            <Html position={[0, starRadius + 1.5, 0]} center distanceFactor={20} zIndexRange={[100, 0]}>
                <div style={{
                    color: hovered ? '#4dabf7' : 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textShadow: '0 0 10px rgba(77, 171, 247, 0.8)',
                    transform: 'scale(10)',
                    transformOrigin: 'center center'
                }}>
                    {folder.name}
                </div>
            </Html>

            {/* Orbiting Planets (Files) */}
            {folder.files.map(file => (
                <Planet
                    key={file.id}
                    file={file}
                    onClick={onNodeClick}
                    hoveredNode={hoveredNode}
                />
            ))}
        </group>
    );
}
