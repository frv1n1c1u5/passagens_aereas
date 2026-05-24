from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from typing import Any

from cachetools import TTLCache
from diskcache import Cache as DiskCache


@lru_cache(maxsize=1)
def location_cache() -> DiskCache:
    return DiskCache("/tmp/amadeus-locations", size_limit=int(50e6))


@lru_cache(maxsize=1)
def offers_cache() -> TTLCache[str, Any]:
    return TTLCache(maxsize=512, ttl=300)


@lru_cache(maxsize=1)
def flex_cache() -> TTLCache[str, Any]:
    return TTLCache(maxsize=256, ttl=3600)


def stable_key(prefix: str, payload: dict[str, Any]) -> str:
    blob = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha256(blob.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"
