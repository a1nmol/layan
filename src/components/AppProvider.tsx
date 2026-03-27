"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { initAudioEngine } from "@/lib/audioEngine";
import { YouTubePlayerComponent } from "@/components/youtube/YouTubePlayerComponent";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const init = usePlayerStore((s) => s.init);

  useEffect(() => {
    initAudioEngine();
    init();
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed", err));
    }
  }, []);

  return (
    <>
      <YouTubePlayerComponent />
      {children}
    </>
  );
}
