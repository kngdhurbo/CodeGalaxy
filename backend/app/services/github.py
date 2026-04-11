"""
CodeGalaxy Backend - GitHub API Service
Fetches repository file tree and content from GitHub.
"""
import httpx
import os
import asyncio
from typing import Optional
from app.config import settings

GITHUB_API = "https://api.github.com"


def _headers():
    h = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


async def check_repo_exists(owner: str, repo: str, branch: str = "main") -> bool:
    """Check if the repo and branch exist."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        ref_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}"
        resp = await client.get(ref_url, headers=_headers())
        return resp.status_code == 200


async def fetch_repo_tree(owner: str, repo: str, branch: str = "main") -> list[dict]:
    """
    Fetch the full file tree of a repository.
    Returns list of: { path, sha, size, type }
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get the branch HEAD SHA
        ref_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}"
        ref_resp = await client.get(ref_url, headers=_headers())
        
        if ref_resp.status_code == 404:
            raise ValueError(f"Repository {owner}/{repo} or branch {branch} not found.")
        ref_resp.raise_for_status()
        
        commit_sha = ref_resp.json()["object"]["sha"]

        # Get full recursive tree
        tree_url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{commit_sha}?recursive=1"
        tree_resp = await client.get(tree_url, headers=_headers())
        tree_resp.raise_for_status()
        tree_data = tree_resp.json()

        files = []
        for item in tree_data.get("tree", []):
            if item["type"] == "blob":
                ext = os.path.splitext(item["path"])[1].lower()
                if ext in settings.supported_extensions:
                    files.append({
                        "path": item["path"],
                        "sha": item["sha"],
                        "size": item.get("size", 0),
                    })

        return files


async def fetch_file_content_batch(owner: str, repo: str, paths: list[str], branch: str = "main", max_concurrent: int = 100) -> dict[str, str]:
    """
    Fetch multiple files concurrently using a semaphore.
    Returns { path: content }.
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    results = {}

    async def fetch_single(client, path: str):
        async with semaphore:
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            try:
                # Need longer timeout for raw content on big repos
                resp = await client.get(url, headers=_headers(), timeout=45.0)
                if resp.status_code == 200:
                    results[path] = resp.text
            except Exception as e:
                print(f"Error fetching {path}: {e}")

    # Use a single client with increased connection limits
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=20)
    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [fetch_single(client, p) for p in paths]
        await asyncio.gather(*tasks)

    return results
