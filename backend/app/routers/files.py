"""
CodeGalaxy Backend - Files Router
Returns detailed file information for the side panel.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import httpx
from app.config import settings

from app.models.database import get_db, FileNode, Edge
from app.models.schemas import FileDetailResponse

router = APIRouter(prefix="/api", tags=["files"])


@router.get("/files/{file_id}", response_model=FileDetailResponse)
async def get_file_detail(file_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed information about a specific file node."""
    file_node = await db.get(FileNode, file_id)
    if not file_node:
        raise HTTPException(status_code=404, detail="File not found")

    # Compute Fan-In (files that import this one)
    fan_in_query = select(func.count(Edge.id)).where(
        Edge.repo_id == file_node.repo_id,
        Edge.target_path == file_node.path
    )
    fan_in = await db.scalar(fan_in_query)

    # Compute Fan-Out (files this one imports)
    fan_out_query = select(func.count(Edge.id)).where(
        Edge.repo_id == file_node.repo_id,
        Edge.source_path == file_node.path
    )
    fan_out = await db.scalar(fan_out_query)

    return FileDetailResponse(
        id=file_node.id,
        path=file_node.path,
        filename=file_node.filename,
        language=file_node.language,
        content=file_node.content,
        loc=file_node.loc,
        complexity=round(file_node.complexity, 2),
        risk_score=file_node.risk_score,
        todo_count=file_node.todo_count,
        function_count=file_node.function_count,
        imports=file_node.imports or [],
        functions=file_node.functions or [],
        classes=file_node.classes or [],
        fan_in=fan_in or 0,
        fan_out=fan_out or 0,
    )

@router.post("/files/{file_id}/summary")
async def generate_file_summary(file_id: int, db: AsyncSession = Depends(get_db)):
    """Generate a brief 2-3 sentence summary of the file using OpenRouter/OpenAI API."""
    file_node = await db.get(FileNode, file_id)
    if not file_node:
        raise HTTPException(status_code=404, detail="File not found")

    if not file_node.content:
        return {"summary": "No raw code available for this file."}

    # If OpenRouter key is set, use it; otherwise fallback to OpenAI key, or default demo
    api_key = settings.openrouter_api_key
    base_url = "https://openrouter.ai/api/v1/chat/completions"
    model = "google/gemini-2.5-flash"
    
    if not api_key:
         api_key = settings.openai_api_key
         base_url = "https://api.openai.com/v1/chat/completions"
         model = "gpt-4o-mini"
         if not api_key:
             return {"summary": "Please set OPENROUTER_API_KEY or OPENAI_API_KEY in the backend .env file to enable AI summaries."}

    prompt = f"""You are a senior software architect. Provide a concise, 2-3 sentence plain-English summary explaining the primary purpose of this file within the repository.
Analyze its imports and exports to understand its role. Do NOT list the functions. Explain *why* it exists.

File path: {file_node.path}
Language: {file_node.language}

Code:
```
{file_node.content[:8000]} 
```
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You provide extremely clear, concise architectural intuition about code files."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 150
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            summary = data["choices"][0]["message"]["content"].strip()
            return {"summary": summary}
            
    except Exception as e:
        print(f"Error generating summary: {e}")
        return {"summary": f"Failed to generate AI summary. Status: {getattr(e, 'response', 'Network Error')}."}
