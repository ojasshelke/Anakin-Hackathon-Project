"""Video try-on: sample frames → IDM-VTON per frame → re-encode video → R2."""

from __future__ import annotations

import base64
import tempfile
from collections.abc import Callable
from typing import Optional

import cv2
import numpy as np
import requests

HF_IDM_VTON_URL = "https://api-inference.huggingface.co/models/yisol/IDM-VTON"


def process_video(
    video_url: str,
    garment_image_url: str,
    job_id: str,
    hf_key: str,
    r2_upload_fn: Callable[[str, str, str], str],
    progress_callback: Optional[Callable[[int], None]] = None,
) -> str:
    """
    Download video → extract frames → IDM-VTON each frame →
    reassemble → upload to R2 → return result video URL.
    """
    with requests.Session() as session, tempfile.TemporaryDirectory() as tmp_path:
        vid_path = f"{tmp_path}/input.mp4"
        r = session.get(video_url, timeout=120, stream=True)
        r.raise_for_status()
        with open(vid_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        cap = cv2.VideoCapture(vid_path)
        original_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(original_fps / 10))
        frames: list[np.ndarray] = []
        idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if idx % frame_interval == 0:
                frames.append(frame)
            idx += 1
        cap.release()

        if not frames:
            raise ValueError("No frames extracted from video")

        garment_resp = session.get(garment_image_url, timeout=60)
        garment_resp.raise_for_status()

        result_frames: list[np.ndarray] = []
        total = len(frames)
        headers = {"Authorization": f"Bearer {hf_key}", "Content-Type": "application/json"}

        for i, frame in enumerate(frames):
            _, jpeg_bytes = cv2.imencode(".jpg", frame)
            human_b64 = base64.b64encode(jpeg_bytes.tobytes()).decode("ascii")
            human_img = f"data:image/jpeg;base64,{human_b64}"

            payload = {
                "inputs": {
                    "human_img": human_img,
                    "garm_img": garment_image_url,
                }
            }

            hf_res = session.post(
                HF_IDM_VTON_URL,
                headers=headers,
                json=payload,
                timeout=120,
            )

            if hf_res.ok and hf_res.content:
                result_arr = np.frombuffer(hf_res.content, dtype=np.uint8)
                result_frame = cv2.imdecode(result_arr, cv2.IMREAD_COLOR)
                if result_frame is not None:
                    result_frames.append(result_frame)
                else:
                    result_frames.append(frame)
            else:
                result_frames.append(frame)

            if progress_callback:
                progress_callback(int((i + 1) / total * 90))

        output_path = f"{tmp_path}/result_{job_id}.mp4"
        h, w = result_frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_path, fourcc, 10.0, (w, h))
        for frame in result_frames:
            writer.write(frame)
        writer.release()

        r2_key = f"videos/{job_id}_result.mp4"
        return r2_upload_fn(output_path, r2_key, "video/mp4")
