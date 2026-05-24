from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
def flight_offers_payload() -> dict[str, Any]:
    return json.loads((FIXTURES / "flight_offers.json").read_text())
