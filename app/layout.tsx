import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "FloodRadar — Disaster Response Platform",
    template: "%s — FloodRadar",
  },
  description:
    "Prototype command centre for SOS triage, resource allocation, safe routing and relief-camp operations.",
  authors: [{ name: "FloodRadar" }],
  openGraph: {
    title: "FloodRadar — Disaster Response Platform",
    description:
      "Unified disaster-response command centre prototype for India.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
