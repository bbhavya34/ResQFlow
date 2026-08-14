export type Status =
  "NEW" | "TRIAGED" | "ASSIGNED" | "DISPATCHED" | "RESCUED" | "CLOSED";

export type PriorityFactor = {
  label: string;
  value: number;
  max: number;
  note: string;
};

export type SOS = {
  id: string;
  channel: "APP" | "SMS" | "IVR";
  raw?: string;
  lat: number;
  lng: number;
  place: string;
  district: string;
  state: string;
  people: number;
  children: number;
  elderly: number;
  disabled: number;
  livestock: number;
  floodDepthM: number;
  medical: boolean;
  receivedAt: string;
  status: Status;
  assignedResourceId?: string;
  factors: PriorityFactor[];
  notes?: string;
};

export type Resource = {
  id: string;
  name: string;
  type: "Boat" | "Ambulance" | "Truck" | "Helicopter" | "Team";
  agency: string;
  category: "OFFICIAL" | "CIVILIAN";
  lat: number;
  lng: number;
  base: string;
  capacity: number;
  capabilities: string[];
  availability: "AVAILABLE" | "ENGAGED" | "MAINTENANCE";
  verified: boolean;
  contact: string;
  lastUpdate: string;
};

export type Camp = {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  foodDays: number;
  waterDays: number;
  medicalStaff: number;
  urgent: string[];
  status: "STABLE" | "STRAINED" | "CRITICAL";
};

export type FloodZone = {
  id: string;
  name: string;
  state: string;
  river: string;
  risk: "SEVERE" | "HIGH" | "MODERATE";
  probability: number;
  radiusKm: number;
  lat: number;
  lng: number;
  forecast: string;
};

export type Facility = {
  id: string;
  name: string;
  kind: "HOSPITAL" | "SHELTER";
  lat: number;
  lng: number;
  detail: string;
};

export type FeedbackEntry = {
  id: string;
  sosId: string;
  type: string;
  by: string;
  at: string;
  note: string;
};

export const priorityScore = (f: PriorityFactor[]) =>
  Math.min(100, Math.round(f.reduce((s, x) => s + x.value, 0)));

export const priorityBand = (score: number) =>
  score >= 85
    ? { label: "Critical", tone: "critical" as const }
    : score >= 70
      ? { label: "High", tone: "high" as const }
      : score >= 50
        ? { label: "Moderate", tone: "moderate" as const }
        : { label: "Low", tone: "low" as const };

const f = (
  depth: number,
  vuln: number,
  pop: number,
  road: number,
  hist: number,
  live: number,
  dist: number,
  notes: string[],
): PriorityFactor[] => [
  { label: "Flood depth", value: depth, max: 25, note: notes[0]! },
  { label: "Vulnerable people", value: vuln, max: 20, note: notes[1]! },
  { label: "Population at risk", value: pop, max: 15, note: notes[2]! },
  { label: "Road inaccessibility", value: road, max: 15, note: notes[3]! },
  { label: "Historical damage index", value: hist, max: 10, note: notes[4]! },
  { label: "Livestock exposure", value: live, max: 5, note: notes[5]! },
  { label: "Resource distance", value: dist, max: 10, note: notes[6]! },
];

