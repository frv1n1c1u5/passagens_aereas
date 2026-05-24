from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint() -> None:
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


def test_openapi_lists_offers_routes() -> None:
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/openapi.json")
        assert resp.status_code == 200
        paths = resp.json()["paths"]
        assert "/api/v1/locations" in paths
        assert "/api/v1/offers/search" in paths
        assert "/api/v1/offers/flex-matrix" in paths
        assert "/api/v1/offers/cheapest-month" in paths
