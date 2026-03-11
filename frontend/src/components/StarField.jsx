/**
 * CodeGalaxy — StarField Component
 * Renders all file nodes as instanced meshes for maximum GPU performance.
 * Each node: position from UMAP, scale from LOC, color from risk score.
 */
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getNodeColor, getNodeScale } from '../utils/colors';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export default function StarField({ nodes, onHover, onClick, hoveredId }) {
    const meshRef = useRef();
    const glowMeshRef = useRef();
    const { camera, gl } = useThree();
    const [localHovered, setLocalHovered] = useState(-1);

    const nodeCount = nodes.length;

    // Set instance transforms AND colors
    useEffect(() => {
        if (!meshRef.current || nodeCount === 0) return;

        nodes.forEach((node, i) => {
            const scale = getNodeScale(node.loc);
            tempObject.position.set(node.x, node.y, node.z);
            tempObject.scale.setScalar(scale);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);

            // Set per-instance color
            const color = getNodeColor(node.risk_score, node.language);
            meshRef.current.setColorAt(i, color);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }

        // Glow mesh — slightly larger
        if (glowMeshRef.current) {
            nodes.forEach((node, i) => {
                const scale = getNodeScale(node.loc) * 2.2;
                tempObject.position.set(node.x, node.y, node.z);
                tempObject.scale.setScalar(scale);
                tempObject.updateMatrix();
                glowMeshRef.current.setMatrixAt(i, tempObject.matrix);

                const color = getNodeColor(node.risk_score, node.language);
                glowMeshRef.current.setColorAt(i, color);
            });
            glowMeshRef.current.instanceMatrix.needsUpdate = true;
            if (glowMeshRef.current.instanceColor) {
                glowMeshRef.current.instanceColor.needsUpdate = true;
            }
        }
    }, [nodes, nodeCount]);

    // Raycasting for hover detection
    useEffect(() => {
        const canvas = gl.domElement;

        const onPointerMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);
            if (meshRef.current) {
                const intersects = raycaster.intersectObject(meshRef.current);
                if (intersects.length > 0) {
                    const idx = intersects[0].instanceId;
                    setLocalHovered(idx);
                    if (onHover) onHover(nodes[idx], e);
                } else {
                    setLocalHovered(-1);
                    if (onHover) onHover(null, e);
                }
            }
        };

        const onPointerClick = (e) => {
            if (localHovered >= 0 && onClick) {
                onClick(nodes[localHovered]);
            }
        };

        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('click', onPointerClick);

        return () => {
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('click', onPointerClick);
        };
    }, [camera, gl, nodes, onHover, onClick, localHovered]);

    // Animate glow pulse
    useFrame((state) => {
        if (glowMeshRef.current && glowMeshRef.current.material) {
            const time = state.clock.elapsedTime;
            glowMeshRef.current.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.06;
        }
    });

    if (nodeCount === 0) return null;

    return (
        <group>
            {/* Core star nodes */}
            <instancedMesh
                ref={meshRef}
                args={[null, null, nodeCount]}
                frustumCulled={false}
            >
                <icosahedronGeometry args={[0.4, 2]} />
                <meshPhysicalMaterial
                    roughness={0.2}
                    metalness={0.8}
                    emissiveIntensity={0.6}
                    emissive="#ffffff"
                    toneMapped={false}
                />
            </instancedMesh>

            {/* Glow halo mesh */}
            <instancedMesh
                ref={glowMeshRef}
                args={[null, null, nodeCount]}
                frustumCulled={false}
            >
                <icosahedronGeometry args={[0.4, 1]} />
                <meshBasicMaterial
                    transparent
                    opacity={0.12}
                    depthWrite={false}
                    side={THREE.BackSide}
                    toneMapped={false}
                />
            </instancedMesh>
        </group>
    );
}
