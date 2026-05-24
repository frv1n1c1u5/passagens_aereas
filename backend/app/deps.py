from __future__ import annotations

from functools import lru_cache

from amadeus import Client

from .config import Settings, get_settings


@lru_cache(maxsize=1)
def get_amadeus_client() -> Client:
    settings: Settings = get_settings()
    if not settings.amadeus_client_id or not settings.amadeus_client_secret:
        raise RuntimeError(
            "AMADEUS_CLIENT_ID e AMADEUS_CLIENT_SECRET precisam estar definidos no .env"
        )
    return Client(
        client_id=settings.amadeus_client_id,
        client_secret=settings.amadeus_client_secret,
        hostname=settings.amadeus_env,
    )
