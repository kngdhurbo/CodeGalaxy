/**
 * CodeGalaxy — NodeTooltip Component
 * Floating tooltip that follows the cursor when hovering over a node.
 */
import { getRiskLevel, getRiskLabel } from '../utils/colors';

export default function NodeTooltip({ node, position }) {
    if (!node || !position) return null;

    const riskLevel = getRiskLevel(node.risk_score);
    const riskLabel = getRiskLabel(node.risk_score);

    const dir = node.path.substring(0, node.path.lastIndexOf('/')) || '/';

    return (
        <div
            className="tooltip animate-in"
            style={{
                left: position.x + 16,
                top: position.y - 8,
            }}
        >
            <div className="tooltip-filename">{node.filename}</div>
            <div className="tooltip-path">{dir}</div>
            <div className="tooltip-stats">
                <span className="tooltip-stat">
                    <span style={{ opacity: 0.6 }}>📄</span>
                    {node.loc} LOC
                </span>
                <span className="tooltip-stat">
                    <span style={{ opacity: 0.6 }}>⚡</span>
                    {node.function_count} fn
                </span>
                <span className="tooltip-stat">
                    <span className={`risk-badge ${riskLevel}`}>{riskLabel}</span>
                </span>
            </div>
        </div>
    );
}
