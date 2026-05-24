from __future__ import annotations

import re
from typing import Any

from ..schemas.offers import FlightOffer, Itinerary, Segment

_ISO_DURATION = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?")


def iso_duration_to_minutes(value: str | None) -> int:
    if not value:
        return 0
    m = _ISO_DURATION.fullmatch(value)
    if not m:
        return 0
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    return hours * 60 + minutes


def _carrier_name(code: str, dictionaries: dict[str, Any]) -> str | None:
    carriers = (dictionaries or {}).get("carriers", {})
    name = carriers.get(code)
    return name if isinstance(name, str) else None


def normalize_offer(raw: dict[str, Any], dictionaries: dict[str, Any]) -> FlightOffer:
    itineraries: list[Itinerary] = []
    for it in raw.get("itineraries", []):
        segments = [
            Segment(
                origin=seg["departure"]["iataCode"],
                destination=seg["arrival"]["iataCode"],
                depart_at=seg["departure"]["at"],
                arrive_at=seg["arrival"]["at"],
                carrier_code=seg["carrierCode"],
                carrier_name=_carrier_name(seg["carrierCode"], dictionaries),
                flight_number=str(seg.get("number", "")),
                duration_minutes=iso_duration_to_minutes(seg.get("duration")),
            )
            for seg in it.get("segments", [])
        ]
        itineraries.append(
            Itinerary(
                duration_minutes=iso_duration_to_minutes(it.get("duration")),
                stops=max(len(segments) - 1, 0),
                segments=segments,
            )
        )

    price = raw["price"]
    return FlightOffer(
        id=str(raw["id"]),
        price={
            "total": float(price["grandTotal"]),
            "currency": price["currency"],
        },
        itineraries=itineraries,
        validating_airlines=list(raw.get("validatingAirlineCodes", [])),
    )


def normalize_offers(payload: dict[str, Any]) -> list[FlightOffer]:
    data = payload.get("data", []) or []
    dictionaries = payload.get("dictionaries", {}) or {}
    return [normalize_offer(o, dictionaries) for o in data]