export const SOS_SEED: SOS[] = [
  {
    id: "A1024",
    channel: "SMS",
    raw: "SOS 9.9312 76.2673 6",
    lat: 9.9312,
    lng: 76.2673,
    place: "Chittoor Road, Ernakulam",
    district: "Ernakulam",
    state: "Kerala",
    people: 6,
    children: 2,
    elderly: 1,
    disabled: 1,
    livestock: 3,
    floodDepthM: 2.4,
    medical: true,
    receivedAt: "2026-08-12T13:42:00+05:30",
    status: "TRIAGED",
    factors: f(24, 19, 12, 14, 9, 4, 10, [
      "2.4 m standing water on ground floor; family on terrace",
      "2 children, 1 elderly, 1 person with mobility disability",
      "6 persons + 4 neighbouring households unreachable",
      "NH-66 service road submerged, only boat access",
      "Ward flooded in 2018 and 2019 Kerala floods",
      "3 cattle tethered on the adjacent bund",
      "Nearest capable boat 4.2 km / 18 min",
    ]),
  },
  {
    id: "A1025",
    channel: "APP",
    lat: 26.1445,
    lng: 91.7362,
    place: "Bharalu Riverside, Guwahati",
    district: "Kamrup Metro",
    state: "Assam",
    people: 11,
    children: 4,
    elderly: 2,
    disabled: 0,
    livestock: 0,
    floodDepthM: 1.6,
    medical: false,
    receivedAt: "2026-08-12T13:20:00+05:30",
    status: "NEW",
    factors: f(16, 16, 14, 10, 8, 0, 6, [
      "1.6 m water, rising 8 cm/hr from Brahmaputra backflow",
      "4 children, 2 elderly in the group",
      "11 persons sheltering in one RCC building",
      "Approach lane waterlogged, LCV access only",
      "Repeat inundation zone since 2020",
      "No livestock reported",
      "SDRF boat 2.1 km away",
    ]),
  },
  {
    id: "A1026",
    channel: "SMS",
    raw: "SOS 25.5941 85.1376 14",
    lat: 25.5941,
    lng: 85.1376,
    place: "Digha Ghat, Patna",
    district: "Patna",
    state: "Bihar",
    people: 14,
    children: 5,
    elderly: 3,
    disabled: 1,
    livestock: 9,
    floodDepthM: 1.9,
    medical: false,
    receivedAt: "2026-08-12T12:55:00+05:30",
    status: "NEW",
    factors: f(18, 18, 15, 12, 9, 5, 7, [
      "1.9 m Ganga spill water across the ghat colony",
      "5 children, 3 elderly, 1 disabled",
      "14 persons, largest open request in the sector",
      "Embankment road cut at two points",
      "Severe damage recorded in 2019 and 2021",
      "9 buffaloes need livestock-capable craft",
      "Livestock barge 6.8 km away",
    ]),
  },
  {
    id: "A1027",
    channel: "APP",
    lat: 20.2961,
    lng: 85.8245,
    place: "Nayapalli, Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    people: 3,
    children: 0,
    elderly: 1,
    disabled: 0,
    livestock: 0,
    floodDepthM: 0.8,
    medical: false,
    receivedAt: "2026-08-12T12:10:00+05:30",
    status: "DISPATCHED",
    assignedResourceId: "AMB-07",
    factors: f(8, 8, 6, 6, 6, 0, 4, [
      "0.8 m water, receding slowly",
      "1 elderly person with hypertension",
      "3 persons in a first-floor flat",
      "Colony road passable by high-clearance vehicle",
      "Moderate historical exposure",
      "No livestock",
      "Ambulance 1.4 km away",
    ]),
  },
  {
    id: "A1028",
    channel: "IVR",
    lat: 30.0869,
    lng: 78.2676,
    place: "Rishikesh riverfront",
    district: "Dehradun",
    state: "Uttarakhand",
    people: 8,
    children: 1,
    elderly: 0,
    disabled: 0,
    livestock: 2,
    floodDepthM: 1.2,
    medical: true,
    receivedAt: "2026-08-12T11:35:00+05:30",
    status: "RESCUED",
    assignedResourceId: "NDRF-03",
    factors: f(12, 10, 10, 13, 7, 2, 5, [
      "1.2 m fast-moving Ganga current",
      "1 child, 1 injured adult",
      "8 persons from two guest houses",
      "Hill approach road blocked by slush",
      "Flash-flood corridor",
      "2 goats",
      "NDRF team 3.0 km away",
    ]),
  },
  {
    id: "A1029",
    channel: "SMS",
    raw: "SOS 22.5726 88.3639 9",
    lat: 22.5726,
    lng: 88.3639,
    place: "Tollygunge low-lying block, Kolkata",
    district: "South 24 Parganas",
    state: "West Bengal",
    people: 9,
    children: 3,
    elderly: 2,
    disabled: 0,
    livestock: 0,
    floodDepthM: 1.1,
    medical: false,
    receivedAt: "2026-08-12T13:05:00+05:30",
    status: "NEW",
    factors: f(11, 14, 11, 8, 7, 0, 5, [
      "1.1 m water from canal overflow",
      "3 children, 2 elderly",
      "9 persons in a ground-floor tenement",
      "Lane accessible on foot with difficulty",
      "Annual waterlogging block",
      "No livestock",
      "Civilian boat 2.6 km away",
    ]),
  },
  {
    id: "A1030",
    channel: "APP",
    lat: 19.076,
    lng: 72.8777,
    place: "Kurla East, Mumbai",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    people: 5,
    children: 1,
    elderly: 0,
    disabled: 0,
    livestock: 0,
    floodDepthM: 0.9,
    medical: false,
    receivedAt: "2026-08-12T12:40:00+05:30",
    status: "ASSIGNED",
    assignedResourceId: "FIRE-11",
    factors: f(9, 7, 8, 7, 8, 0, 4, [
      "0.9 m Mithi river backwater",
      "1 child in the group",
      "5 persons on a chawl rooftop",
      "Access road partly submerged",
      "Repeat 26/7-style flooding zone",
      "No livestock",
      "Fire services 1.1 km away",
    ]),
  },
  {
    id: "A1031",
    channel: "SMS",
    raw: "SOS 22.3072 73.1812 4",
    lat: 22.3072,
    lng: 73.1812,
    place: "Vishwamitri bank, Vadodara",
    district: "Vadodara",
    state: "Gujarat",
    people: 4,
    children: 0,
    elderly: 2,
    disabled: 0,
    livestock: 6,
    floodDepthM: 1.4,
    medical: false,
    receivedAt: "2026-08-12T11:58:00+05:30",
    status: "NEW",
    factors: f(14, 11, 7, 9, 8, 5, 6, [
      "1.4 m Vishwamitri overflow",
      "2 elderly persons",
      "4 persons in a farmhouse",
      "Kaccha road washed out",
      "2019 and 2024 flood damage",
      "6 cattle require livestock craft",
      "Livestock truck 7.4 km away",
    ]),
  },
];

