import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere, Line } from '@react-three/drei';
import { getRiskColor } from '../utils/colors';

export default function Planet({ file, onClick, hoveredNode }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    // Planet size scales with file loc (lines of code)
    // cap at [0.2, 2.0]
    const size = Math.max(0.2, Math.min(2.0, (file.loc || 100) / 200));

    // Base color from risk score
    const color = getRiskColor(file.risk_score || 0);

    const orbit = file.orbit;

    useFrame(({ clock }) => {
        if (!meshRef.current || !orbit) return;

        // Calculate new position based on time, speed, radius
        const t = clock.getElapsedTime() * orbit.speed + orbit.baseAngle;

        // We orbit around the center (0,0) of the parent SolarSystem group
        // So we just set local position
        meshRef.current.position.x = Math.cos(t) * orbit.radius;
        meshRef.current.position.z = Math.sin(t) * orbit.radius;
        meshRef.current.position.y = 0; // Flat orbit plane
    });

    const isHovered = hovered || (hoveredNode && hoveredNode.id === file.id);

    // Orbit path visualization
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push([
            Math.cos(angle) * orbit.radius,
            0,
            Math.sin(angle) * orbit.radius
        ]);
    }

    return (
        <group>
            {/* The Orbit Ring */}
            <Line
                points={points}
                color="rgba(255, 255, 255, 0.002)"
                lineWidth={1}
                transparent
                depthTest={false}
            />

            {/* The Planet */}
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(file);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    setHovered(false);
                }}
            >
                <sphereGeometry args={[size, 16, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isHovered ? 1.5 : 0.5}
                    toneMapped={false}
                />

                {isHovered && (
                    <Html distanceFactor={15} center zIndexRange={[100, 0]}>
                        <div style={{
                            background: 'rgba(10, 14, 26, 0.9)',
                            padding: '4px 8px',
                            border: '1px solid var(--accent)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            transform: 'scale(4)',
                            transformOrigin: 'center center'
                        }}>
                            {file.filename}
                        </div>
                    </Html>
                )}
            </mesh>
        </group>
    );
}
