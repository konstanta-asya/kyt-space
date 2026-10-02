from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://kyt:kyt@db:5432/kyt_space"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    # Звідки браузеру дозволено звертатись до API (фронт на Vite dev-сервері).
    # У .env задається JSON-списком: CORS_ORIGINS=["http://localhost:5173"]
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
