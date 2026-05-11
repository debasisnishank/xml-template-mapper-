import os
from pathlib import Path


class Settings:
    cors_origins: list[str]
    data_dir: Path

    def __init__(self) -> None:
        origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        self.cors_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
        self.data_dir = Path(os.getenv("DATA_DIR", "./data")).resolve()
        (self.data_dir / "templates").mkdir(parents=True, exist_ok=True)


settings = Settings()
