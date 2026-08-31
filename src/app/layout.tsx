import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Utsav — Shri Shri Thakur Anukul Chandra | Burdwan Satsang",
  description:
    "You are cordially invited to the Utsav of Shri Shri Thakur Anukul Chandra, organised by Satsang Burdwan.",
  openGraph: {
    title: "Utsav — Shri Shri Thakur Anukul Chandra",
    description: "Join us for a divine Utsav at Burdwan Satsang Bhavan.",
    type: "website",
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
