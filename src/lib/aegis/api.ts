import type {
  Camp,
  FeedbackEntry,
  FloodZone,
  Resource,
  SOS,
  Status,
} from "./data";

const API_ROOT = "/backend/api/v1";

export type BackendSnapshot = {
  sosList: SOS[];
  resources: Resource[];
  camps: Camp[];
  floodZones: FloodZone[];
  feedback: FeedbackEntry[];
  syncedAt: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export function loadBackendSnapshot() {
  return request<BackendSnapshot>("/bootstrap");
}

export function persistSOS(sos: SOS) {
  return request<SOS>("/sos", {
    method: "POST",
    body: JSON.stringify(sos),
  });
}

export function persistAssignment(
  sosId: string,
  resourceId: string,
  status: Status,
) {
  return request<SOS>(`/sos/${encodeURIComponent(sosId)}/assign`, {
    method: "POST",
    body: JSON.stringify({ resourceId, status }),
  });
}

export function persistSOSPatch(sosId: string, patch: Partial<SOS>) {
  return request<SOS>(`/sos/${encodeURIComponent(sosId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function persistFeedback(entry: FeedbackEntry) {
  return request<FeedbackEntry>("/feedback", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}
