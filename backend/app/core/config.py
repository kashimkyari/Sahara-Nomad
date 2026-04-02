from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sahara Nomad API"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = "your-secret-key-change-this-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sahara_nomad"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    DATABASE_URL: Optional[str] = None

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.SQLALCHEMY_DATABASE_URI:
            return self.SQLALCHEMY_DATABASE_URI
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    EXPO_ACCESS_TOKEN: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
