from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class Location(BaseModel):
    iata: str
    name: str
    city: str | None = None
    country: str | None = None
    sub_type: Literal["AIRPORT", "CITY"]


class LocationsResponse(BaseModel):
    items: list[Location]
