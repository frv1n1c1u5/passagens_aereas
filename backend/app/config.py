from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    amadeus_client_id: str = ""
    amadeus_client_secret: str = ""
    amadeus_env: Literal["test", "production"] = "test"

    default_currency: str = "BRL"
    max_parallel_amadeus: int = 4
    flex_matrix_band: int = 1
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
