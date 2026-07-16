import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cinzel, DM_Sans, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { CourtroomBackground } from "@/components/layout/CourtroomBackground";
import { BackgroundMusicProvider } from "@/components/layout/BackgroundMusic";
import { PageTransition } from "@/components/layout/PageTransition";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-arcade",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "BEEF — Viral Decision Engine",
  description: "Settle arguments with AI. Two sides. One verdict. Zero mercy.",
  openGraph: {
    title: "BEEF",
    description: "Settle arguments with AI. Share the verdict.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${pressStart2P.variable} relative z-0 flex h-dvh flex-col overflow-hidden bg-background font-body antialiased`}
      >
        <CourtroomBackground />
        <ConvexClientProvider>
          <BackgroundMusicProvider>
            <div className="min-h-0 flex-1 overflow-hidden">
              <PageTransition>{children}</PageTransition>
            </div>
          </BackgroundMusicProvider>
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
