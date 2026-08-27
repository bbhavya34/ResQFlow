/**
 * capGenerator.ts
 * ============================================================================
 * QFlow CAP 1.2 XML Adapter
 *
 * Generates a standards-compliant OASIS Common Alerting Protocol (CAP) v1.2
 * XML string for ingest by Cell Broadcast Systems (CBS), IPAWS, CAP-India,
 * or any other public-safety alerting infrastructure.
 * ============================================================================
 */

export interface CAPAlertParams {
  senderId: string;
  headline: string;
  description: string;
  areaPolygon: ReadonlyArray<readonly [number, number]>;
  status?: "Actual" | "Exercise" | "System" | "Test" | "Draft";
  msgType?: "Alert" | "Update" | "Cancel" | "Ack" | "Error";
  urgency?: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  severity?: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty?: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  language?: string;
  eventCategory?: string;
  responseType?: string;
}

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatCAPDateTime(date: Date): string {
  const pad = (n: number, digits = 2): string =>
    String(n).padStart(digits, "0");

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOff = Math.abs(offsetMinutes);
  const offHH = pad(Math.floor(absOff / 60));
  const offMM = pad(absOff % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offHH}:${offMM}`
  );
}

function buildPolygonString(
  areaPolygon: ReadonlyArray<readonly [number, number]>,
): string {
  return areaPolygon
    .map(([lat, lng]) => {
      if (!isFinite(lat) || !isFinite(lng)) {
        throw new Error(
          `[QFlow/capGenerator] Invalid polygon vertex: [${lat}, ${lng}]. All vertices must be finite numbers.`,
        );
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error(
          `[QFlow/capGenerator] Polygon vertex out of WGS-84 range: lat=${lat}, lon=${lng}.`,
        );
      }
      return `${lat},${lng}`;
    })
    .join(" ");
}

export function generateCAP12Alert(params: CAPAlertParams): string {
  const {
    senderId,
    headline,
    description,
    areaPolygon,
    status = "Actual",
    msgType = "Alert",
    urgency = "Immediate",
    severity = "Extreme",
    certainty = "Observed",
    language = "en-IN",
    eventCategory = "Geo",
    responseType = "Evacuate",
  } = params;

  if (!senderId.trim()) {
    throw new Error("[QFlow/capGenerator] senderId must not be empty.");
  }
  if (!headline.trim()) {
    throw new Error("[QFlow/capGenerator] headline must not be empty.");
  }
  if (!description.trim()) {
    throw new Error("[QFlow/capGenerator] description must not be empty.");
  }
  if (!Array.isArray(areaPolygon) || areaPolygon.length < 3) {
    throw new Error(
      "[QFlow/capGenerator] areaPolygon must have at least 3 vertices.",
    );
  }

  const now = new Date();
  const sentDate = formatCAPDateTime(now);
  const identifier = `qflow-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const expires = formatCAPDateTime(new Date(now.getTime() + 6 * 60 * 60 * 1000));
  const polygonStr = buildPolygonString(areaPolygon);

  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${escapeXml(identifier)}</identifier>
  <sender>${escapeXml(senderId)}</sender>
  <sent>${sentDate}</sent>
  <status>${escapeXml(status)}</status>
  <msgType>${escapeXml(msgType)}</msgType>
  <source>QFlow Offline Flood SOS System v1.0</source>
  <scope>Public</scope>
  <code>IPAWSv1.0</code>
  <info>
    <language>${escapeXml(language)}</language>
    <category>${escapeXml(eventCategory)}</category>
    <event>Flood Emergency</event>
    <responseType>${escapeXml(responseType)}</responseType>
    <urgency>${escapeXml(urgency)}</urgency>
    <severity>${escapeXml(severity)}</urgency>
    <certainty>${escapeXml(certainty)}</certainty>
    <onset>${sentDate}</onset>
    <expires>${expires}</expires>
    <senderName>${escapeXml(senderId)}</senderName>
    <headline>${escapeXml(headline)}</headline>
    <description>${escapeXml(description)}</description>
    <instruction>Follow the compass heading indicated by the QFlow SOS system. Proceed to the nearest pre-verified safehouse. Avoid floodwater contact.</instruction>
    <web>https://qflow.resqflow.in/offline-sos</web>
    <contact>National Disaster Helpline: 1078</contact>
    <area>
      <areaDesc>QFlow Flood Impact Zone - Derived from GPS Telemetry</areaDesc>
      <polygon>${escapeXml(polygonStr)}</polygon>
    </area>
  </info>
</alert>`.trim();
}
