"use client";

import { useState, useRef } from "react";
import { Play, Pause, SkipForward, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import { seekAudio } from "@/lib/audioEngine";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { cn } from "@/lib/utils";

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress, duration,
    togglePlay, playNext, setShowFullPlayer, toggleLike,
  } = usePlayerStore();

  const [dragValue, setDragValue] = useState<number | null>(null);
  const isDragging = useRef(false);
  const displayProgress = isDragging.current && dragValue !== null ? dragValue : progress;

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Progress bar — thin strip at very top */}
        <div className="relative h-0.5 w-full" style={{ background: "var(--bg-hover)" }}>
          <div
            className="absolute left-0 top-0 h-full transition-none"
            style={{ width: `${displayProgress * 100}%`, background: "#a855f7" }}
          />
          {/* Invisible range for seeking */}
          <input
            type="range"
            min={0} max={1} step={0.001}
            value={displayProgress}
            onMouseDown={() => { isDragging.current = true; setDragValue(progress); }}
            onTouchStart={() => { isDragging.current = true; setDragValue(progress); }}
            onChange={(e) => { if (isDragging.current) setDragValue(parseFloat(e.target.value)); }}
            onMouseUp={(e) => { isDragging.current = false; seekAudio(parseFloat(e.currentTarget.value)); setDragValue(null); }}
            onTouchEnd={(e) => { isDragging.current = false; seekAudio(parseFloat((e.target as HTMLInputElement).value)); setDragValue(null); }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ height: "100%" }}
          />
        </div>

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-2" style={{ height: 64 }}>
          {/* Artwork — tap to open full player */}
          <button
            onClick={() => setShowFullPlayer(true)}
            className="shrink-0 relative"
          >
            <ArtworkImage
              src={currentTrack.artwork}
              className="w-11 h-11"
              rounded="rounded-lg"
            />
            {isPlaying && (
              <div className="absolute bottom-0.5 right-0.5 flex gap-0.5 items-end">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-0.5 bg-purple-400 rounded-full bar-${i}`} style={{ height: 3 }} />
                ))}
              </div>
            )}
          </button>

          {/* Track info */}
          <button
            onClick={() => setShowFullPlayer(true)}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-sm font-medium text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
              {currentTrack.artist}
            </p>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={cn(
                "p-2 transition-smooth",
                currentTrack.liked ? "text-pink-500" : "text-gray-500"
              )}
            >
              <Heart size={18} fill={currentTrack.liked ? "currentColor" : "none"} />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black"
              style={{ background: "white" }}
            >
              {isPlaying
                ? <Pause size={18} />
                : <Play size={18} className="ml-0.5" />
              }
            </button>

            <button
              onClick={playNext}
              className="p-2 text-gray-400"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
