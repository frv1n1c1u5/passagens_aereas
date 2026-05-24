from __future__ import annotations

import asyncio
import logging
from typing import Any

from amadeus import Client, ResponseError
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential_jitter,
)

log = logging.getLogger(__name__)


def _is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, ResponseError):
        status = getattr(exc.response, "status_code", None)
        return status in {429, 500, 502, 503, 504}
    return False


async def call_amadeus(fn: Any, /, **params: Any) -> dict[str, Any]:
    """Run a synchronous Amadeus SDK call in a threadpool, with retry on transient errors."""

    @retry(
        retry=retry_if_exception(_is_retryable),
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=1, max=8, jitter=1),
        reraise=True,
    )
    def _do() -> dict[str, Any]:
        response = fn.get(**params)
        return {"data": response.data, "result": response.result}

    return await asyncio.to_thread(_do)


def amadeus_payload(raw: dict[str, Any]) -> dict[str, Any]:
    """Extract the full Amadeus payload (data + dictionaries + meta) from call_amadeus result."""
    return raw.get("result", {}) or {"data": raw.get("data", [])}


class Semaphored:
    """Wrap a client so concurrent requests respect a shared semaphore."""

    def __init__(self, client: Client, max_parallel: int) -> None:
        self.client = client
        self._sem = asyncio.Semaphore(max_parallel)

    async def call(self, fn: Any, /, **params: Any) -> dict[str, Any]:
        async with self._sem:
            try:
                return await call_amadeus(fn, **params)
            except ResponseError as exc:
                status = getattr(exc.response, "status_code", "?")
                log.info("amadeus call failed status=%s params=%s", status, params)
                raise
