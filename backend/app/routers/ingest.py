"""
CodeGalaxy Backend - Ingest Router
Handles repository ingestion pipeline execution.
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import get_db, Repository, FileNode, Edge
from app.models.schemas import IngestRequest, IngestStatusResponse
from app.services import github, parser, embeddings, analyzer, reducer

router = APIRouter(prefix="/api", tags=["ingest"])


async def _run_pipeline(repo_id: int, owner: str, repo: str, branch: str):
    """
    Background task that runs the full ingestion pipeline:
    1. Fetch repo tree from GitHub
    2. Download file contents
    3. Parse AST (imports, functions, classes)
    4. Generate embeddings
    5. Reduce to 3D coordinates
    6. Compute risk scores
    """
    from app.models.database import async_session

    async with async_session() as db:
        try:
            # Update status
            repo_obj = await db.get(Repository, repo_id)
            repo_obj.status = "processing"
            await db.commit()

            # 1. Fetch file tree
            tree = await github.fetch_repo_tree(owner, repo, branch)
            repo_obj.total_files = len(tree)
            await db.commit()

            if not tree:
                repo_obj.status = "error"
                await db.commit()
                return

            # 2. Download content & parse concurrently
            file_nodes = []
            all_paths = [f["path"] for f in tree]

            # Fetch all file contents using batch concurrent downloader
            contents_dict = await github.fetch_file_content_batch(owner, repo, all_paths, branch)

            for i, file_info in enumerate(tree):
                path = file_info["path"]
                content = contents_dict.get(path)
                if not content:
                    continue

                parsed = parser.parse_file(path, content)

                node = FileNode(
                    repo_id=repo_id,
                    path=path,
                    filename=path.split("/")[-1],
                    language=parsed["language"],
                    sha=file_info["sha"],
                    content=content,
                    loc=parsed["loc"],
                    imports=parsed["imports"],
                    functions=parsed["functions"],
                    classes=parsed["classes"],
                    function_count=len(parsed["functions"]),
                )
                file_nodes.append(node)
                db.add(node)

                repo_obj.processed_files = i + 1
                if (i + 1) % 50 == 0:
                    await db.commit()

            await db.commit()

            # 3. Resolve dependency edges
            repo_obj.status = "resolving imports"
            await db.commit()
            for node in file_nodes:
                source_dir = "/".join(node.path.split("/")[:-1])
                for imp in (node.imports or []):
                    target_path = parser.resolve_import_to_path(imp, all_paths, source_dir)
                    if target_path and target_path != node.path:
                        edge = Edge(
                            repo_id=repo_id,
                            source_path=node.path,
                            target_path=target_path,
                            edge_type="import",
                        )
                        db.add(edge)
            await db.commit()

            # 4. Generate embeddings
            repo_obj.status = "embedding vectors"
            await db.commit()
            contents = [n.content for n in file_nodes if n.content]
            if contents:
                emb_vectors = await embeddings.embed_batch(contents)
                for node, emb in zip(file_nodes, emb_vectors):
                    node.embedding = emb

                await db.commit()

                # 5. Reduce to 3D
                repo_obj.status = "computing 3D space"
                await db.commit()
                valid_embeddings = [n.embedding for n in file_nodes if n.embedding]
                if valid_embeddings:
                    coords = reducer.reduce_to_3d(valid_embeddings)
                    idx = 0
                    for node in file_nodes:
                        if node.embedding:
                            node.x = coords[idx]["x"]
                            node.y = coords[idx]["y"]
                            node.z = coords[idx]["z"]
                            idx += 1

            # 6. Compute risk scores
            repo_obj.status = "analyzing code health"
            await db.commit()
            for node in file_nodes:
                node.todo_count = analyzer.count_markers(node.content or "")
                node.complexity = analyzer.compute_cyclomatic_complexity(
                    node.content or "", node.language
                )
                node.risk_score = analyzer.compute_risk_score(
                    complexity=node.complexity,
                    loc=node.loc,
                    todo_count=node.todo_count,
                    function_count=node.function_count,
                    import_count=len(node.imports or []),
                )

            repo_obj.status = "done"
            await db.commit()

        except Exception as e:
            repo_obj = await db.get(Repository, repo_id)
            if repo_obj:
                repo_obj.status = "error"
                await db.commit()
            print(f"Pipeline error: {e}")
            raise


@router.post("/ingest")
async def ingest_repo(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Start ingestion of a GitHub repository."""
    # 1. Quickly validate the repo and branch exist before starting pipeline
    if not await github.check_repo_exists(request.owner, request.repo, request.branch):
        raise HTTPException(
            status_code=404, 
            detail=f"Repository {request.owner}/{request.repo} or branch '{request.branch}' not found. Please check spelling."
        )

    repo = Repository(
        owner=request.owner,
        name=request.repo,
        branch=request.branch,
        status="pending",
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    background_tasks.add_task(_run_pipeline, repo.id, request.owner, request.repo, request.branch)

    return {"repo_id": repo.id, "status": "pending", "message": "Ingestion started"}


@router.get("/ingest/{repo_id}/status", response_model=IngestStatusResponse)
async def get_ingest_status(repo_id: int, db: AsyncSession = Depends(get_db)):
    """Get the status of an ingestion job."""
    repo = await db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    total = max(repo.total_files, 1)
    return IngestStatusResponse(
        repo_id=repo.id,
        status=repo.status,
        total_files=repo.total_files,
        processed_files=repo.processed_files,
        progress=round(repo.processed_files / total * 100, 1),
    )
