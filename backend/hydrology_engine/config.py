"""
config.py
Central pipeline configuration for hydrology_engine package.
"""
from dataclasses import dataclass, field
from typing import List, Tuple
from datetime import datetime, timedelta
import os
import math


@dataclass
class PipelineConfig:
    # Bounding box default: Lower Mississippi Delta area [west, south, east, north]
    bbox: List[float] = field(default_factory=lambda: [-91.5, 28.5, -88.5, 31.0])
    # target EPSG; if None, auto-select UTM zone for bbox centroid
    epsg: int = None
    # spatial resolution meters
    resolution_m: float = 30.0
    # maximum grid cells on a side to cap memory
    max_grid_cells: int = 400
    # output directory under this package
    output_dir: str = field(default_factory=lambda: os.path.join(os.path.dirname(__file__), "output"))
    # date window
    end_date: str = field(default_factory=lambda: datetime.utcnow().date().isoformat())
    start_date: str = field(default_factory=lambda: (datetime.utcnow().date() - timedelta(days=6)).isoformat())

    def __post_init__(self):
        if self.epsg is None:
            lon_center = (self.bbox[0] + self.bbox[2]) / 2.0
            zone = int((lon_center + 180) / 6) + 1
            # assume northern hemisphere
            self.epsg = 32600 + zone
        os.makedirs(self.output_dir, exist_ok=True)

    def grid_shape_from_bbox(self) -> Tuple[int, int]:
        west, south, east, north = self.bbox
        lat_center = (south + north) / 2.0
        lat_deg_to_m = 111_000.0
        lon_deg_to_m = 111_000.0 * abs(math.cos(math.radians(lat_center)) or 1.0)
        dx_m = abs(east - west) * lon_deg_to_m
        dy_m = abs(north - south) * lat_deg_to_m
        nx = max(8, min(int(dx_m / self.resolution_m) + 1, self.max_grid_cells))
        ny = max(8, min(int(dy_m / self.resolution_m) + 1, self.max_grid_cells))
        return ny, nx
