import { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import SolarSystem from './SolarSystem';

export default function Galaxy({ folders, onNodeClick, hoveredNode }) {
    return (
        <group>
            {/* Background stars for depth */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Solar Systems */}
            {folders.map(folder => (
                <SolarSystem
                    key={folder.path}
                    folder={folder}
                    onNodeClick={onNodeClick}
                    hoveredNode={hoveredNode}
                />
            ))}
        </group>
    );
}
