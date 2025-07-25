"use client";
import MobileNavbar from "@/components/mobile-navbar";
import MobileHeader from "@/components/mobile-header";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
      <>
        <MobileHeader />
        <main className="p-4 py-16 w-full h-dvh">
          {children}
        </main>
        <MobileNavbar />
      </>
    )
}
