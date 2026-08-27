"""
inundation_solver.py

Vectorized 2D diffusion-wave solver (simplified) and GeoTIFF exporter.
"""
import os
import logging
import numpy as np
from typing import Dict
from .config import PipelineConfig

logger = logging.getLogger("hydro.inundation")
logger.setLevel(logging.INFO)

try:
    import rasterio
    from rasterio.transform import from_origin
except Exception:
    rasterio = None


def simulate_inundation(dem: np.ndarray, runoff: np.ndarray, cfg: PipelineConfig, mannings_n: float = 0.035, dt: float = 3600.0) -> Dict[str, np.ndarray]:
    nt = runoff.shape[0]
    ny, nx = dem.shape
    cell_area = cfg.resolution_m * cfg.resolution_m
    h = np.zeros((ny, nx), dtype=float)
    h_max = np.zeros_like(h)
    # Precompute neighbor indices for vectorized faces
    for t in range(nt):
        Pn_m = runoff[t] / 1000.0
        h += Pn_m
        # compute flow to four neighbors via vectorized differences
        # pad arrays to handle boundaries
        elev = dem + h
        # neighbors
        up = elev[:-2, 1:-1]
        center = elev[1:-1, 1:-1]
        down = elev[2:, 1:-1]
        left = elev[1:-1, :-2]
        right = elev[1:-1, 2:]
        # slopes to neighbors
        s_up = (center - up) / cfg.resolution_m
        s_down = (center - down) / cfg.resolution_m
        s_left = (center - left) / cfg.resolution_m
        s_right = (center - right) / cfg.resolution_m
        # positive slopes only
        s_up = np.clip(s_up, 0, None)
        s_down = np.clip(s_down, 0, None)
        s_left = np.clip(s_left, 0, None)
        s_right = np.clip(s_right, 0, None)
        # compute discharges per face (m3/s) approximated
        h_center = h[1:-1,1:-1]
        Q_up = (h_center**(5.0/3.0)) * np.sqrt(s_up + 1e-6) / mannings_n * cfg.resolution_m
        Q_down = (h_center**(5.0/3.0)) * np.sqrt(s_down + 1e-6) / mannings_n * cfg.resolution_m
        Q_left = (h_center**(5.0/3.0)) * np.sqrt(s_left + 1e-6) / mannings_n * cfg.resolution_m
        Q_right = (h_center**(5.0/3.0)) * np.sqrt(s_right + 1e-6) / mannings_n * cfg.resolution_m
        # convert Q to depth change dh = Q*dt / area
        dh_up = Q_up * dt / cell_area
        dh_down = Q_down * dt / cell_area
        dh_left = Q_left * dt / cell_area
        dh_right = Q_right * dt / cell_area
        # update interior cells
        h_new = h.copy()
        center_idx = (slice(1,-1), slice(1,-1))
        h_new[center_idx] = h[center_idx] - (dh_up + dh_down + dh_left + dh_right)
        # add to neighbors
        h_new[:-2,1:-1] += dh_up
        h_new[2:,1:-1] += dh_down
        h_new[1:-1,:-2] += dh_left
        h_new[1:-1,2:] += dh_right
        # infiltration/evap
        h = np.clip(h_new * 0.98, 0.0, None)
        h_max = np.maximum(h_max, h)
    flood_mask = h_max > 0.05
    return {"h_max": h_max, "flood_mask": flood_mask}


def export_geotiff(arr: np.ndarray, lats: np.ndarray, lons: np.ndarray, out_path: str) -> bool:
    try:
        if rasterio is None:
            return False
        ny, nx = arr.shape
        left = float(np.min(lons))
        top = float(np.max(lats))
        resx = (float(np.max(lons)) - float(np.min(lons))) / max(nx-1,1)
        resy = (float(np.max(lats)) - float(np.min(lats))) / max(ny-1,1)
        transform = from_origin(left, top, resx, resy)
        with rasterio.open(out_path, 'w', driver='GTiff', height=ny, width=nx, count=1, dtype='float32', crs='EPSG:4326', transform=transform, nodata=-9999) as dst:
            dst.write(arr.astype('float32'), 1)
        return True
    except Exception as ex:
        logger.warning("GeoTIFF export failed: %s", ex)
        return False
