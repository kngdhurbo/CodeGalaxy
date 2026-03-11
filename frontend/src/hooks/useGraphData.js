/**
 * CodeGalaxy — useGraphData Hook
 * Fetches and manages graph data from the backend API.
 * Also provides mock data mode for frontend-only development.
 */
import { useState, useEffect, useCallback } from 'react';
import { getGraph } from '../api/client';
import { buildGalaxyHierarchy } from '../utils/layout';

/**
 * Generate mock graph data for development (no backend needed).
 */
function generateMockData(nodeCount = 200) {
    const languages = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp'];
    const dirs = [
        'src/core', 'src/api', 'src/utils', 'src/models', 'src/services',
        'src/components', 'src/hooks', 'src/middleware', 'lib/database',
        'lib/auth', 'lib/cache', 'tests/unit', 'tests/integration', 'config',
    ];

    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
        const lang = languages[Math.floor(Math.random() * languages.length)];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const ext = lang === 'python' ? '.py' : lang === 'javascript' ? '.js' :
            lang === 'typescript' ? '.ts' : lang === 'java' ? '.java' :
                lang === 'go' ? '.go' : lang === 'rust' ? '.rs' : '.cpp';
        const filename = `file_${i}${ext}`;

        // Cluster files from the same directory together
        const clusterIdx = dirs.indexOf(dir);
        const angle = (clusterIdx / dirs.length) * Math.PI * 2;
        const clusterX = Math.cos(angle) * 25;
        const clusterY = Math.sin(angle) * 25;
        const clusterZ = (clusterIdx % 3 - 1) * 15;

        nodes.push({
            id: i + 1,
            path: `${dir}/${filename}`,
            filename,
            language: lang,
            y: 0,
            z: 0,
            loc: Math.floor(30 + Math.random() * 800),
            complexity: Math.random() * 15,
            risk_score: Math.random(),
            todo_count: Math.floor(Math.random() * 8),
            function_count: Math.floor(1 + Math.random() * 20),
        });
    }

    // Generate some dependency edges
    const edges = [];
    for (let i = 0; i < nodeCount * 0.6; i++) {
        const source = nodes[Math.floor(Math.random() * nodeCount)];
        const target = nodes[Math.floor(Math.random() * nodeCount)];
        if (source.id !== target.id) {
            edges.push({
                source: source.path,
                target: target.path,
                type: Math.random() > 0.3 ? 'import' : 'call',
            });
        }
    }

    const folders = buildGalaxyHierarchy(nodes);
    return { repo_id: 0, repo_name: 'mock/demo-repo', nodes, edges, folders };
}

/**
 * Custom hook for managing graph data.
 * Uses mock data when no backend is available.
 */
export function useGraphData(repoId = null) {
    const [graphData, setGraphData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [useMock, setUseMock] = useState(false);

    const loadGraph = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            if (id && id > 0) {
                const data = await getGraph(id);
                data.folders = buildGalaxyHierarchy(data.nodes);
                setGraphData(data);
                setUseMock(false);
            } else {
                throw new Error('no_repo');
            }
        } catch (err) {
            // Fallback to mock data
            console.log('Using mock data for visualization');
            const mockData = generateMockData(250);
            setGraphData(mockData);
            setUseMock(true);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGraph(repoId);
    }, [repoId, loadGraph]);

    const loadMock = useCallback((count = 250) => {
        setLoading(true);
        setTimeout(() => {
            setGraphData(generateMockData(count));
            setUseMock(true);
            setLoading(false);
        }, 500);
    }, []);

    return {
        graphData,
        loading,
        error,
        useMock,
        loadGraph,
        loadMock,
        nodes: graphData?.nodes || [],
        edges: graphData?.edges || [],
        folders: graphData?.folders || [],
        repoName: graphData?.repo_name || '',
    };
}
