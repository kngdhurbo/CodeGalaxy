"""
CodeGalaxy Backend - High-Speed local Ingestor
Uses GitPython to clone repositories and traverse them locally.
"""
import os
import shutil
import tempfile
import asyncio
from git import Repo
from app.config import settings

def clone_repo(github_url: str) -> str:
    """
    Clones a GitHub repository to a temporary directory.
    Returns the path to the cloned repository.
    """
    temp_dir = tempfile.mkdtemp(prefix="codegalaxy_")
    try:
        Repo.clone_from(github_url, temp_dir, depth=1)
        return temp_dir
    except Exception as e:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError(f"Failed to clone repository: {e}")

async def get_source_files(repo_path: str):
    """
    Traverses the cloned repository and returns file data.
    Uses aggressive filtering and hierarchical grouping for the Galaxy view.
    """
    source_files = []
    
    # Aggressive ignore lists from teammate's version
    ignore_dirs = {
        '.git', '.github', 'node_modules', 'venv', 'env', 
        '__pycache__', 'dist', 'build', 'public', 'assets', 
        '.next', 'target', '.idea', '.vscode'
    }
    ignore_extensions = {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', 
        '.mp4', '.pdf', '.zip', '.tar', '.gz', '.exe', 
        '.dll', '.so', '.woff', '.woff2', '.ttf', '.eot'
    }
    
    # Supported extensions from app settings
    supported = set(settings.supported_extensions)

    def _sync_walk():
        files_data = []
        for root, dirs, files in os.walk(repo_path):
            # Prune ignore_dirs in-place to prevent os.walk from descending
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in ignore_extensions:
                    continue
                if ext not in supported:
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
                
                try:
                    # Content capping to 10KB as per teammate's tech
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read(10000) 
                    
                    files_data.append({
                        "path": rel_path,
                        "content": content,
                        "size": os.path.getsize(full_path),
                        "sha": "local_import" # We don't need real SHA for local clone
                    })
                except Exception as e:
                    print(f"Skipping {rel_path} due to error: {e}")
                    
        return files_data

    return await asyncio.to_thread(_sync_walk)

def cleanup_repo(repo_path: str):
    """Removes the temporary repository directory."""
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path, ignore_errors=True)
