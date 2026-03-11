/**
 * CodeGalaxy — Color Utilities
 * Maps risk scores to colors for the 3D visualization.
 */
import * as THREE from 'three';

// Risk-level color stops
const RISK_COLORS = {
    low: new THREE.Color('#00e676'),
    medium: new THREE.Color('#ffab40'),
    high: new THREE.Color('#ff5252'),
    critical: new THREE.Color('#ff1744'),
};

// Language colors for variety
const LANGUAGE_COLORS = {
    python: new THREE.Color('#3572A5'),
    javascript: new THREE.Color('#f1e05a'),
    typescript: new THREE.Color('#3178c6'),
    java: new THREE.Color('#b07219'),
    go: new THREE.Color('#00ADD8'),
    rust: new THREE.Color('#dea584'),
    ruby: new THREE.Color('#701516'),
    cpp: new THREE.Color('#f34b7d'),
    c: new THREE.Color('#555555'),
    csharp: new THREE.Color('#178600'),
    php: new THREE.Color('#4F5D95'),
    unknown: new THREE.Color('#8892a8'),
};

/**
 * Get a color based on risk score (0-1).
 * Low risk = green, high risk = red glow.
 */
export function getRiskColor(riskScore) {
    if (riskScore < 0.25) {
        return RISK_COLORS.low.clone().lerp(RISK_COLORS.medium, riskScore / 0.25);
    } else if (riskScore < 0.5) {
        return RISK_COLORS.medium.clone().lerp(RISK_COLORS.high, (riskScore - 0.25) / 0.25);
    } else {
        return RISK_COLORS.high.clone().lerp(RISK_COLORS.critical, Math.min((riskScore - 0.5) / 0.5, 1));
    }
}

/**
 * Get the CSS class string for a risk level.
 */
export function getRiskLevel(riskScore) {
    if (riskScore < 0.25) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.75) return 'high';
    return 'critical';
}

/**
 * Get label for risk level.
 */
export function getRiskLabel(riskScore) {
    if (riskScore < 0.25) return 'Low Risk';
    if (riskScore < 0.5) return 'Medium';
    if (riskScore < 0.75) return 'High Risk';
    return 'Critical';
}

/**
 * Get the Three.js color for a programming language.
 */
export function getLanguageColor(language) {
    return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.unknown;
}

/**
 * Get a color blending risk and language — risk dominates at higher values.
 */
export function getNodeColor(riskScore, language) {
    const langColor = getLanguageColor(language);
    const riskColor = getRiskColor(riskScore);

    // Below 0.3 risk: show language color. Above: blend toward risk color.
    const blend = Math.min(Math.max((riskScore - 0.2) / 0.4, 0), 1);
    return langColor.clone().lerp(riskColor, blend);
}

/**
 * Map LOC to a node scale factor.
 */
export function getNodeScale(loc) {
    const minScale = 0.3;
    const maxScale = 2.5;
    // Logarithmic scaling so large files don't dominate
    const normalized = Math.log10(Math.max(loc, 10)) / Math.log10(5000);
    return minScale + Math.min(normalized, 1) * (maxScale - minScale);
}
