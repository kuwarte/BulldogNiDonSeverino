import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AGAP — Emergency Help",
  description: "Request immediate emergency assistance",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ef4444",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StatusBar from "@/components/StatusBar";
import PhoneNavBar from "@/components/PhoneNavBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fil" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <div
          id="phone-shell"
          className="relative flex flex-col h-full overflow-hidden"
        >
          <StatusBar />
          <div className="flex-1 min-h-0 overflow-y-auto pt-9 pb-12">
            {children}
          </div>
          <PhoneNavBar />
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
