"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

const API_URL = "http://localhost:8000/api/predict-hydrology/";

type Prediction = {
  runoff_mm: number[];
  peak_runoff_mm: number;
  total_runoff_mm: number;
  time_steps: number;
  grid_shape: number[];
};

export default function HydrologyPredictor() {
  const [precipitation, setPrecipitation] = useState("12, 26, 8, 42, 18");
  const [soilMoisture, setSoilMoisture] = useState("0.35");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runPrediction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPrediction(null);

    const precipitationValues = precipitation.trim()
      ? precipitation.split(",").map((value) => Number(value.trim()))
      : [];
    const soilMoistureValue = Number(soilMoisture);

    if (
      precipitationValues.length === 0 ||
      precipitationValues.some((value) => !Number.isFinite(value) || value < 0) ||
      !Number.isFinite(soilMoistureValue) ||
      soilMoistureValue < 0 ||
      soilMoistureValue > 1
    ) {
      setError("Enter non-negative rainfall values and soil moisture from 0 to 1.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precipitation: precipitationValues,
          soil_moisture: soilMoistureValue,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "The hydrology service rejected the request.");
      }
      setPrediction(payload.prediction);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reach the hydrology service.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal">
            Live model
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Hydrology prediction
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Estimate surface runoff from the latest rainfall scenario.
          </p>
        </div>
        <span className="rounded border border-teal/30 bg-teal/10 px-2 py-1 text-[11px] font-semibold text-teal">
          SCS-CN
        </span>
      </div>

      <form onSubmit={runPrediction} className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
        <label className="grid gap-1.5 text-xs font-medium text-foreground">
          Rainfall per time step (mm)
          <input
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
            value={precipitation}
            onChange={(event) => setPrecipitation(event.target.value)}
            placeholder="12, 26, 8, 42"
            aria-label="Rainfall per time step in millimetres"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-foreground">
          Soil moisture (0-1)
          <input
            className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:ring-1 focus-visible:ring-ring"
            value={soilMoisture}
            onChange={(event) => setSoilMoisture(event.target.value)}
            inputMode="decimal"
            min="0"
            max="1"
            step="0.01"
            type="number"
            aria-label="Soil moisture from zero to one"
          />
        </label>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Play />}
          {isLoading ? "Predicting" : "Run prediction"}
        </Button>
      </form>

      {error && (
        <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {prediction && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Peak runoff</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{prediction.peak_runoff_mm.toFixed(1)} mm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total runoff</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{prediction.total_runoff_mm.toFixed(1)} mm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Runoff by step</p>
            <p className="mt-1 truncate text-sm font-medium tabular-nums" title={prediction.runoff_mm.join(", ")}>
              {prediction.runoff_mm.map((value) => value.toFixed(1)).join(" / ")} mm
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
