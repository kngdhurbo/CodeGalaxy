"""
CodeGalaxy Backend - Embedding Service
Generates vector embeddings for code files using local or OpenAI models.
"""
import numpy as np
from typing import Optional
from app.config import settings


# ─── Chunking helper ───────────────────────────────────────

def chunk_code(content: str, max_tokens: int = 512) -> list[str]:
    """
    Split code content into chunks of roughly max_tokens words.
    """
    lines = content.splitlines()
    chunks = []
    current_chunk = []
    current_length = 0

    for line in lines:
        word_count = len(line.split())
        if current_length + word_count > max_tokens and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = []
            current_length = 0
        current_chunk.append(line)
        current_length += word_count

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks if chunks else [content[:1000]]


# ─── Embedding backends ───────────────────────────────────

_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _local_model


async def embed_local(texts: list[str]) -> np.ndarray:
    """Embed using local sentence-transformers model."""
    model = _get_local_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    return np.array(embeddings)


async def embed_openrouter(texts: list[str]) -> np.ndarray:
    """Embed using OpenRouter API (OpenAI-compatible endpoint)."""
    import httpx

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "input": texts,
                "model": "openai/text-embedding-3-small",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        embeddings = [item["embedding"] for item in data["data"]]
        return np.array(embeddings)


# ─── Main entry point ─────────────────────────────────────

async def embed_file(content: str) -> list[float]:
    """
    Generate a single embedding vector for a source code file.
    Chunks the file, embeds each chunk, and averages.
    """
    chunks = chunk_code(content)

    if settings.embedding_model == "openrouter" and settings.openrouter_api_key:
        embeddings = await embed_openrouter(chunks)
    else:
        embeddings = await embed_local(chunks)

    # Average all chunk embeddings into a single file vector
    file_embedding = np.mean(embeddings, axis=0)
    return file_embedding.tolist()


async def embed_batch(contents: list[str]) -> list[list[float]]:
    """
    Embed multiple files at once. Returns list of embedding vectors.
    """
    all_chunks = []
    chunk_indices = []  # Maps chunk -> file index

    for i, content in enumerate(contents):
        chunks = chunk_code(content)
        for chunk in chunks:
            all_chunks.append(chunk)
            chunk_indices.append(i)

    if not all_chunks:
        return [[] for _ in contents]

    # Embed all chunks in one batch
    if settings.embedding_model == "openrouter" and settings.openrouter_api_key:
        # OpenRouter has batch limits, chunk the request
        batch_size = 100
        all_embeddings = []
        for j in range(0, len(all_chunks), batch_size):
            batch = all_chunks[j:j + batch_size]
            emb = await embed_openrouter(batch)
            all_embeddings.append(emb)
        all_embeddings = np.vstack(all_embeddings)
    else:
        all_embeddings = await embed_local(all_chunks)

    # Average embeddings per file
    results = []
    for i in range(len(contents)):
        file_mask = [j for j, idx in enumerate(chunk_indices) if idx == i]
        if file_mask:
            file_emb = np.mean(all_embeddings[file_mask], axis=0)
            results.append(file_emb.tolist())
        else:
            results.append([])

    return results
