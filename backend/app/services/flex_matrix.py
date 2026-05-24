from __future__ import annotations

import asyncio
import logging
from datetime import date, timedelta
from typing import Any

from amadeus import Client, ResponseError

from ..cache import flex_cache, stable_key
from ..config import get_settings
from ..schemas.flexible import FlexMatrixRequest, FlexMatrixResponse, MatrixCell
from .amadeus_client import Semaphored, amadeus_payload, call_amadeus

log = logging.getLogger(__name__)


def _date_range(center: date, window: int) -> list[date]:
    return [center + timedelta(days=delta) for delta in range(-window, window + 1)]


def _band_pairs(
    dep_center: date, ret_center: date, window: int, band: int
) -> list[tuple[date, date]]:
    """Generate (dep, ret) pairs near the diagonal — keeps trip length ~constant."""
    pairs: list[tuple[date, date]] = []
    for dep in _date_range(dep_center, window):
        dep_offset = (dep - dep_center).days
        for ret in _date_range(ret_center, window):
            ret_offset = (ret - ret_center).days
            if abs(ret_offset - dep_offset) <= band and ret >= dep:
                pairs.append((dep, ret))
    return pairs


async def _try_flight_dates(
    client: Client, req: FlexMatrixRequest
) -> FlexMatrixResponse | None:
    """Try the native Flight Cheapest Date Search. Returns None if unavailable for this O&D."""
    params: dict[str, Any] = {
        "origin": req.origin.upper(),
        "destination": req.destination.upper(),
        "departureDate": req.departure_date.isoformat(),
        "oneWay": "false" if req.return_date else "true",
    }
    if req.return_date:
        params["returnDate"] = req.return_date.isoformat()

    try:
        raw = await call_amadeus(client.shopping.flight_dates, **params)
    except ResponseError as exc:
        status = getattr(exc.response, "status_code", None)
        if status in {400, 404}:
            return None
        raise

    payload = amadeus_payload(raw)
    data = payload.get("data", []) or []
    if not data:
        return None

    cells: list[MatrixCell] = []
    for item in data:
        price = item.get("price", {}).get("total")
        ret_iso = item.get("returnDate")
        cells.append(
            MatrixCell(
                departure_date=date.fromisoformat(item["departureDate"]),
                return_date=date.fromisoformat(ret_iso) if ret_iso else None,
                price=float(price) if price is not None else None,
                currency=(payload.get("meta") or {}).get("currency"),
            )
        )
    return FlexMatrixResponse(cells=cells, days_window=req.days_window, source="flight_dates")


async def _fallback_offers(
    client: Client, req: FlexMatrixRequest
) -> FlexMatrixResponse:
    settings = get_settings()
    sem = Semaphored(client, settings.max_parallel_amadeus)

    one_way = req.return_date is None
    if one_way:
        pairs = [(d, None) for d in _date_range(req.departure_date, req.days_window)]
    else:
        assert req.return_date is not None
        pairs_raw = _band_pairs(
            req.departure_date, req.return_date, req.days_window, settings.flex_matrix_band
        )
        pairs = [(dep, ret) for dep, ret in pairs_raw]

    async def _one(dep: date, ret: date | None) -> MatrixCell:
        params: dict[str, Any] = {
            "originLocationCode": req.origin.upper(),
            "destinationLocationCode": req.destination.upper(),
            "departureDate": dep.isoformat(),
            "adults": req.adults,
            "currencyCode": req.currency.upper(),
            "max": 1,
        }
        if ret:
            params["returnDate"] = ret.isoformat()
        try:
            raw = await sem.call(client.shopping.flight_offers_search, **params)
        except ResponseError:
            return MatrixCell(departure_date=dep, return_date=ret, price=None, currency=None)
        payload = amadeus_payload(raw)
        offers = payload.get("data", []) or []
        if not offers:
            return MatrixCell(departure_date=dep, return_date=ret, price=None, currency=None)
        cheapest = min(offers, key=lambda o: float(o["price"]["grandTotal"]))
        return MatrixCell(
            departure_date=dep,
            return_date=ret,
            price=float(cheapest["price"]["grandTotal"]),
            currency=cheapest["price"]["currency"],
            offer_id=str(cheapest.get("id")),
        )

    cells = await asyncio.gather(*(_one(dep, ret) for dep, ret in pairs))
    return FlexMatrixResponse(
        cells=list(cells),
        days_window=req.days_window,
        source="offers_fallback",
    )


async def build_flex_matrix(client: Client, req: FlexMatrixRequest) -> FlexMatrixResponse:
    cache = flex_cache()
    key = stable_key("flex", req.model_dump(mode="json"))
    cached = cache.get(key)
    if cached is not None:
        return FlexMatrixResponse.model_validate(cached)

    native = await _try_flight_dates(client, req)
    result = native if native is not None else await _fallback_offers(client, req)
    cache[key] = result.model_dump(mode="json")
    return result