export const RESOURCES: Resource[] = [
  {
    id: "B-14",
    name: "Rescue Boat B-14",
    type: "Boat",
    agency: "NDRF 4th Bn, Arakkonam",
    category: "OFFICIAL",
    lat: 9.9605,
    lng: 76.2925,
    base: "Ernakulam Boat Jetty",
    capacity: 12,
    capabilities: ["Shallow water", "Night ops", "Livestock", "Medical kit"],
    availability: "AVAILABLE",
    verified: true,
    contact: "+91 94470 10014",
    lastUpdate: "2 min ago",
  },
  {
    id: "NDRF-03",
    name: "NDRF Team Alpha-3",
    type: "Team",
    agency: "NDRF 8th Bn",
    category: "OFFICIAL",
    lat: 30.1,
    lng: 78.29,
    base: "Rishikesh Camp",
    capacity: 30,
    capabilities: ["Swift water", "Rope rescue", "First aid"],
    availability: "ENGAGED",
    verified: true,
    contact: "+91 93580 22013",
    lastUpdate: "6 min ago",
  },
  {
    id: "SDRF-21",
    name: "SDRF Boat 21",
    type: "Boat",
    agency: "Assam SDRF",
    category: "OFFICIAL",
    lat: 26.16,
    lng: 91.75,
    base: "Bharalumukh Depot",
    capacity: 10,
    capabilities: ["Shallow water", "Rescue winch"],
    availability: "AVAILABLE",
    verified: true,
    contact: "+91 70023 11821",
    lastUpdate: "4 min ago",
  },
  {
    id: "AMB-07",
    name: "108 Ambulance 07",
    type: "Ambulance",
    agency: "Odisha Health Services",
    category: "OFFICIAL",
    lat: 20.29,
    lng: 85.83,
    base: "Capital Hospital, Bhubaneswar",
    capacity: 2,
    capabilities: ["ALS", "Oxygen", "Paramedic"],
    availability: "ENGAGED",
    verified: true,
    contact: "108",
    lastUpdate: "1 min ago",
  },
  {
    id: "FIRE-11",
    name: "Fire Rescue Unit 11",
    type: "Truck",
    agency: "Mumbai Fire Brigade",
    category: "OFFICIAL",
    lat: 19.08,
    lng: 72.88,
    base: "Kurla Fire Station",
    capacity: 8,
    capabilities: ["High clearance", "Pump", "Cutting tools"],
    availability: "ENGAGED",
    verified: true,
    contact: "101",
    lastUpdate: "3 min ago",
  },
  {
    id: "CIV-33",
    name: "Fishermen Unit – Kumbalangi",
    type: "Boat",
    agency: "Kerala Fishermen Collective",
    category: "CIVILIAN",
    lat: 9.88,
    lng: 76.31,
    base: "Kumbalangi Harbour",
    capacity: 9,
    capabilities: ["Shallow water", "Local knowledge"],
    availability: "AVAILABLE",
    verified: true,
    contact: "+91 98460 55321",
    lastUpdate: "9 min ago",
  },
  {
    id: "CIV-48",
    name: "Country Barge – Digha Ghat",
    type: "Boat",
    agency: "Patna Boat Owners Assn.",
    category: "CIVILIAN",
    lat: 25.61,
    lng: 85.11,
    base: "Digha Ghat",
    capacity: 16,
    capabilities: ["Livestock", "Heavy load", "Shallow water"],
    availability: "AVAILABLE",
    verified: true,
    contact: "+91 90065 74410",
    lastUpdate: "12 min ago",
  },
  {
    id: "CIV-52",
    name: "Volunteer Tractor Convoy",
    type: "Truck",
    agency: "Vadodara Yuva Seva",
    category: "CIVILIAN",
    lat: 22.33,
    lng: 73.2,
    base: "Akota Depot",
    capacity: 20,
    capabilities: ["Livestock", "High clearance", "Supply run"],
    availability: "AVAILABLE",
    verified: false,
    contact: "+91 99250 44120",
    lastUpdate: "21 min ago",
  },
  {
    id: "HELI-02",
    name: "IAF Mi-17 Sortie 02",
    type: "Helicopter",
    agency: "Indian Air Force, Sulur",
    category: "OFFICIAL",
    lat: 10.02,
    lng: 76.31,
    base: "INS Garuda, Kochi",
    capacity: 24,
    capabilities: ["Winch", "Air drop", "Long range"],
    availability: "AVAILABLE",
    verified: true,
    contact: "Ops desk",
    lastUpdate: "7 min ago",
  },
  {
    id: "CIV-61",
    name: "Volunteer Medical Squad",
    type: "Team",
    agency: "Kolkata Civil Defence Volunteers",
    category: "CIVILIAN",
    lat: 22.56,
    lng: 88.37,
    base: "Tollygunge Ward Office",
    capacity: 12,
    capabilities: ["First aid", "Local knowledge"],
    availability: "AVAILABLE",
    verified: true,
    contact: "+91 98300 91765",
    lastUpdate: "5 min ago",
  },
];

