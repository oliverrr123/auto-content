"use client";
import React from "react";

import { AnimatePresence } from "motion/react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

export function CoolButton() {
  return (
    <>
        <button className="flex items-center justify-center max-w-sm w-full mx-auto p-4 relative hover:scale-105 transition-all duration-300">
          <AnimatePresence>
            <div className="h-full w-full absolute inset-0">
              <CanvasRevealEffect
                showGradient={false}
                animationSpeed={3}
                containerClassName="bg-primary"
                colors={[
                  [255, 255, 255],
                  [160, 160, 255],
                ]}
              />
            </div>
          </AnimatePresence>
          <div className="relative z-20">
            <h2 className="dark:text-white capitalize text-xl tracking-wide relative z-10 text-white mt-4 font-bold -translate-y-2 transition duration-200 drop-shadow-md">
              TRY FOR FREE NOW
            </h2>
          </div>
        </button>
    </>
  );
}