"use client";
import MobileNavbar from "@/components/mobile-navbar";
import MobileHeader from "@/components/mobile-header";
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import DesktopAI from "@/components/desktop-ai"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useMediaQuery } from "@react-hook/media-query"

export default function Page({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <main className="p-4 py-16 w-full h-dvh">
          {children}
        </main>
        <MobileNavbar />
      </>
    )
  } else {
      return (
        <SidebarProvider className="h-screen">
          <AppSidebar />
          <SidebarInset className="overflow-hidden flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full"
              >
                <ResizablePanel defaultSize={50} minSize={26} className="bg-slate-100">
                  <div className="h-full p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {children}
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30} className="bg-slate-100">
                  <div className="h-full p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <DesktopAI />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </SidebarInset>
        </SidebarProvider>
      )
  }

  return null;

}