export const CAMPS: Camp[] = [
  {
    id: "RC-KL-01",
    name: "Govt. Higher Secondary School, Aluva",
    district: "Ernakulam",
    state: "Kerala",
    lat: 10.1076,
    lng: 76.3516,
    capacity: 850,
    occupancy: 792,
    foodDays: 2,
    waterDays: 3,
    medicalStaff: 4,
    urgent: ["Baby food", "ORS packets"],
    status: "STRAINED",
  },
  {
    id: "RC-AS-02",
    name: "Pandu College Relief Camp, Guwahati",
    district: "Kamrup Metro",
    state: "Assam",
    lat: 26.1697,
    lng: 91.6796,
    capacity: 600,
    occupancy: 418,
    foodDays: 4,
    waterDays: 2,
    medicalStaff: 3,
    urgent: ["Drinking water tankers"],
    status: "STABLE",
  },
  {
    id: "RC-BR-03",
    name: "Rajkiya Madhya Vidyalaya, Digha",
    district: "Patna",
    state: "Bihar",
    lat: 25.6094,
    lng: 85.1055,
    capacity: 500,
    occupancy: 505,
    foodDays: 1,
    waterDays: 1,
    medicalStaff: 1,
    urgent: ["Food grain", "Doctor deputation", "Cattle fodder"],
    status: "CRITICAL",
  },
  {
    id: "RC-OD-04",
    name: "Nayapalli Community Hall",
    district: "Khordha",
    state: "Odisha",
    lat: 20.2887,
    lng: 85.8098,
    capacity: 400,
    occupancy: 210,
    foodDays: 5,
    waterDays: 5,
    medicalStaff: 2,
    urgent: [],
    status: "STABLE",
  },
  {
    id: "RC-WB-05",
    name: "Tollygunge Municipal School",
    district: "South 24 Parganas",
    state: "West Bengal",
    lat: 22.4941,
    lng: 88.3639,
    capacity: 450,
    occupancy: 366,
    foodDays: 3,
    waterDays: 2,
    medicalStaff: 2,
    urgent: ["Mosquito nets"],
    status: "STRAINED",
  },
  {
    id: "RC-UK-06",
    name: "Rishikesh Municipal Shelter",
    district: "Dehradun",
    state: "Uttarakhand",
    lat: 30.1023,
    lng: 78.2932,
    capacity: 300,
    occupancy: 128,
    foodDays: 6,
    waterDays: 4,
    medicalStaff: 2,
    urgent: ["Blankets"],
    status: "STABLE",
  },
];

