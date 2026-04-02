from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=True,
    future=True
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    async with SessionLocal() as session:
        yield session
