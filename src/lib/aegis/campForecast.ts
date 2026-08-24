import type { Camp, SOS, Status } from "./data";

export type ForecastHorizon = 6 | 12 | 24;
export type CampForecastRisk = "CRITICAL" | "HIGH" | "WATCH" | "STABLE";

export type CampForecast = {
  camp: Camp;
  horizonHours: ForecastHorizon;
  projectedArrivals: number;
  projectedOccupancy: number;
  projectedOccupancyPct: number;
  foodHoursRemaining: number;
  waterHoursRemaining: number;
  peoplePerMedic: number;
  risk: CampForecastRisk;
  riskScore: number;
  reasons: string[];
  actions: string[];
};

const ACTIVE_SOS: Status[] = ["NEW", "TRIAGED", "ASSIGNED", "DISPATCHED"];

const arrivalShare: Record<ForecastHorizon, number> = {
  6: 0.35,
  12: 0.65,
  24: 1,
};

function stockHours(days: number, occupancy: number, arrivals: number) {
  if (occupancy === 0) return days * 24;
  const personDaysAvailable = days * occupancy;
  const averageProjectedOccupancy = occupancy + arrivals / 2;
  return (personDaysAvailable / Math.max(1, averageProjectedOccupancy)) * 24;
}

function formatHours(hours: number) {
  return `${Math.max(0, Math.round(hours))}h`;
}

export function buildCampForecasts(
  camps: Camp[],
  sosList: SOS[],
  horizonHours: ForecastHorizon,
): CampForecast[] {
  return camps
    .map((camp) => {
      const localDemand = sosList
        .filter(
          (sos) =>
            ACTIVE_SOS.includes(sos.status) &&
            (sos.district === camp.district || sos.state === camp.state),
        )
        .reduce((people, sos) => people + sos.people, 0);
      const projectedArrivals = Math.ceil(
        localDemand * arrivalShare[horizonHours],
      );
      const projectedOccupancy = camp.occupancy + projectedArrivals;
      const projectedOccupancyPct = Math.round(
        (projectedOccupancy / camp.capacity) * 100,
      );
      const foodHoursRemaining = stockHours(
        camp.foodDays,
        camp.occupancy,
        projectedArrivals,
      );
      const waterHoursRemaining = stockHours(
        camp.waterDays,
        camp.occupancy,
        projectedArrivals,
      );
      const peoplePerMedic =
        camp.medicalStaff > 0
          ? Math.round(projectedOccupancy / camp.medicalStaff)
          : Number.POSITIVE_INFINITY;

      let riskScore = 0;
      const reasons: string[] = [];
      const actions: string[] = [];

      if (projectedOccupancyPct >= 100) {
        riskScore += 30;
        reasons.push(`Projected occupancy reaches ${projectedOccupancyPct}%`);
        actions.push(
          `Divert at least ${projectedOccupancy - camp.capacity + 1} people to a nearby camp`,
        );
      } else if (projectedOccupancyPct >= 90) {
        riskScore += 20;
        reasons.push(
          `Only ${camp.capacity - projectedOccupancy} places remain`,
        );
        actions.push("Prepare overflow space or identify a diversion camp");
      } else if (projectedOccupancyPct >= 80) {
        riskScore += 10;
        reasons.push(`Projected occupancy reaches ${projectedOccupancyPct}%`);
      }

      const shortestStockHours = Math.min(
        foodHoursRemaining,
        waterHoursRemaining,
      );
      if (shortestStockHours <= horizonHours) {
        riskScore += 35;
        reasons.push(
          `A core supply may exhaust within ${formatHours(shortestStockHours)}`,
        );
      } else if (shortestStockHours <= horizonHours * 2) {
        riskScore += 22;
        reasons.push(
          `Lowest core supply cover is ${formatHours(shortestStockHours)}`,
        );
      } else if (shortestStockHours <= 72) {
        riskScore += 12;
        reasons.push(
          `Lowest core supply cover is ${formatHours(shortestStockHours)}`,
        );
      }

      if (foodHoursRemaining <= horizonHours * 2) {
        actions.push(
          `Replenish food before ${formatHours(foodHoursRemaining)}`,
        );
      }
      if (waterHoursRemaining <= horizonHours * 2) {
        actions.push(
          `Arrange drinking water before ${formatHours(waterHoursRemaining)}`,
        );
      }

      if (peoplePerMedic > 250) {
        riskScore += 20;
        reasons.push(
          camp.medicalStaff === 0
            ? "No medical staff recorded"
            : `${peoplePerMedic} people per medic`,
        );
        actions.push("Request an additional medical team immediately");
      } else if (peoplePerMedic > 150) {
        riskScore += 12;
        reasons.push(`${peoplePerMedic} people per medic`);
        actions.push("Review medical staffing for the projected load");
      }

      if (camp.urgent.length > 0) {
        riskScore += Math.min(15, camp.urgent.length * 5);
        reasons.push(`${camp.urgent.length} urgent requisition(s) remain open`);
      }

      if (projectedArrivals > 0) {
        reasons.unshift(
          `${projectedArrivals} likely arrivals from active SOS demand in ${camp.state}`,
        );
      } else {
        reasons.unshift(
          "No active SOS demand currently mapped to this camp area",
        );
      }

      if (actions.length === 0) {
        actions.push("Continue monitoring; no forecast intervention required");
      }

      const risk: CampForecastRisk =
        riskScore >= 60
          ? "CRITICAL"
          : riskScore >= 40
            ? "HIGH"
            : riskScore >= 20
              ? "WATCH"
              : "STABLE";

      return {
        camp,
        horizonHours,
        projectedArrivals,
        projectedOccupancy,
        projectedOccupancyPct,
        foodHoursRemaining: Math.round(foodHoursRemaining),
        waterHoursRemaining: Math.round(waterHoursRemaining),
        peoplePerMedic,
        risk,
        riskScore: Math.min(100, riskScore),
        reasons,
        actions,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}
