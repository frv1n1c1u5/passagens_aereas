from __future__ import annotations

from datetime import date as Date
from typing import Literal

from pydantic import BaseModel, Field


class FlexMatrixRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    departure_date: Date
    return_date: Date | None = None
    days_window: int = Field(3, ge=1, le=3)
    adults: int = Field(1, ge=1, le=9)
    currency: str = "BRL"


class MatrixCell(BaseModel):
    departure_date: Date
    return_date: Date | None = None
    price: float | None = None
    currency: str | None = None
    offer_id: str | None = None


class FlexMatrixResponse(BaseModel):
    cells: list[MatrixCell]
    days_window: int
    source: Literal["flight_dates", "offers_fallback"]


class CheapestMonthRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # YYYY-MM
    trip_duration_days: int | None = Field(None, ge=1, le=30)
    adults: int = Field(1, ge=1, le=9)
    currency: str = "BRL"


class MonthDay(BaseModel):
    departure_date: Date
    return_date: Date | None = None
    price: float | None = None
    currency: str | None = None


class CheapestMonthResponse(BaseModel):
    days: list[MonthDay]
    source: Literal["flight_dates", "offers_fallback"]
    cheapest: MonthDay | None = None
