from __future__ import annotations

import asyncio
import calendar
import logging
from datetime import date, timedelta
from typing import Any

from amadeus import Client, ResponseError

from ..cache import flex_cache, stable_key
from ..config import get_settings
from ..schemas.flexible import CheapestMonthRequest, CheapestMonthResponse, MonthDay
from .amadeus_client import Semaphored, amadeus_payload, call_amadeus

log = logging.getLogger(__name__)


def _month_days(month: str) -> list[date]:
    year, mo = map(int, month.split("-"))
    last = calendar.monthrange(year, mo)[1]
    return [date(year, mo, d) for d in range(1, last + 1)]


async def _try_flight_dates(
    client: Client, req: CheapestMonthRequest
) -> CheapestMonthResponse | None:
    days = _month_days(req.month)
    first, last = days[0], days[-1]
    params: dict[str, Any] = {
        "origin": req.origin.upper(),
        "destination": req.destination.upper(),
        "departureDate": f"{first.isoformat()},{last.isoformat()}",
        "oneWay": "true" if req.trip_duration_days is None else "false",
    }
    if req.trip_duration_days is not None:
        params["duration"] = req.trip_duration_days

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

    out: list[MonthDay] = []
    for item in data:
        price = item.get("price", {}).get("total")
        ret_iso = item.get("returnDate")
        out.append(
            MonthDay(
                departure_date=date.fromisoformat(item["departureDate"]),
                return_date=date.fromisoformat(ret_iso) if ret_iso else None,
                price=float(price) if price is not None else None,
                currency=(payload.get("meta") or {}).get("currency"),
            )
        )
    cheapest = _pick_cheapest(out)
    return CheapestMonthResponse(days=out, source="flight_dates", cheapest=cheapest)


async def _fallback(
    client: Client, req: CheapestMonthRequest
) -> CheapestMonthResponse:
    settings = get_settings()
    sem = Semaphored(client, settings.max_parallel_amadeus)
    today = date.today()
    days = [d for d in _month_days(req.month) if d >= today]

    async def _one(dep: date) -> MonthDay:
        ret = dep + timedelta(days=req.trip_duration_days) if req.trip_duration_days else None
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
            return MonthDay(departure_date=dep, return_date=ret, price=None, currency=None)
        payload = amadeus_payload(raw)
        offers = payload.get("data", []) or []
        if not offers:
            return MonthDay(departure_date=dep, return_date=ret, price=None, currency=None)
        cheapest = min(offers, key=lambda o: float(o["price"]["grandTotal"]))
        return MonthDay(
            departure_date=dep,
            return_date=ret,
            price=float(cheapest["price"]["grandTotal"]),
            currency=cheapest["price"]["currency"],
        )

    out = list(await asyncio.gather(*(_one(d) for d in days)))
    return CheapestMonthResponse(
        days=out,
        source="offers_fallback",
        cheapest=_pick_cheapest(out),
    )


def _pick_cheapest(days: list[MonthDay]) -> MonthDay | None:
    priced = [d for d in days if d.price is not None]
    return min(priced, key=lambda d: d.price or float("inf")) if priced else None


async def find_cheapest_month(
    client: Client, req: CheapestMonthRequest
) -> CheapestMonthResponse:
    cache = flex_cache()
    key = stable_key("month", req.model_dump(mode="json"))
    cached = cache.get(key)
    if cached is not None:
        return CheapestMonthResponse.model_validate(cached)

    native = await _try_flight_dates(client, req)
    result = native if native is not None else await _fallback(client, req)
    cache[key] = result.model_dump(mode="json")
    return result
