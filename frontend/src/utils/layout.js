/**
 * CodeGalaxy — Hierarchical Layout Math
 * Calculates 3D positions for the Galaxy (repo) → Solar Systems (folders) → Planets (files).
 */

/**
 * Groups flat nodes into a folder hierarchy and computes positions.
 */
export function buildGalaxyHierarchy(nodes) {
    // 1. Group nodes by their parent directory
    const foldersMap = new Map();

    nodes.forEach(node => {
        // e.g. "src/components/Button.jsx" -> dir="src/components", name="Button.jsx"
        const parts = node.path.split('/');
        const fileName = parts.pop();
        const dirPath = parts.join('/') || '/ (root)';

        if (!foldersMap.has(dirPath)) {
            foldersMap.set(dirPath, {
                path: dirPath,
                name: dirPath.split('/').pop() || dirPath,
                files: [],
                x: 0, y: 0, z: 0 // Will be set by galaxy layout
            });
        }
        foldersMap.get(dirPath).files.push(node);
    });

    const folders = Array.from(foldersMap.values());

    // 2. Galaxy Layout: Position folders in a spiral
    // Using a simple Archimedean spiral or Vogel's model (fibonacci spiral)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Sort folders by number of files (biggest systems in center)
    folders.sort((a, b) => b.files.length - a.files.length);

    folders.forEach((folder, i) => {
        // Spread constant based on total folders to keep them spaced
        const c = 25; // Base distance multiplier

        // Vogel's formula for disk packing
        const r = c * Math.sqrt(i);
        const theta = i * goldenAngle;

        // Add some z-axis variance so it's a bit 3D
        const zVariance = (Math.random() - 0.5) * (r * 0.4);

        folder.x = r * Math.cos(theta);
        folder.y = zVariance; // Y is up in Three.js
        folder.z = r * Math.sin(theta);

        // 3. Solar System Layout: Position files in orbits around the folder center
        // Sort files by size (loc) so biggest planets are inner or outer
        folder.files.sort((a, b) => b.loc - a.loc);

        folder.files.forEach((file, j) => {
            // Distance from sun (folder center)
            // Stagger orbits: 4 units per orbit ring
            const orbitRadius = 8 + (j * 4.5);

            // Random starting angle for the planet on its orbit
            const angle = Math.random() * Math.PI * 2;

            // Orbital speed (slower for further planets)
            const speed = (Math.random() * 0.2 + 0.1) / Math.sqrt(orbitRadius);

            // Save orbit data onto the file node itself so the component can animate it
            file.orbit = {
                radius: orbitRadius,
                baseAngle: angle,
                speed: speed,
                // The center of the orbit is the folder's position
                cx: folder.x,
                cy: folder.y,
                cz: folder.z
            };

            // Initial exact coordinates relative to center (for lines, etc)
            file.x = folder.x + Math.cos(angle) * orbitRadius;
            file.y = folder.y;
            file.z = folder.z + Math.sin(angle) * orbitRadius;
        });
    });

    return folders;
}
