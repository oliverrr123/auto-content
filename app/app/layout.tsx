"use client";
import { useMediaQuery } from "@react-hook/media-query"
import dynamic from "next/dynamic";

const MobileLayout = dynamic(() => import("@/components/mobile-layout"), {
  ssr: false,
  loading: () => null,
})

const DesktopLayout = dynamic(() => import("@/components/desktop-layout"), {
  ssr: false,
  loading: () => null,
})

export default function Page({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 640px)")

  return !isDesktop ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  )
}
