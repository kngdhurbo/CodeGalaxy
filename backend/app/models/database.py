"""
CodeGalaxy Backend - Database Models (SQLAlchemy)
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from datetime import datetime, timezone
from app.config import settings

Base = declarative_base()


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner = Column(String, nullable=False)
    name = Column(String, nullable=False)
    branch = Column(String, default="main")
    status = Column(String, default="pending")  # pending, processing, done, error
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    files = relationship("FileNode", back_populates="repository", cascade="all, delete-orphan")
    edges = relationship("Edge", back_populates="repository", cascade="all, delete-orphan")


class FileNode(Base):
    __tablename__ = "file_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    path = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    language = Column(String, default="unknown")
    sha = Column(String, nullable=True)

    # Content
    content = Column(Text, nullable=True)
    loc = Column(Integer, default=0)  # Lines of code

    # 3D coordinates (from UMAP)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    z = Column(Float, default=0.0)

    # Metrics
    complexity = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    todo_count = Column(Integer, default=0)
    function_count = Column(Integer, default=0)

    # Embedding stored as JSON array
    embedding = Column(JSON, nullable=True)

    # Parsed data
    imports = Column(JSON, default=list)
    functions = Column(JSON, default=list)
    classes = Column(JSON, default=list)

    repository = relationship("Repository", back_populates="files")


class Edge(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    source_path = Column(String, nullable=False)
    target_path = Column(String, nullable=False)
    edge_type = Column(String, default="import")  # import, call, inheritance

    repository = relationship("Repository", back_populates="edges")


# ─── Database Engine ───────────────────────────────────────

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """Dependency for FastAPI routes."""
    async with async_session() as session:
        yield session
