import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.archetype_selector import ARCHETYPES, select_archetypes


def test_archetype_catalog():
    assert len(ARCHETYPES) == 10
    assert all(len(a["betas"]) == 10 for a in ARCHETYPES)


def test_select_archetypes_top_k_weights_sum():
    out = select_archetypes([0.0] * 10, top_k=3)
    assert len(out) == 3
    s = sum(item["weight"] for item in out)
    assert s == pytest.approx(1.0, rel=1e-5)
    for item in out:
        assert "id" in item["archetype"]
        assert item["weight"] >= 0


def test_select_archetypes_prefers_closest_average():
    out = select_archetypes([0.0] * 10, top_k=1)
    assert out[0]["archetype"]["id"] == "arch_001"
    assert out[0]["weight"] == pytest.approx(1.0)
