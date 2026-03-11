/**
 * CodeGalaxy — Edges Component
 * Renders dependency lines between nodes using batched line segments.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

export default function Edges({ edges, nodes }) {
    // Build a lookup map: path -> node  
    const nodeMap = useMemo(() => {
        const map = {};
        nodes.forEach((node) => {
            map[node.path] = node;
        });
        return map;
    }, [nodes]);

    // Generate line geometry
    const geometry = useMemo(() => {
        if (!edges.length || !nodes.length) return null;

        const positions = [];
        const colors = [];

        const importColor = new THREE.Color('#1a3a5c');
        const callColor = new THREE.Color('#3a1a5c');

        edges.forEach((edge) => {
            const source = nodeMap[edge.source];
            const target = nodeMap[edge.target];
            if (!source || !target) return;

            positions.push(source.x, source.y, source.z);
            positions.push(target.x, target.y, target.z);

            const color = edge.type === 'import' ? importColor : callColor;
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
        });

        if (positions.length === 0) return null;

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geom;
    }, [edges, nodeMap, nodes]);

    if (!geometry) return null;

    return (
        <lineSegments geometry={geometry} frustumCulled={false}>
            <lineBasicMaterial
                vertexColors
                transparent
                opacity={0.12}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </lineSegments>
    );
}
