from __future__ import annotations

from datetime import date

from app.services.flex_matrix import _band_pairs, _date_range


def test_date_range_covers_window() -> None:
    days = _date_range(date(2026, 6, 10), 3)
    assert len(days) == 7
    assert days[0] == date(2026, 6, 7)
    assert days[-1] == date(2026, 6, 13)


def test_band_pairs_stays_near_diagonal() -> None:
    pairs = _band_pairs(
        dep_center=date(2026, 6, 10),
        ret_center=date(2026, 6, 17),
        window=3,
        band=1,
    )
    # 7x7 = 49 total. With band=1 around the diagonal we keep significantly fewer.
    assert len(pairs) < 49
    assert len(pairs) > 7

    for dep, ret in pairs:
        # invariant: return >= departure (no backwards trips)
        assert ret >= dep
        # invariant: shift from diagonal within band
        dep_offset = (dep - date(2026, 6, 10)).days
        ret_offset = (ret - date(2026, 6, 17)).days
        assert abs(ret_offset - dep_offset) <= 1
