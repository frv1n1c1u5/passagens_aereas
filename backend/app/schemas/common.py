from __future__ import annotations

from pydantic import BaseModel, Field


class Money(BaseModel):
    total: float = Field(..., ge=0)
    currency: str = Field(..., min_length=3, max_length=3)


class CabinClass(BaseModel):
    code: str
    label: str
