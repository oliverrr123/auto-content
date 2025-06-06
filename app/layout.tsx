import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileNavbar from "@/components/mobile-navbar";
import MobileHeader from "@/components/mobile-header";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoContent",
  description: "Automatically create content for your social media!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}
      >
        <AuthProvider>
          <MobileHeader />
          <main className="p-4 py-24 w-full h-dvh">
            {children}
          </main>
          <MobileNavbar />
        </AuthProvider>
      </body>
    </html>
  );
}
