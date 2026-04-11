"""
CodeGalaxy Backend - Code Analyzer
Computes cyclomatic complexity, TODO counts, and composite risk scores.
"""
import re
import math


def count_markers(content: str) -> int:
    """Count TODO, FIXME, HACK, XXX comment markers."""
    pattern = re.compile(r"\b(TODO|FIXME|HACK|XXX|BUG|WARN)\b", re.IGNORECASE)
    return len(pattern.findall(content))


def compute_cyclomatic_complexity(content: str, language: str) -> float:
    """
    Estimate cyclomatic complexity using branch/decision point counting.
    Uses radon for Python, regex heuristic for others.
    """
    if language == "python":
        try:
            from radon.complexity import cc_visit
            results = cc_visit(content)
            if results:
                # Average complexity across all functions/methods
                complexities = [block.complexity for block in results]
                return sum(complexities) / len(complexities)
            return 1.0
        except Exception:
            pass

    # Regex-based heuristic for all languages
    decision_keywords = [
        r"\bif\b", r"\belse\b", r"\belif\b", r"\bfor\b", r"\bwhile\b",
        r"\bcase\b", r"\bcatch\b", r"\bexcept\b", r"\b&&\b", r"\b\|\|\b",
        r"\band\b", r"\bor\b", r"\?\s*:", r"\bswitch\b",
    ]
    count = 1  # Base complexity
    for kw in decision_keywords:
        count += len(re.findall(kw, content))

    # Normalize by lines of code for a per-function estimate
    loc = max(len(content.splitlines()), 1)
    functions_est = max(content.count("function") + content.count("def ") + content.count("func "), 1)

    return count / functions_est


def compute_risk_score(
    complexity: float,
    loc: int,
    todo_count: int,
    function_count: int,
    import_count: int,
) -> float:
    """
    Compute a composite risk score between 0 and 1.
    Higher = more risky / needs attention.
    
    Factors:
    - Cyclomatic complexity (higher = riskier)
    - File size / LOC (very large files are risky)
    - TODO/FIXME density
    - High fan-out (many imports)
    """
    # Complexity factor (sigmoid normalized, 10 = mid-high)
    complexity_factor = 1 / (1 + math.exp(-0.3 * (complexity - 8)))

    # Size factor (files over 500 LOC start getting risky)
    size_factor = min(loc / 1000.0, 1.0)

    # Marker density
    marker_density = min(todo_count / max(loc / 100, 1), 1.0)

    # Fan-out factor
    fanout_factor = min(import_count / 20.0, 1.0)

    # Weighted composite
    score = (
        0.40 * complexity_factor +
        0.25 * size_factor +
        0.20 * marker_density +
        0.15 * fanout_factor
    )

    return round(min(max(score, 0.0), 1.0), 3)


async def analyze_file_async(content: str, language: str, loc: int, function_count: int, import_count: int) -> dict:
    """Async wrapper for running full analysis suite on a file."""
    import asyncio
    
    def _run():
        todo_count = count_markers(content)
        complexity = compute_cyclomatic_complexity(content, language)
        risk_score = compute_risk_score(
            complexity=complexity,
            loc=loc,
            todo_count=todo_count,
            function_count=function_count,
            import_count=import_count
        )
        return {
            "todo_count": todo_count,
            "complexity": complexity,
            "risk_score": risk_score
        }

    return await asyncio.to_thread(_run)
