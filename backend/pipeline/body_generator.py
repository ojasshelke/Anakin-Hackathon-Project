import torch
import trimesh
import smplx
import numpy as np
import os


def measurements_to_betas(measurements) -> torch.Tensor:
    """
    Heuristic linear mapping from body measurements to SMPL-X 10-dim betas.
    Beta[0] controls overall body size (positive = larger).
    Beta[1] controls height/slenderness.
    Beta[2] controls waist-to-hip ratio.
    Remaining betas are zeroed (require learned regression for accuracy).
    """
    # Normalize against average adult measurements (cm)
    AVG_HEIGHT = 170.0
    AVG_CHEST = 92.0
    AVG_WAIST = 78.0
    AVG_HIPS = 96.0

    height_delta = (measurements.height - AVG_HEIGHT) / AVG_HEIGHT
    chest_delta = (measurements.chest - AVG_CHEST) / AVG_CHEST
    waist_delta = (measurements.waist - AVG_WAIST) / AVG_WAIST
    hip_delta = (measurements.hips - AVG_HIPS) / AVG_HIPS

    betas = torch.zeros(1, 10)
    betas[0, 0] = float(chest_delta * 3.0)       # overall size
    betas[0, 1] = float(height_delta * 2.0)       # height
    betas[0, 2] = float((waist_delta - hip_delta) * 2.0)  # waist-hip ratio
    betas[0, 3] = float(waist_delta * 1.5)        # belly
    return betas


def generate_body_mesh(measurements) -> trimesh.Trimesh:
    model_path = os.getenv('SMPLX_MODEL_PATH', 'models/')
    
    # Fallback to primitives if models are missing
    if not os.path.exists(model_path):
        import logging
        logging.getLogger("vexa").warning(f"SMPL-X models missing at {model_path}. Generating primitive fallback.")
        
        # Simple blocky humanoid for fallback
        head = trimesh.creation.uv_sphere(radius=0.15)
        head.apply_translation([0, 1.65, 0])
        
        torso = trimesh.creation.box(extents=[0.4, 0.6, 0.2])
        torso.apply_translation([0, 1.15, 0])
        
        leg_l = trimesh.creation.box(extents=[0.12, 0.8, 0.12])
        leg_l.apply_translation([-0.12, 0.4, 0])
        
        leg_r = trimesh.creation.box(extents=[0.12, 0.8, 0.12])
        leg_r.apply_translation([0.12, 0.4, 0])
        
        mesh = trimesh.util.concatenate([head, torso, leg_l, leg_r])
        # Add minimal UVs to allow texture visual to not crash
        mesh.visual = trimesh.visual.TextureVisuals(uv=np.zeros((len(mesh.vertices), 2)))
        return mesh

    model = smplx.create(
        model_path=model_path,
        model_type='smplx',
        gender='neutral',
        use_face_contour=False,
        num_betas=10,
        ext='npz'
    )

    betas = measurements_to_betas(measurements)
    output = model(betas=betas, return_verts=True)

    vertices = output.vertices.detach().cpu().numpy().squeeze()
    faces = model.faces
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    
    # Add cylindrical UV unwrapping so face_texture can be embedded
    mesh = _add_cylindrical_uv(mesh)
    return mesh


def _add_cylindrical_uv(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """
    Cylindrical UV projection. Not production-perfect but enables
    face texture embedding without a full UV unwrap pipeline.
    Centers the mesh, projects vertices onto a cylinder,
    normalizes UV to [0,1].
    """
    verts = mesh.vertices.copy()
    centroid = verts.mean(axis=0)
    verts -= centroid
    
    x, y, z = verts[:, 0], verts[:, 1], verts[:, 2]
    
    # U = angle around Y axis, V = normalized height
    u = (np.arctan2(x, z) / (2 * np.pi)) + 0.5
    v_min, v_max = y.min(), y.max()
    v = (y - v_min) / (v_max - v_min + 1e-8)
    
    uv = np.stack([u, v], axis=1).astype(np.float32)
    mesh.visual = trimesh.visual.TextureVisuals(uv=uv)
    return mesh


def export_to_glb(mesh: trimesh.Trimesh, path: str) -> str:
    """Exports a trimesh to GLB format."""
    mesh.export(path)
    return path
