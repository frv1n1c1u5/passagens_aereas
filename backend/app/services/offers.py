from __future__ import annotations

from typing import Any

from amadeus import Client

from ..cache import offers_cache, stable_key
from ..normalizers.offers import normalize_offers
from ..schemas.offers import FlightOffer, SearchRequest, SearchResponse
from .amadeus_client import amadeus_payload, call_amadeus


def _build_params(req: SearchRequest) -> dict[str, Any]:
    params: dict[str, Any] = {
        "originLocationCode": req.origin.upper(),
        "destinationLocationCode": req.destination.upper(),
        "departureDate": req.departure_date.isoformat(),
        "adults": req.adults,
        "currencyCode": req.currency.upper(),
        "max": req.max_results,
    }
    if req.return_date:
        params["returnDate"] = req.return_date.isoformat()
    if req.children:
        params["children"] = req.children
    if req.infants:
        params["infants"] = req.infants
    if req.cabin:
        params["travelClass"] = req.cabin
    if req.non_stop:
        params["nonStop"] = "true"
    if req.max_stops is not None:
        params["maxStops"] = req.max_stops
    return params


async def search_offers(client: Client, req: SearchRequest) -> SearchResponse:
    cache = offers_cache()
    params = _build_params(req)
    key = stable_key("offers", params)
    cached = cache.get(key)
    if cached is not None:
        offers = [FlightOffer.model_validate(x) for x in cached["offers"]]
        return SearchResponse(offers=offers, currency=cached["currency"])

    raw = await call_amadeus(client.shopping.flight_offers_search, **params)
    payload = amadeus_payload(raw)
    offers = normalize_offers(payload)

    cache[key] = {
        "offers": [o.model_dump() for o in offers],
        "currency": req.currency.upper(),
    }
    return SearchResponse(offers=offers, currency=req.currency.upper())
