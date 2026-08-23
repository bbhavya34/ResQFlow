import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "ResQFlow — Disaster Response Platform",
    template: "%s — ResQFlow",
  },
  description:
    "Command centre for SOS triage, resource allocation, safe routing and relief-camp operations.",
  authors: [{ name: "ResQFlow" }],
  openGraph: {
    title: "ResQFlow — Disaster Response Platform",
    description: "Unified disaster-response command centre platform for India.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
