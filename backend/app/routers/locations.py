from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..deps import get_amadeus_client
from ..schemas.locations import LocationsResponse
from ..services.locations import search_locations

router = APIRouter(tags=["locations"])


@router.get("/locations", response_model=LocationsResponse)
async def locations(
    keyword: str = Query(..., min_length=2, max_length=64),
    limit: int = Query(8, ge=1, le=20),
    client=Depends(get_amadeus_client),
) -> LocationsResponse:
    return await search_locations(client, keyword, limit)
