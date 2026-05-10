import os
import sys
import tempfile
from pathlib import Path

import pytest
import trimesh

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.body_generator import export_to_glb, generate_body_mesh

_NEUTRAL_MODEL = (
    Path(__file__).resolve().parent.parent / "models" / "smplx" / "SMPLX_NEUTRAL.npz"
)

requires_smplx_files = pytest.mark.skipif(
    not _NEUTRAL_MODEL.is_file(),
    reason=f"SMPL-X weights missing: expected {_NEUTRAL_MODEL}",
)

CASES = [
    {
        "height": 165,
        "chest": 85,
        "waist": 70,
        "hips": 92,
        "inseam": 74,
        "shoulder_width": 38,
    },
    {
        "height": 180,
        "chest": 100,
        "waist": 85,
        "hips": 102,
        "inseam": 82,
        "shoulder_width": 44,
    },
    {
        "height": 155,
        "chest": 90,
        "waist": 75,
        "hips": 95,
        "inseam": 70,
        "shoulder_width": 36,
    },
    {
        "height": 190,
        "chest": 110,
        "waist": 95,
        "hips": 108,
        "inseam": 88,
        "shoulder_width": 48,
    },
    {
        "height": 170,
        "chest": 95,
        "waist": 80,
        "hips": 98,
        "inseam": 78,
        "shoulder_width": 40,
    },
]


@requires_smplx_files
def test_mesh_generation():
    for c in CASES:
        mesh = generate_body_mesh(c, gender="neutral")
        assert isinstance(mesh, trimesh.Trimesh)
        assert len(mesh.vertices) > 1000
        assert len(mesh.faces) > 1000


@requires_smplx_files
def test_glb_export():
    mesh = generate_body_mesh(CASES[0])
    with tempfile.TemporaryDirectory() as tmp:
        path = export_to_glb(mesh, f"{tmp}/test.glb")
        assert os.path.exists(path)
        assert os.path.getsize(path) > 5000
