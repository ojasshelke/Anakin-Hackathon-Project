import pytest
import torch
from pipeline.body_generator import measurements_to_betas
from pipeline.archetype_selector import select_archetypes


class FakeMeasurements:
    height = 170.0
    chest = 92.0
    waist = 78.0
    hips = 96.0
    inseam = 80.0
    shoulder_width = 44.0


def test_measurements_to_betas_shape():
    betas = measurements_to_betas(FakeMeasurements())
    assert betas.shape == (1, 10)


def test_measurements_to_betas_nonzero_for_non_average():
    tall = FakeMeasurements()
    tall.height = 195.0
    betas = measurements_to_betas(tall)
    # Height delta should produce non-zero beta[1]
    assert betas[0, 1].item() != 0.0


def test_select_archetypes_returns_k():
    betas = torch.zeros(1, 10)
    result = select_archetypes(betas, k=3)
    assert len(result) == 3


def test_select_archetypes_weights_sum_to_one():
    betas = torch.zeros(1, 10)
    result = select_archetypes(betas, k=3)
    total = sum(item["weight"] for item in result)
    assert abs(total - 1.0) < 1e-5


def test_select_archetypes_average_is_nearest_to_zero():
    betas = torch.zeros(1, 10)
    result = select_archetypes(betas, k=5)
    top_name = result[0]["archetype"]["id"]
    assert top_name == 'arch_001'


import cv2
import numpy as np
import tempfile
import os
from unittest.mock import patch
from pipeline.face_texture import extract_face_texture, download_image


def _make_fake_face_image() -> np.ndarray:
    """Create a synthetic 300x300 BGR image with a simple face-like oval."""
    img = np.ones((300, 300, 3), dtype=np.uint8) * 200
    cv2.ellipse(img, (150, 150), (80, 100), 0, 0, 360, (180, 140, 120), -1)
    return img


class FakeMediapipeResult:
    class FakeLandmark:
        def __init__(self, x, y):
            self.x = x
            self.y = y
            self.z = 0.0

    def __init__(self):
        # Simulate landmarks forming a face region
        self.multi_face_landmarks = [type('obj', (object,), {
            'landmark': [self.FakeLandmark(0.3 + i*0.001, 0.3 + i*0.001) for i in range(468)]
        })()]


def test_face_texture_output_shape():
    fake_img = _make_fake_face_image()

    with patch('pipeline.face_texture.download_image', return_value=fake_img), \
         patch('pipeline.face_texture.mp') as mock_mp:
        mock_mp.solutions.face_mesh.FaceMesh.return_value.__enter__ = lambda s: s
        mock_mp.solutions.face_mesh.FaceMesh.return_value.__exit__ = lambda *a: None
        mock_mp.solutions.face_mesh.FaceMesh.return_value.process = lambda x: FakeMediapipeResult()

        result = extract_face_texture("http://fake.url/photo.jpg", output_size=256)
        assert result.shape == (256, 256, 3)
        assert result.dtype == np.uint8


def test_face_texture_saves_file():
    fake_img = _make_fake_face_image()

    with patch('pipeline.face_texture.download_image', return_value=fake_img), \
         patch('pipeline.face_texture.mp') as mock_mp:
        mock_mp.solutions.face_mesh.FaceMesh.return_value.__enter__ = lambda s: s
        mock_mp.solutions.face_mesh.FaceMesh.return_value.__exit__ = lambda *a: None
        mock_mp.solutions.face_mesh.FaceMesh.return_value.process = lambda x: FakeMediapipeResult()

        with tempfile.TemporaryDirectory() as tmp:
            save_path = os.path.join(tmp, "texture.png")
            extract_face_texture("http://fake.url/photo.jpg", save_path=save_path)
            assert os.path.exists(save_path)
            loaded = cv2.imread(save_path)
            assert loaded is not None
