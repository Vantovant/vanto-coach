import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { ClientBody } from "./ClientBody";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vanto Coach - Executive Christian Life Coach",
  description: "AI-powered executive Christian life coach that listens to your voice, preserves your words, extracts actionable plans, and gives Bible-grounded counsel.",
  keywords: ["Christian", "Life Coach", "Executive", "AI", "Voice Diary", "Bible", "Spiritual Growth"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable}`}>
      <head />
      <body className="antialiased font-sans">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
