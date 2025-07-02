"use client";
import { useMediaQuery } from "@react-hook/media-query"
import dynamic from "next/dynamic";
import { useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const MobileLayout = dynamic(() => import("@/components/mobile-layout"), {
  ssr: false,
  loading: () => null,
})

const DesktopLayout = dynamic(() => import("@/components/desktop-layout"), {
  ssr: false,
  loading: () => null,
})

export default function Page({ children }: { children: React.ReactNode }) {
  const queryClient = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60_000,
          refetchOnWindowFocus: false,
        },
      },
    })
  ).current;

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const LayoutComponent = !isDesktop ? MobileLayout : DesktopLayout;

  return (
    <QueryClientProvider client={queryClient}>
      <LayoutComponent>{children}</LayoutComponent>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
