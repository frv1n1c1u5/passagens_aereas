from __future__ import annotations

from datetime import date as Date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from .common import Money


class Segment(BaseModel):
    origin: str
    destination: str
    depart_at: str  # ISO local naive (sem TZ), conforme Amadeus
    arrive_at: str
    carrier_code: str
    carrier_name: str | None = None
    flight_number: str
    duration_minutes: int


class Itinerary(BaseModel):
    duration_minutes: int
    stops: int
    segments: list[Segment]


class FlightOffer(BaseModel):
    id: str
    price: Money
    itineraries: list[Itinerary]
    validating_airlines: list[str] = Field(default_factory=list)


class SearchRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    departure_date: Date
    return_date: Date | None = None
    adults: int = Field(1, ge=1, le=9)
    children: int = Field(0, ge=0, le=9)
    infants: int = Field(0, ge=0, le=9)
    cabin: Literal["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"] | None = None
    currency: str = "BRL"
    max_stops: int | None = Field(None, ge=0, le=3)
    non_stop: bool = False
    max_results: int = Field(20, ge=1, le=100)

    @model_validator(mode="after")
    def _check_dates(self) -> SearchRequest:
        if self.return_date and self.return_date < self.departure_date:
            raise ValueError("return_date must be >= departure_date")
        return self


class SearchResponse(BaseModel):
    offers: list[FlightOffer]
    currency: str
