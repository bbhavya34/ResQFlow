import type { Metadata } from "next";
import { OfflineCompassNavigation } from "@/components/aegis/OfflineCompassNavigation";

export const metadata: Metadata = {
  title: "Offline Flood SOS & Safehouse Compass",
  description:
    "Zero-network emergency flood navigation and nearest safehouse routing for displaced citizens and field responders.",
};

export default function OfflineSOSPage() {
  return (
    <div className="py-2">
      <OfflineCompassNavigation />
    </div>
  );
}