from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://kyt:kyt@db:5432/kyt_space"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
