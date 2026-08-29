"""
dashboard.py

Creates a Folium map and Streamlit script to display hazard polygons and NASA GIBS tiles.
"""
import os
import logging
import json
from typing import Dict
import numpy as np

logger = logging.getLogger("hydro.dashboard")
logger.setLevel(logging.INFO)

try:
    import folium
    from folium import GeoJson
except Exception:
    folium = None


def create_folium_map(geojson_obj: Dict, cfg, out_html: str):
    if folium is None:
        logger.warning("folium not installed; cannot create interactive map.")
        return False
    # center map on bbox center
    west, south, east, north = cfg.bbox
    center = [(south + north) / 2.0, (west + east) / 2.0]
    m = folium.Map(location=center, zoom_start=10)
    # NASA GIBS - Blue Marble or MODIS Terra true color (may be replaced with correct layer)
    folium.TileLayer(tiles="https://gibs.earthdata.nasa.gov/tiles/epsg4326/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2019-01-01/250m/{z}/{x}/{y}.jpg", attr='NASA GIBS', name='NASA GIBS').add_to(m)
    GeoJson(geojson_obj, name='Flood Extent', style_function=lambda feat: {'fillColor':'red', 'color':'red', 'weight':1, 'fillOpacity':0.4}).add_to(m)
    m.save(out_html)
    logger.info("Saved folium map to %s", out_html)
    return True


def write_streamlit_app(geojson_path: str, out_path: str):
    # simple Streamlit app that loads GeoJSON and displays folium map
    content = f"""
import streamlit as st
import json
from hydrology_engine.config import PipelineConfig
from hydrology_engine.dashboard import create_folium_map

st.title('Resqflow Hazard Dashboard')
cfg = PipelineConfig()
with open(r'{geojson_path}', 'r') as fh:
    geo = json.load(fh)

out_html = '{os.path.basename(geojson_path)}'.replace('.geojson', '_map.html')
create_folium_map(geo, cfg, out_html)
st.markdown(f"Map generated: {{out_html}}. Open in browser or serve statically.")
"""
    with open(out_path, 'w') as fh:
        fh.write(content)
    logger.info("Wrote Streamlit app to %s", out_path)
    return out_path
