"""
main.py
End-to-end driver for hydrology_engine. Running this will execute ingestion, hydro-processing,
hydrology modeling, inundation, validation, and dashboard generation. Writes outputs to the package's output directory.
"""
import os
import json
import logging
import numpy as np
from .config import PipelineConfig
from .ingestion import fetch_nasa_power_grid, fetch_precipitation_grid, resample_raster_to_grid
from .hydro_processing import acquire_dem, fill_sinks, compute_slope, flow_direction_d8, accumulation_from_d8, compute_twi
from .hydrology_model import map_gwetroot_to_S, scs_cn_runoff, route_to_discharge
from .inundation_solver import simulate_inundation, export_geotiff
from .validation_alerting import classify_risk_by_depth, vectorize_flood_mask, query_sentinel1_metadata
from .dashboard import create_folium_map, write_streamlit_app

logger = logging.getLogger("hydro.main")
logger.setLevel(logging.INFO)

def run_pipeline():
    cfg = PipelineConfig()
    logger.info("Starting hydrology_engine pipeline. Output dir: %s", cfg.output_dir)
    # Step 1: Ingest
    soil = fetch_nasa_power_grid(cfg)
    precip = fetch_precipitation_grid(cfg)
    # align grids if necessary
    lats = soil['lats']
    lons = soil['lons']
    if precip['lats'].shape != lats.shape:
        precip_arr = resample_raster_to_grid(precip['precip'], precip['lats'], precip['lons'], lats, lons)
    else:
        precip_arr = precip['precip']
    gwetroot_ts = soil['fields'].get('GWETROOT')
    if gwetroot_ts is None:
        nt = precip_arr.shape[0]
        gwetroot_ts = np.full_like(precip_arr, 0.35)
    # Step 2: DEM & hydro conditioning
    dem_pack = acquire_dem(cfg)
    dem = dem_pack['dem']
    # resample dem to match lats/lons if shapes differ
    if dem.shape != lats.shape:
        from scipy.interpolate import RegularGridInterpolator
        ny_dem, nx_dem = dem.shape
        dem_lats = np.linspace(cfg.bbox[3], cfg.bbox[1], ny_dem)
        dem_lons = np.linspace(cfg.bbox[0], cfg.bbox[2], nx_dem)
        interp = RegularGridInterpolator((dem_lats, dem_lons), dem, bounds_error=False, fill_value=np.nan)
        pts = np.column_stack([lats.ravel(), lons.ravel()])
        dem_res = interp(pts).reshape(lats.shape)
        dem = np.nan_to_num(dem_res, nan=np.nanmean(dem_res))
    dem_filled = fill_sinks(dem)
    slope = compute_slope(dem_filled, cfg)
    flow_dir = flow_direction_d8(dem_filled)
    accum = accumulation_from_d8(flow_dir)
    twi = compute_twi(accum, slope)
    # Step 3: Hydrology model
    gwet_mean = np.nanmean(gwetroot_ts, axis=0)
    S = map_gwetroot_to_S(gwet_mean)
    Pn = scs_cn_runoff(precip_arr, S)
    Q, basin_km2 = route_to_discharge(Pn, accum, cfg)
    # Step 4: Inundation
    inund = simulate_inundation(dem_filled, Pn, cfg)
    h_max = inund['h_max']
    flood_mask = inund['flood_mask']
    # Export
    out_dir = cfg.output_dir
    os.makedirs(out_dir, exist_ok=True)
    geo_ok = export_geotiff(h_max, dem_pack.get('lats', lats), dem_pack.get('lons', lons), os.path.join(out_dir, 'h_max.tif'))
    if not geo_ok:
        np.savez_compressed(os.path.join(out_dir, 'arrays.npz'), h_max=h_max, flood_mask=flood_mask, dem=dem_filled)
    # Step 5: Validation & Alerts
    levels = classify_risk_by_depth(h_max)
    geojson_path = os.path.join(out_dir, 'flood_extent.geojson')
    geo = vectorize_flood_mask(flood_mask, dem_pack.get('lats', lats), dem_pack.get('lons', lons), geojson_path)
    # sentinel1 metadata
    center_lat = (cfg.bbox[1] + cfg.bbox[3]) / 2.0
    center_lon = (cfg.bbox[0] + cfg.bbox[2]) / 2.0
    s1_meta = query_sentinel1_metadata(center_lat, center_lon, cfg.start_date, cfg.end_date)
    # Step 6: Dashboard
    map_html = os.path.join(out_dir, 'dashboard_map.html')
    create_folium_map(geo, cfg, map_html)
    st_app = write_streamlit_app(geojson_path, os.path.join(out_dir, 'streamlit_app.py'))
    # summary
    summary = {
        'mode_soil': soil.get('mode'),
        'mode_precip': precip.get('mode'),
        'dem_mode': dem_pack.get('mode'),
        'basin_km2': basin_km2,
        'h_max_max': float(np.max(h_max)),
        'flood_fraction': float(np.count_nonzero(flood_mask)) / flood_mask.size,
        's1_meta': s1_meta.get('mode')
    }
    with open(os.path.join(out_dir, 'summary.json'), 'w') as fh:
        json.dump(summary, fh, indent=2)
    print(json.dumps(summary, indent=2))

if __name__ == '__main__':
    run_pipeline()
