"use client";

import { useEffect } from "react";
import { initYouTubePlayer } from "@/lib/youtubePlayer";

const CONTAINER_ID = "yt-player-container";

export function YouTubePlayerComponent() {
  useEffect(() => {
    initYouTubePlayer(CONTAINER_ID);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 1,
        height: 1,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0,
      }}
    >
      <div id={CONTAINER_ID} />
    </div>
  );
}
