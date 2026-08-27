"""
validation_alerting.py

- risk depth classification (levels 0-3)
- vectorize flood mask to GeoJSON polygons using geopandas
- Sentinel-1 metadata query via asf_search (metadata-only)
"""
import os
import logging
import json
from typing import Dict
import numpy as np

logger = logging.getLogger("hydro.validation")
logger.setLevel(logging.INFO)

try:
    import geopandas as gpd
    from shapely.geometry import shape, mapping, Polygon
except Exception:
    gpd = None

try:
    import asf_search
except Exception:
    asf_search = None


def classify_risk_by_depth(h_max: np.ndarray) -> np.ndarray:
    # levels: 0: <0.05m, 1: 0.05-0.3, 2:0.3-1.0, 3:>1.0
    levels = np.zeros_like(h_max, dtype=int)
    levels[(h_max >= 0.05) & (h_max < 0.3)] = 1
    levels[(h_max >= 0.3) & (h_max < 1.0)] = 2
    levels[h_max >= 1.0] = 3
    return levels


def vectorize_flood_mask(flood_mask: np.ndarray, lats: np.ndarray, lons: np.ndarray, out_geojson: str) -> Dict:
    # Simple raster-to-polygons using contours or marching squares is heavy; perform bounding box polygons for connected regions.
    ny, nx = flood_mask.shape
    polys = []
    visited = np.zeros_like(flood_mask, dtype=bool)
    for i in range(ny):
        for j in range(nx):
            if flood_mask[i,j] and not visited[i,j]:
                # flood patch flood-fill
                stack = [(i,j)]
                coords = []
                visited[i,j] = True
                while stack:
                    ci,cj = stack.pop()
                    coords.append((float(lons[ci,cj]), float(lats[ci,cj])))
                    for di,dj in [(-1,0),(1,0),(0,-1),(0,1)]:
                        ni, nj = ci+di, cj+dj
                        if 0<=ni<ny and 0<=nj<nx and flood_mask[ni,nj] and not visited[ni,nj]:
                            visited[ni,nj] = True
                            stack.append((ni,nj))
                # create convex hull polygon
                try:
                    poly = Polygon(coords).convex_hull
                    polys.append(poly)
                except Exception:
                    continue
    geo = {"type": "FeatureCollection", "features": []}
    for p in polys:
        geo["features"].append({"type": "Feature", "geometry": mapping(p), "properties": {}})
    with open(out_geojson, 'w') as fh:
        json.dump(geo, fh)
    return geo


def query_sentinel1_metadata(lat: float, lon: float, start_date: str, end_date: str) -> Dict:
    if asf_search is None:
        logger.warning("asf_search not available; skipping Sentinel-1 metadata query.")
        return {"mode": "unavailable", "scenes": []}
    try:
        results = asf_search.geo_search(lat=lat, lon=lon, platform="Sentinel-1", start=start_date, end=end_date, processingLevel="GRD")
        scenes = []
        for item in results:
            if isinstance(item, dict):
                scenes.append({"id": item.get('id') or item.get('identifier') or item.get('scene_id'), "size": item.get('size'), "urls": item.get('urls')})
            else:
                scenes.append({"id": getattr(item, 'id', None) or getattr(item, 'identifier', None), "size": getattr(item, 'size', None)})
        return {"mode": "metadata", "scenes": scenes}
    except Exception as ex:
        logger.warning("Sentinel-1 metadata query failed: %s", ex)
        return {"mode": "error", "error": str(ex)}
