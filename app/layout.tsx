import type { Metadata } from "next";
import { Be_Vietnam_Pro, Noto_Sans } from "next/font/google";
import ErrorBoundary from "./components/ErrorBoundary";
import { SoundManagerProvider } from "./components/SoundManagerProvider";
import { ToastProvider } from "./components/ui/Toast";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const notoSans = Noto_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${beVietnamPro.variable} ${notoSans.variable} font-body antialiased overflow-x-hidden`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <SoundManagerProvider>
              {children}
            </SoundManagerProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
