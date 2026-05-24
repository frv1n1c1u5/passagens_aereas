from __future__ import annotations

from fastapi import APIRouter, Depends

from ..deps import get_amadeus_client
from ..schemas.flexible import (
    CheapestMonthRequest,
    CheapestMonthResponse,
    FlexMatrixRequest,
    FlexMatrixResponse,
)
from ..services.cheapest_month import find_cheapest_month
from ..services.flex_matrix import build_flex_matrix

router = APIRouter(prefix="/offers", tags=["flexible"])


@router.post("/flex-matrix", response_model=FlexMatrixResponse)
async def flex_matrix(
    req: FlexMatrixRequest,
    client=Depends(get_amadeus_client),
) -> FlexMatrixResponse:
    return await build_flex_matrix(client, req)


@router.post("/cheapest-month", response_model=CheapestMonthResponse)
async def cheapest_month(
    req: CheapestMonthRequest,
    client=Depends(get_amadeus_client),
) -> CheapestMonthResponse:
    return await find_cheapest_month(client, req)
