from __future__ import annotations

from app.normalizers.offers import iso_duration_to_minutes, normalize_offers


def test_iso_duration_parses_hours_and_minutes() -> None:
    assert iso_duration_to_minutes("PT5H30M") == 330
    assert iso_duration_to_minutes("PT2H") == 120
    assert iso_duration_to_minutes("PT45M") == 45
    assert iso_duration_to_minutes("") == 0
    assert iso_duration_to_minutes(None) == 0


def test_normalize_round_trip_offer_separates_itineraries(flight_offers_payload):
    offers = normalize_offers(flight_offers_payload)
    assert len(offers) == 1
    offer = offers[0]

    assert offer.price.currency == "BRL"
    assert offer.price.total == 1234.56
    assert offer.validating_airlines == ["LA"]

    assert len(offer.itineraries) == 2
    outbound, inbound = offer.itineraries

    assert outbound.stops == 0
    assert outbound.duration_minutes == 330
    assert outbound.segments[0].carrier_name == "LATAM Airlines"

    # Inbound has 1 stop; counts must NOT be summed with the outbound (legacy bug)
    assert inbound.stops == 1
    assert len(inbound.segments) == 2
