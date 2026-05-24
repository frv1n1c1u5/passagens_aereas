from __future__ import annotations

import logging

from amadeus import ResponseError
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

log = logging.getLogger(__name__)


class UpstreamError(Exception):
    def __init__(self, status: int, code: str, title: str, detail: str | None = None) -> None:
        self.status = status
        self.code = code
        self.title = title
        self.detail = detail


def register_handlers(app: FastAPI) -> None:
    @app.exception_handler(ResponseError)
    async def amadeus_handler(_req: Request, exc: ResponseError) -> JSONResponse:
        status = getattr(exc.response, "status_code", 502) or 502
        body = {
            "code": "amadeus_error",
            "title": "Amadeus upstream error",
            "detail": str(exc),
        }
        log.warning("amadeus error status=%s detail=%s", status, body["detail"])
        if status == 429:
            return JSONResponse(status_code=503, content=body, headers={"Retry-After": "5"})
        return JSONResponse(status_code=502, content=body)

    @app.exception_handler(UpstreamError)
    async def upstream_handler(_req: Request, exc: UpstreamError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status,
            content={"code": exc.code, "title": exc.title, "detail": exc.detail},
        )
