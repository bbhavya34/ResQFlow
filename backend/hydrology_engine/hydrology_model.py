"""
hydrology_model.py

SCS-CN runoff and runoff-to-discharge routines including a PyTorch LSTM wrapper fallback.
"""
import logging
import numpy as np
from typing import Tuple
from .config import PipelineConfig

logger = logging.getLogger("hydro.model")
logger.setLevel(logging.INFO)

try:
    import torch
    import torch.nn as nn
except Exception:
    torch = None
    nn = None


def map_gwetroot_to_S(gwetroot: np.ndarray, cn_min: float = 30.0, cn_max: float = 98.0) -> np.ndarray:
    # GWETROOT [0..1] maps to CN via linear interpolation
    cn = cn_max - gwetroot * (cn_max - cn_min)
    cn = np.clip(cn, 1.0, 100.0)
    S = (25400.0 / cn) - 254.0
    S = np.clip(S, 0.0, None)
    return S


def scs_cn_runoff(P: np.ndarray, S: np.ndarray) -> np.ndarray:
    # P: nt x ny x nx (mm), S: ny x nx
    nt = P.shape[0]
    Pn = np.zeros_like(P)
    Ia = 0.2 * S
    for t in range(nt):
        Pt = P[t]
        mask = Pt > Ia
        num = (Pt - Ia)**2
        denom = Pt - Ia + S
        denom = np.where(denom == 0, 1e-6, denom)
        Pn[t] = np.where(mask, num / denom, 0.0)
    return Pn


class RunoffLSTM:
    def __init__(self, input_size: int = 3, hidden_size: int = 32, device: str = 'cpu'):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.device = device
        if torch is not None:
            class Net(nn.Module):
                def __init__(self, in_size, hid):
                    super().__init__()
                    self.lstm = nn.LSTM(in_size, hid, batch_first=True)
                    self.fc = nn.Sequential(nn.Linear(hid, 64), nn.ReLU(), nn.Linear(64, 1))
                def forward(self, x):
                    out, _ = self.lstm(x)
                    last = out[:, -1, :]
                    return self.fc(last).squeeze(-1)
            self.model = Net(input_size, hidden_size).to(device)
            logger.info("Initialized PyTorch LSTM model (untrained).")
        else:
            self.model = None
            logger.info("PyTorch unavailable; using synthetic LSTM fallback.")

    def predict(self, X: np.ndarray) -> np.ndarray:
        # X: nt x features
        if self.model is not None and torch is not None:
            with torch.no_grad():
                x = torch.tensor(X.astype(float), dtype=torch.float32, device=self.device).unsqueeze(0)
                out = self.model(x).squeeze(0).cpu().numpy()
                return np.clip(out, 0.0, None)
        # fallback: simple memory-based exponential smoothing of precip proxy
        nt, nf = X.shape
        weights = np.linspace(0.6, 0.1, nf)
        base = X @ weights
        Q = np.zeros(nt, dtype=float)
        alpha = 0.6
        for t in range(nt):
            Q[t] = alpha * (Q[t-1] if t>0 else 0.0) + (1-alpha) * max(0.0, base[t])
        # scale to m3/s given basin area heuristic
        basin_area_m2 = 1e9
        Q = Q * (basin_area_m2 / 1000.0) / 86400.0
        return Q


def route_to_discharge(Pn: np.ndarray, accum: np.ndarray, cfg: PipelineConfig) -> Tuple[np.ndarray, float]:
    nt = Pn.shape[0]
    weights = accum / np.sum(accum)
    precip_mean = np.array([np.sum(Pn[t] * weights) for t in range(nt)])
    # feature matrix: precip_mean (mm), accum_mean proxy, slope proxy
    gwet_proxy = np.full(nt, 0.35)
    slope_proxy = np.full(nt, 0.01)
    X = np.vstack([precip_mean, gwet_proxy, slope_proxy]).T
    model = RunoffLSTM(input_size=3)
    Q = model.predict(X)
    # compute basin area km2
    ny, nx = accum.shape
    cell_area = cfg.resolution_m * cfg.resolution_m
    basin_area_km2 = (accum.sum() * cell_area) / 1e6
    return Q, basin_area_km2
