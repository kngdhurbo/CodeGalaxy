/**
 * CodeGalaxy — Universe Component
 * The 3D canvas scene: stars, edges, lighting, and post-processing bloom.
 */
import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Galaxy from './Galaxy';
import Edges from './Edges';

export default function Universe({ folders, nodes, edges, onHover, onClick, hoveredId, selectedNode }) {
    const controlsRef = useRef();

    // Fly to selected node smoothly
    useEffect(() => {
        if (selectedNode && controlsRef.current) {
            controlsRef.current.setLookAt(
                selectedNode.x + 15,
                selectedNode.y + 10,
                selectedNode.z + 15, // Move camera slightly away and above
                selectedNode.x,
                selectedNode.y,
                selectedNode.z, // Look directly at the node
                true // animate boolean
            );
        }
    }, [selectedNode]);
    return (
        <div className="canvas-container">
            <Canvas
                camera={{ position: [0, 0, 80], fov: 60, near: 0.1, far: 1000 }}
                gl={{ antialias: true, alpha: false }}
                style={{ background: '#050810' }}
            >
                {/* Galaxy background and structures are now in Galaxy.jsx */}

                {/* Lighting */}
                <ambientLight intensity={0.25} />
                <pointLight position={[50, 50, 50]} intensity={0.8} color="#e0e8ff" />
                <pointLight position={[-30, -30, 30]} intensity={0.4} color="#b266ff" />
                <pointLight position={[0, 40, -40]} intensity={0.3} color="#00e5ff" />

                {/* Hierarchical rendering of repo -> folders -> files */}
                {folders && folders.length > 0 && (
                    <Galaxy
                        folders={folders}
                        onNodeClick={onClick}
                        hoveredNode={{ id: hoveredId }} // pass it wrapped to match expectations, or we could pass the actual object if available. We can just wait for onPointerOver inside Planet instead.
                    />
                )}

                {/* Dependency edges */}
                <Edges edges={edges} nodes={nodes} />

                {/* Smooth Camera controls */}
                <CameraControls
                    ref={controlsRef}
                    maxDistance={Infinity}
                    minDistance={1}
                    dollySpeed={1.0}
                    truckSpeed={1.5}
                    smoothTime={0.4} // duration of smoothing
                    mouseButtons={{
                        left: 1, // ACTION.ROTATE
                        middle: 8, // ACTION.DOLLY
                        right: 2, // ACTION.TRUCK (pan)
                        wheel: 8 // ACTION.DOLLY
                    }}
                />

                {/* Post-processing bloom for glow effect */}
                <EffectComposer>
                    <Bloom
                        intensity={0.6}
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        mipmapBlur
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
