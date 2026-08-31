import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "প্ৰিয়বোধী মহোৎসব | Galsi, Purba Bardhaman",
  description:
    "You are cordially invited to Priyabodhi Mahotsav on 20 December 2026 at Galsi, Purba Bardhaman.",
  openGraph: {
    title: "প্ৰিয়বোধী মহোৎসব | 20 December 2026",
    description: "You are cordially invited — Galsi, Purba Bardhaman Sadar North Subdivision.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
