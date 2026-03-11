"""
CodeGalaxy Backend - AST Parser Service
Extracts imports, functions, classes, and dependency edges using regex-based parsing.
(Tree-sitter can be swapped in for production multi-language support.)
"""
import re
import os
from typing import Optional


# ─── Language detection ────────────────────────────────────

LANG_MAP = {
    ".py": "python", ".js": "javascript", ".jsx": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".java": "java",
    ".go": "go", ".rs": "rust", ".rb": "ruby", ".cpp": "cpp",
    ".c": "c", ".h": "c", ".hpp": "cpp", ".cs": "csharp", ".php": "php",
}


def detect_language(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    return LANG_MAP.get(ext, "unknown")


# ─── Import extraction (regex-based, per language) ─────────

IMPORT_PATTERNS = {
    "python": [
        re.compile(r"^from\s+([\w.]+)\s+import", re.MULTILINE),
        re.compile(r"^import\s+([\w.]+)", re.MULTILINE),
    ],
    "javascript": [
        re.compile(r"""import\s+.*?from\s+['"]([^'"]+)['"]""", re.MULTILINE),
        re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""", re.MULTILINE),
    ],
    "typescript": [
        re.compile(r"""import\s+.*?from\s+['"]([^'"]+)['"]""", re.MULTILINE),
        re.compile(r"""require\(\s*['"]([^'"]+)['"]\s*\)""", re.MULTILINE),
    ],
    "java": [
        re.compile(r"^import\s+([\w.]+);", re.MULTILINE),
    ],
    "go": [
        re.compile(r'"([\w./]+)"', re.MULTILINE),
    ],
}


def extract_imports(content: str, language: str) -> list[str]:
    """Extract import/require statements from source code."""
    imports = []
    patterns = IMPORT_PATTERNS.get(language, [])
    for pattern in patterns:
        matches = pattern.findall(content)
        imports.extend(matches)
    return list(set(imports))


# ─── Function & Class extraction ──────────────────────────

FUNCTION_PATTERNS = {
    "python": re.compile(r"^\s*(?:async\s+)?def\s+(\w+)\s*\(", re.MULTILINE),
    "javascript": re.compile(r"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))", re.MULTILINE),
    "typescript": re.compile(r"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))", re.MULTILINE),
    "java": re.compile(r"(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(", re.MULTILINE),
    "go": re.compile(r"func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(", re.MULTILINE),
}

CLASS_PATTERNS = {
    "python": re.compile(r"^\s*class\s+(\w+)", re.MULTILINE),
    "javascript": re.compile(r"class\s+(\w+)", re.MULTILINE),
    "typescript": re.compile(r"(?:class|interface)\s+(\w+)", re.MULTILINE),
    "java": re.compile(r"class\s+(\w+)", re.MULTILINE),
    "go": re.compile(r"type\s+(\w+)\s+struct", re.MULTILINE),
}


def extract_functions(content: str, language: str) -> list[str]:
    """Extract function/method names from source code."""
    pattern = FUNCTION_PATTERNS.get(language)
    if not pattern:
        return []
    matches = pattern.findall(content)
    # Flatten tuples from multi-group patterns
    funcs = []
    for m in matches:
        if isinstance(m, tuple):
            funcs.extend([g for g in m if g])
        else:
            funcs.append(m)
    return list(set(funcs))


def extract_classes(content: str, language: str) -> list[str]:
    """Extract class/interface names from source code."""
    pattern = CLASS_PATTERNS.get(language)
    if not pattern:
        return []
    return list(set(pattern.findall(content)))


# ─── Full parse ────────────────────────────────────────────

def parse_file(path: str, content: str) -> dict:
    """
    Parse a single source file and return structured data.
    """
    language = detect_language(path)
    imports = extract_imports(content, language)
    functions = extract_functions(content, language)
    classes = extract_classes(content, language)
    loc = len(content.splitlines())

    return {
        "language": language,
        "imports": imports,
        "functions": functions,
        "classes": classes,
        "loc": loc,
    }


def resolve_import_to_path(imp: str, all_paths: list[str], source_dir: str) -> Optional[str]:
    """
    Try to resolve an import string to an actual file path in the repo.
    E.g., 'from app.services.github import ...' -> 'app/services/github.py'
    """
    # Convert dot notation (Python) to path
    candidates = [
        imp.replace(".", "/") + ext
        for ext in [".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".go"]
    ]
    # Also try relative paths
    candidates += [
        os.path.join(source_dir, imp.lstrip("./").replace(".", "/")) + ext
        for ext in [".py", ".js", ".jsx", ".ts", ".tsx"]
    ]
    # Also try the import as-is
    candidates.append(imp)

    all_paths_set = set(all_paths)
    for candidate in candidates:
        normalized = candidate.replace("\\", "/")
        if normalized in all_paths_set:
            return normalized

    return None
