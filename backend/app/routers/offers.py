from __future__ import annotations

from fastapi import APIRouter, Depends

from ..deps import get_amadeus_client
from ..schemas.offers import SearchRequest, SearchResponse
from ..services.offers import search_offers

router = APIRouter(prefix="/offers", tags=["offers"])


@router.post("/search", response_model=SearchResponse)
async def offers_search(
    req: SearchRequest,
    client=Depends(get_amadeus_client),
) -> SearchResponse:
    return await search_offers(client, req)
