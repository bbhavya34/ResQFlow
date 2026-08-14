import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Aegis Bharat — Disaster Response Platform",
    template: "%s — Aegis Bharat",
  },
  description:
    "Prototype command centre for SOS triage, resource allocation, safe routing and relief-camp operations.",
  authors: [{ name: "Aegis Bharat" }],
  openGraph: {
    title: "Aegis Bharat — Disaster Response Platform",
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