export const FLOOD_ZONES: FloodZone[] = [
  {
    id: "FZ-01",
    name: "Periyar Basin – Aluva to Ernakulam",
    state: "Kerala",
    river: "Periyar",
    risk: "SEVERE",
    probability: 0.91,
    radiusKm: 14,
    lat: 10.02,
    lng: 76.31,
    forecast: "Idukki dam shutters at 3 open; 2.1 m rise expected in 12 hrs",
  },
  {
    id: "FZ-02",
    name: "Brahmaputra – Guwahati stretch",
    state: "Assam",
    river: "Brahmaputra",
    risk: "SEVERE",
    probability: 0.87,
    radiusKm: 18,
    lat: 26.18,
    lng: 91.72,
    forecast: "Flowing 0.6 m above danger level at Pandu gauge",
  },
  {
    id: "FZ-03",
    name: "Ganga – Patna urban belt",
    state: "Bihar",
    river: "Ganga",
    risk: "HIGH",
    probability: 0.74,
    radiusKm: 16,
    lat: 25.6,
    lng: 85.13,
    forecast: "Gandak inflow rising; embankment seepage at Digha",
  },
  {
    id: "FZ-04",
    name: "Mahanadi delta – Khordha",
    state: "Odisha",
    river: "Mahanadi",
    risk: "MODERATE",
    probability: 0.52,
    radiusKm: 20,
    lat: 20.31,
    lng: 85.79,
    forecast: "Hirakud release moderated; local drainage congestion",
  },
  {
    id: "FZ-05",
    name: "Ganga – Rishikesh flash flood corridor",
    state: "Uttarakhand",
    river: "Ganga",
    risk: "HIGH",
    probability: 0.68,
    radiusKm: 9,
    lat: 30.09,
    lng: 78.27,
    forecast: "Cloudburst warning for upper catchment tonight",
  },
  {
    id: "FZ-06",
    name: "Mithi river – Kurla / Sion",
    state: "Maharashtra",
    river: "Mithi",
    risk: "MODERATE",
    probability: 0.58,
    radiusKm: 8,
    lat: 19.07,
    lng: 72.88,
    forecast: "High tide 4.6 m at 21:10 with heavy rain spell",
  },
];

export const FACILITIES: Facility[] = [
  {
    id: "H1",
    name: "Ernakulam General Hospital",
    kind: "HOSPITAL",
    lat: 9.9755,
    lng: 76.2795,
    detail: "42 beds free · Trauma unit",
  },
  {
    id: "H2",
    name: "Gauhati Medical College",
    kind: "HOSPITAL",
    lat: 26.1445,
    lng: 91.7016,
    detail: "18 beds free · Dialysis",
  },
  {
    id: "H3",
    name: "PMCH Patna",
    kind: "HOSPITAL",
    lat: 25.6205,
    lng: 85.1614,
    detail: "9 beds free · Snakebite AV stock",
  },
  {
    id: "S1",
    name: "Aluva Town Hall Shelter",
    kind: "SHELTER",
    lat: 10.1121,
    lng: 76.3495,
    detail: "Capacity 300 · 140 occupied",
  },
  {
    id: "S2",
    name: "Kurla Municipal School Shelter",
    kind: "SHELTER",
    lat: 19.0724,
    lng: 72.8896,
    detail: "Capacity 250 · 96 occupied",
  },
];

