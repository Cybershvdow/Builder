import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EDEN Systems AI | Cultivating Intelligence",
  description:
    "AI consulting and development studio. We design, build, and integrate AI systems that transform how businesses operate — from autonomous agents to enterprise-scale automation.",
  keywords: [
    "AI consulting",
    "AI agents",
    "artificial intelligence",
    "automation",
    "machine learning",
    "AI integration",
    "AI strategy",
  ],
  openGraph: {
    title: "EDEN Systems AI | Cultivating Intelligence",
    description:
      "AI consulting and development studio. We design, build, and integrate AI systems that transform how businesses operate.",
    type: "website",
    url: "https://edensystems.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col grain-overlay">{children}</body>
    </html>
  );
}
