import type { Metadata } from "next";
import { Geist, Galada } from "next/font/google";
import "./globals.css";
import SWRegister from "./sw-register";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const galada = Galada({ variable: "--font-galada", subsets: ["bengali"], weight: "400" });

export const metadata: Metadata = {
  metadataBase: new URL("https://utsav.databind.in"),
  title: "প্ৰিয়বোধী মহোৎসব | Galsi, Purba Bardhaman",
  description:
    "You are cordially invited to Priyabodhi Mahotsav on 20 December 2026 at Galsi, Purba Bardhaman.",
  openGraph: {
    title: "প্ৰিয়বোধী মহোৎসব | 20 December 2026",
    description: "You are cordially invited — Galsi, Purba Bardhaman Sadar North Subdivision.",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "প্ৰিয়বোধী মহোৎসব",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "প্ৰিয়বোধী মহোৎসব | 20 December 2026",
    description: "You are cordially invited — Galsi, Purba Bardhaman.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${galada.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A96E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Priyabodhi" />
      </head>
      <body className="antialiased">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
