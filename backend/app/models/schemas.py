"""
CodeGalaxy Backend - Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Optional


# ─── Request Schemas ───────────────────────────────────────

class IngestRequest(BaseModel):
    owner: str
    repo: str
    branch: str = "main"


# ─── Response Schemas ──────────────────────────────────────

class NodeResponse(BaseModel):
    id: int
    path: str
    filename: str
    language: str
    x: float
    y: float
    z: float
    loc: int
    complexity: float
    risk_score: float
    todo_count: int
    function_count: int
    summary: Optional[str] = None
    importance_score: float = 1.0

    model_config = {"from_attributes": True}


class EdgeResponse(BaseModel):
    source: str
    target: str
    type: str

    model_config = {"from_attributes": True}


class GraphResponse(BaseModel):
    repo_id: int
    repo_name: str
    nodes: list[NodeResponse]
    edges: list[EdgeResponse]


class RepoResponse(BaseModel):
    id: int
    owner: str
    name: str
    branch: str
    status: str
    total_files: int
    processed_files: int

    model_config = {"from_attributes": True}


class FileDetailResponse(BaseModel):
    id: int
    path: str
    filename: str
    language: str
    content: Optional[str] = None
    loc: int
    complexity: float
    risk_score: float
    todo_count: int
    function_count: int
    summary: Optional[str] = None
    importance_score: float = 1.0
    imports: list
    functions: list
    classes: list
    fan_in: int = 0
    fan_out: int = 0

    model_config = {"from_attributes": True}


class IngestStatusResponse(BaseModel):
    repo_id: int
    status: str
    total_files: int
    processed_files: int
    progress: float
