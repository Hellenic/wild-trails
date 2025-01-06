import type { Metadata } from "next";
import { Inter, Bitter } from "next/font/google";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wild Trails",
  description:
    "Wild Trails is a real-world adventure game that combines orienteering, puzzle-solving, and geocaching, where players navigate through wilderness using clues to find their final destination within a time limit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${bitter.variable} font-sans antialiased`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
