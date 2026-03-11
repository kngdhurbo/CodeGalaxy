"""
CodeGalaxy Backend - Dimensionality Reducer
Reduces high-dimensional embeddings to 3D coordinates using UMAP.
"""
import numpy as np
from app.config import settings


def reduce_to_3d(embeddings: list[list[float]]) -> list[dict]:
    """
    Takes a list of embedding vectors and reduces them to 3D coordinates.
    Returns list of {x, y, z} dicts.
    
    Uses UMAP for >=15 points, PCA for 5-14 points, and random for <5 points.
    """
    embedding_matrix = np.array(embeddings)
    n_samples = embedding_matrix.shape[0]

    if n_samples == 0:
        return []

    if n_samples == 1:
        return [{"x": 0.0, "y": 0.0, "z": 0.0}]

    if n_samples < 5:
        # Too few points for meaningful reduction, scatter randomly
        coords = np.random.uniform(
            -settings.coord_range * 0.3,
            settings.coord_range * 0.3,
            size=(n_samples, 3)
        )
    elif n_samples < 15:
        # Use PCA for small datasets
        from sklearn.decomposition import PCA
        n_components = min(3, n_samples, embedding_matrix.shape[1])
        pca = PCA(n_components=n_components)
        coords = pca.fit_transform(embedding_matrix)
        if n_components < 3:
            padding = np.zeros((n_samples, 3 - n_components))
            coords = np.hstack([coords, padding])
    else:
        # Use UMAP for larger datasets
        from umap import UMAP
        reducer = UMAP(
            n_components=3,
            n_neighbors=min(settings.umap_n_neighbors, n_samples - 1),
            min_dist=settings.umap_min_dist,
            spread=settings.umap_spread,
            metric="cosine",
            random_state=42,
        )
        coords = reducer.fit_transform(embedding_matrix)

    # Normalize to bounded 3D space [-coord_range, coord_range]
    coords = _normalize_coords(coords, settings.coord_range)

    return [
        {"x": float(coords[i, 0]), "y": float(coords[i, 1]), "z": float(coords[i, 2])}
        for i in range(n_samples)
    ]


def _normalize_coords(coords: np.ndarray, bound: float) -> np.ndarray:
    """Normalize coordinates to fit within [-bound, bound] per axis."""
    for axis in range(3):
        col = coords[:, axis]
        col_min, col_max = col.min(), col.max()
        if col_max - col_min > 1e-6:
            coords[:, axis] = (col - col_min) / (col_max - col_min) * 2 * bound - bound
        else:
            coords[:, axis] = 0.0
    return coords
