# backend/main.py — VEXA Avatar Service with IDOL + IDM-VTON proxy.
#
# /generate-avatar   → tries local IDOL (port 8001) first, falls back to placeholder
# /tryon             → tries local IDM-VTON (port 8002) first
# /generate-avatar-full → legacy SMPL-X pipeline (unchanged)

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import os
import hmac
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vexa")

app = FastAPI(title="VEXA Avatar Service", version="1.0.0")

# ─── Service URLs ─────────────────────────────────────────────────────────────
# Removed IDOL and IDM-VTON services

# ─── CORS ─────────────────────────────────────────────────────────────────────
# The frontend Next.js API routes proxy these calls server-side, so browsers
# don't hit this service directly. CORS is configured anyway for parity with
# direct debugging tools (Swagger UI, curl from a browser console, etc.).

_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.environ.get("NEXT_PUBLIC_APP_URL", "").rstrip("/"),
]
allowed_origins = [o for o in (_default_origins + _allowed_origins_env.split(",")) if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization"],
)

# ─── Auth ─────────────────────────────────────────────────────────────────────

security = HTTPBearer(auto_error=False)


def verify_internal_token(credentials: HTTPAuthorizationCredentials | None = Security(security)):
    expected = os.environ.get("INTERNAL_SERVICE_TOKEN", "")
    if not expected:
        # Not configured — allow in dev but log loudly so it doesn't hide in prod.
        logger.warning("INTERNAL_SERVICE_TOKEN not set — accepting unauthenticated requests")
        return True
    if not credentials or not hmac.compare_digest(credentials.credentials, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ─── Models ───────────────────────────────────────────────────────────────────

class Measurements(BaseModel):
    height: float
    chest: float
    waist: float
    hips: float
    inseam: float
    shoulder_width: float


class AvatarRequest(BaseModel):
    photo_url: str
    measurements: Measurements | None = None


class TryOnRequest(BaseModel):
    person_image_url: str
    garment_image_url: str
    garment_category: str = "upper_body"
    user_id: str
    product_id: str




# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "vexa-avatar",
    }


@app.post("/generate-avatar", dependencies=[Depends(verify_internal_token)])
async def generate_avatar(req: AvatarRequest):
    """
    Fallback: placeholder GLB.
    """
    app_url = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000").rstrip("/")
    avatar_url = f"{app_url}/models/avatar.glb"
    logger.info("[generate-avatar] returning placeholder %s (photo_url length=%s)",
                avatar_url, len(req.photo_url or ""))
    return {"avatar_url": avatar_url, "status": "ready"}



@app.post("/generate-avatar-full", dependencies=[Depends(verify_internal_token)])
async def generate_avatar_full(req: AvatarRequest):
    """
    Full SMPL-X pipeline. Heavy: requires torch, smplx, mediapipe, trimesh,
    opencv, Pillow, boto3. Imports are performed lazily so the server can boot
    without these deps for the stub path above.
    """
    try:
        import tempfile
        import uuid

        import cv2  # type: ignore
        import trimesh  # type: ignore
        from PIL import Image  # type: ignore

        from pipeline.body_generator import generate_body_mesh, measurements_to_betas
        from pipeline.face_texture import extract_face_texture
        from pipeline.archetype_selector import select_archetypes
        from pipeline.r2_uploader import upload_to_r2

        betas = measurements_to_betas(req.measurements)
        mesh: trimesh.Trimesh = generate_body_mesh(req.measurements)
        face_texture_array = extract_face_texture(req.photo_url)
        archetypes = select_archetypes(betas)

        with tempfile.TemporaryDirectory() as tmp:
            texture_path = f"{tmp}/face_texture.png"
            face_texture_bgr = cv2.cvtColor(face_texture_array, cv2.COLOR_RGB2BGR)
            cv2.imwrite(texture_path, face_texture_bgr)

            if mesh.visual is not None and hasattr(mesh.visual, "uv") and mesh.visual.uv is not None:
                texture_image = Image.open(texture_path)
                material = trimesh.visual.material.SimpleMaterial(image=texture_image)
                mesh.visual = trimesh.visual.TextureVisuals(uv=mesh.visual.uv, material=material)
            else:
                logger.warning(
                    "Mesh has no UV coordinates — face texture not embedded. "
                    "Add UV unwrapping to generate_body_mesh for full texture support."
                )

            glb_path = f"{tmp}/avatar.glb"
            mesh.export(glb_path)

            r2_key = f"avatars/{uuid.uuid4().hex}.glb"
            avatar_url = upload_to_r2(glb_path, r2_key, "model/gltf-binary")

        return {
            "avatar_url": avatar_url,
            "status": "success",
            "archetypes": [
                {"name": item["archetype"]["id"], "weight": round(item["weight"], 4)}
                for item in archetypes
            ],
        }
    except KeyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Missing environment variable {e}. Copy backend/.env.example to backend/.env.",
        )
    except Exception as e:
        logger.exception("generate-avatar-full failed")
        raise HTTPException(status_code=500, detail=str(e))
