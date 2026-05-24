from __future__ import annotations

from typing import Any

from amadeus import Client

from ..cache import location_cache, stable_key
from ..schemas.locations import Location, LocationsResponse
from .amadeus_client import amadeus_payload, call_amadeus


def _normalize(raw: list[dict[str, Any]]) -> list[Location]:
    out: list[Location] = []
    for item in raw:
        sub = item.get("subType")
        if sub not in {"AIRPORT", "CITY"}:
            continue
        iata = item.get("iataCode")
        if not iata:
            continue
        address = item.get("address") or {}
        out.append(
            Location(
                iata=iata,
                name=item.get("name", iata),
                city=address.get("cityName") or item.get("name"),
                country=address.get("countryName"),
                sub_type=sub,
            )
        )
    return out


async def search_locations(client: Client, keyword: str, limit: int) -> LocationsResponse:
    cache = location_cache()
    key = stable_key("loc", {"k": keyword.lower().strip(), "n": limit})
    cached = cache.get(key)
    if cached is not None:
        return LocationsResponse(items=[Location.model_validate(x) for x in cached])

    raw = await call_amadeus(
        client.reference_data.locations,
        keyword=keyword,
        subType="AIRPORT,CITY",
        **{"page[limit]": limit},
    )
    payload = amadeus_payload(raw)
    items = _normalize(payload.get("data", []))
    cache.set(key, [x.model_dump() for x in items], expire=7 * 24 * 3600)
    return LocationsResponse(items=items)
