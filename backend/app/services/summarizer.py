"""
CodeGalaxy Backend - Summarizer Service
Uses LLMs to generate concise summaries of source code files.
"""
import httpx
from app.config import settings

async def summarize_file(filename: str, content: str) -> str:
    """
    Generate a 1-sentence summary of what a file does.
    """
    if not settings.openrouter_api_key:
        return f"Source code file: {filename}"

    # Truncate content if too long for a quick summary
    snippet = content[:2000]
    
    prompt = f"Summarize what this file does in ONE SHORT sentence (max 15 words). File: {filename}\n\nContent:\n{snippet}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "google/gemini-2.0-flash-lite-preview-02-05:free", # Using a fast, free/low-cost model
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }
            )
            
            if resp.status_code == 200:
                data = resp.json()
                summary = data["choices"][0]["message"]["content"].strip()
                # Clean up any quotes if the LLM adds them
                return summary.strip('"').strip("'")
            else:
                print(f"Summarization API error: {resp.text}")
                return f"Source code file: {filename}"
    except Exception as e:
        print(f"Summarization error: {e}")
        return f"Source code file: {filename}"

async def get_importance_score(filename: str, content: str, loc: int) -> float:
    """
    Calculate a simple importance score based on filenames and LOC.
    """
    score = 1.0
    
    # Core architectural files
    core_keywords = ["main", "app", "index", "core", "router", "model", "server"]
    if any(k in filename.lower() for k in core_keywords):
        score += 1.5
        
    # Complexity bonus
    if loc > 100:
        score += 0.5
    if loc > 500:
        score += 1.0
        
    return min(float(score), 5.0)
