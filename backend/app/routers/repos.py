"""
CodeGalaxy Backend - Repos Router
Lists repositories and returns graph data for visualization.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db, Repository, FileNode, Edge
from app.models.schemas import RepoResponse, GraphResponse, NodeResponse, EdgeResponse

router = APIRouter(prefix="/api", tags=["repos"])


@router.get("/repos", response_model=list[RepoResponse])
async def list_repos(db: AsyncSession = Depends(get_db)):
    """List all processed repositories."""
    result = await db.execute(select(Repository).order_by(Repository.created_at.desc()))
    repos = result.scalars().all()
    return repos


@router.get("/repos/{repo_id}/graph", response_model=GraphResponse)
async def get_graph(repo_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get the full 3D graph data for a repository.
    Returns nodes (files with coordinates) and edges (dependencies).
    """
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.status != "done":
        raise HTTPException(status_code=400, detail=f"Repository still {repo.status}")

    # Fetch nodes
    result = await db.execute(select(FileNode).where(FileNode.repo_id == repo_id))
    file_nodes = result.scalars().all()

    nodes = [
        NodeResponse(
            id=n.id,
            path=n.path,
            filename=n.filename,
            language=n.language,
            x=n.x,
            y=n.y,
            z=n.z,
            loc=n.loc,
            complexity=round(n.complexity, 2),
            risk_score=n.risk_score,
            todo_count=n.todo_count,
            function_count=n.function_count,
            summary=n.summary,
            importance_score=n.importance_score or 1.0,
        )
        for n in file_nodes
    ]

    # Fetch edges
    result = await db.execute(select(Edge).where(Edge.repo_id == repo_id))
    edges_db = result.scalars().all()

    edges = [
        EdgeResponse(source=e.source_path, target=e.target_path, type=e.edge_type)
        for e in edges_db
    ]

    return GraphResponse(
        repo_id=repo.id,
        repo_name=f"{repo.owner}/{repo.name}",
        nodes=nodes,
        edges=edges,
    )
from app.services import summarizer

@router.post("/files/{node_id}/summary")
async def get_node_summary(node_id: int, db: AsyncSession = Depends(get_db)):
    """Generate or retrieve AI summary for a specific file node."""
    node = await db.get(FileNode, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    if node.summary:
        return {"summary": node.summary}
    
    if not node.content:
        raise HTTPException(status_code=400, detail="Node has no content to summarize")
    
    try:
        summary = await summarizer.summarize_file(node.path, node.content)
        node.summary = summary
        await db.commit()
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
