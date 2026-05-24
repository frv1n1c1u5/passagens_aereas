from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .exceptions import register_handlers
from .routers import flexible, health, locations, offers


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)

    app = FastAPI(
        title="Passagens Aéreas API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url=None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_handlers(app)

    prefix = "/api/v1"
    app.include_router(health.router, prefix=prefix)
    app.include_router(locations.router, prefix=prefix)
    app.include_router(offers.router, prefix=prefix)
    app.include_router(flexible.router, prefix=prefix)

    return app


app = create_app()