export const RIVERS: { name: string; path: [number, number][] }[] = [
  {
    name: "Periyar",
    path: [
      [10.18, 76.42],
      [10.11, 76.35],
      [10.03, 76.31],
      [9.98, 76.28],
      [9.93, 76.26],
    ],
  },
  {
    name: "Brahmaputra",
    path: [
      [26.25, 91.5],
      [26.2, 91.62],
      [26.18, 91.72],
      [26.14, 91.84],
    ],
  },
  {
    name: "Ganga (Patna)",
    path: [
      [25.64, 84.98],
      [25.62, 85.09],
      [25.6, 85.2],
      [25.58, 85.32],
    ],
  },
];

export const BLOCKED_ROADS: {
  name: string;
  path: [number, number][];
  reason: string;
}[] = [
  {
    name: "NH-66 service road, Edappally",
    path: [
      [10.02, 76.3],
      [9.98, 76.29],
      [9.95, 76.28],
    ],
    reason: "Submerged 1.8 m",
  },
  {
    name: "Embankment Road, Digha",
    path: [
      [25.62, 85.1],
      [25.6, 85.13],
    ],
    reason: "Breach at two points",
  },
];

export const SAFE_ROUTE: {
  sosId: string;
  resourceId: string;
  path: [number, number][];
  km: number;
  etaMin: number;
  nodes: number;
} = {
  sosId: "A1024",
  resourceId: "B-14",
  path: [
    [9.9605, 76.2925],
    [9.9552, 76.2861],
    [9.9481, 76.2812],
    [9.9402, 76.2751],
    [9.9312, 76.2673],
  ],
  km: 4.2,
  etaMin: 18,
  nodes: 1_248,
};

export const ANALYTICS = {
  sosTrend: [
    { t: "06:00", app: 12, sms: 21 },
    { t: "08:00", app: 26, sms: 38 },
    { t: "10:00", app: 41, sms: 55 },
    { t: "12:00", app: 63, sms: 72 },
    { t: "14:00", app: 58, sms: 84 },
    { t: "16:00", app: 47, sms: 66 },
    { t: "18:00", app: 39, sms: 51 },
  ],
  responseTime: [
    { d: "Mon", min: 74 },
    { d: "Tue", min: 66 },
    { d: "Wed", min: 59 },
    { d: "Thu", min: 48 },
    { d: "Fri", min: 43 },
    { d: "Sat", min: 39 },
    { d: "Sun", min: 34 },
  ],
  rescued: [
    { d: "Mon", people: 210 },
    { d: "Tue", people: 380 },
    { d: "Wed", people: 512 },
    { d: "Thu", people: 640 },
    { d: "Fri", people: 902 },
    { d: "Sat", people: 1180 },
    { d: "Sun", people: 1425 },
  ],
  utilisation: [
    { name: "NDRF", used: 82 },
    { name: "SDRF", used: 71 },
    { name: "Fire", used: 64 },
    { name: "Ambulance", used: 58 },
    { name: "Civilian boats", used: 47 },
    { name: "Volunteers", used: 39 },
  ],
  floodRisk: [
    { t: "D-3", kerala: 42, assam: 55, bihar: 38 },
    { t: "D-2", kerala: 58, assam: 63, bihar: 47 },
    { t: "D-1", kerala: 74, assam: 78, bihar: 61 },
    { t: "D0", kerala: 91, assam: 87, bihar: 74 },
    { t: "D+1", kerala: 84, assam: 81, bihar: 79 },
  ],
  campOccupancy: CAMPS.map((c) => ({
    name: c.id.replace("RC-", ""),
    occ: Math.round((c.occupancy / c.capacity) * 100),
  })),
  accuracy: [
    { m: "Mar", acc: 78 },
    { m: "Apr", acc: 81 },
    { m: "May", acc: 84 },
    { m: "Jun", acc: 88 },
    { m: "Jul", acc: 90 },
    { m: "Aug", acc: 92 },
  ],
};
