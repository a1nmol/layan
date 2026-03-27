"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Heart, ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { seekAudio } from "@/lib/audioEngine";
import { ArtworkImage } from "@/components/ui/ArtworkImage";
import { formatTime, cn } from "@/lib/utils";

export function FullScreenPlayer() {
  const {
    showFullPlayer, setShowFullPlayer, currentTrack, isPlaying,
    progress, duration, volume, isMuted, shuffle, repeat,
    togglePlay, playNext, playPrev, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, toggleLike, setShowQueue,
  } = usePlayerStore();

  const [dragValue, setDragValue] = useState<number | null>(null);
  const isDragging = useRef(false);

  const displayProgress = isDragging.current && dragValue !== null ? dragValue : progress;
  const currentTime = duration * displayProgress;

  return (
    <AnimatePresence>
      {showFullPlayer && currentTrack && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 250 }}
          className="fixed inset-0 z-40 flex flex-col overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {/* Blurred artwork background */}
          {currentTrack.artwork && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url(${currentTrack.artwork})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(60px) saturate(2)",
                transform: "scale(1.2)",
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,15,0.3), rgba(10,10,15,0.9))" }}
          />

          <div className="relative flex flex-col h-full max-w-2xl mx-auto w-full px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setShowFullPlayer(false)} className="text-gray-400 hover:text-white transition-smooth">
                <ChevronDown size={28} />
              </button>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Now Playing</p>
              <button
                onClick={() => { setShowQueue(true); setShowFullPlayer(false); }}
                className="text-gray-400 hover:text-white transition-smooth"
              >
                <ListMusic size={22} />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                key={currentTrack.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className={cn("w-72 h-72 shadow-2xl", isPlaying ? "animate-float" : "")}
              >
                <ArtworkImage src={currentTrack.artwork} className="w-full h-full" rounded="rounded-2xl" />
              </motion.div>
            </div>

            {/* Track info */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">{currentTrack.title}</h2>
                <p className="text-gray-400 truncate mt-1">{currentTrack.artist}</p>
                {currentTrack.album !== "Unknown Album" && (
                  <p className="text-gray-600 text-sm truncate">{currentTrack.album}</p>
                )}
              </div>
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className={cn("ml-4 transition-smooth", currentTrack.liked ? "text-pink-500" : "text-gray-500 hover:text-white")}
              >
                <Heart size={26} fill={currentTrack.liked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Seek bar */}
            <div className="mb-6">
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={displayProgress}
                onMouseDown={() => {
                  isDragging.current = true;
                  setDragValue(progress);
                }}
                onTouchStart={() => {
                  isDragging.current = true;
                  setDragValue(progress);
                }}
                onChange={(e) => {
                  if (isDragging.current) {
                    setDragValue(parseFloat(e.target.value));
                  }
                }}
                onMouseUp={(e) => {
                  const val = parseFloat(e.currentTarget.value);
                  isDragging.current = false;
                  seekAudio(val);
                  setDragValue(null);
                }}
                onTouchEnd={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  isDragging.current = false;
                  seekAudio(val);
                  setDragValue(null);
                }}
                className="w-full h-1.5 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 ${displayProgress * 100}%, rgba(255,255,255,0.15) ${displayProgress * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500 tabular-nums">{formatTime(currentTime)}</span>
                <span className="text-xs text-gray-500 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={toggleShuffle} className={cn(shuffle ? "text-purple-400" : "text-gray-500 hover:text-white", "transition-smooth")}>
                <Shuffle size={22} />
              </button>
              <button onClick={playPrev} className="text-gray-300 hover:text-white transition-smooth">
                <SkipBack size={28} />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full flex items-center justify-center text-black transition-smooth hover:scale-105 active:scale-95 shadow-lg"
                style={{ background: "white" }}
              >
                {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
              </button>
              <button onClick={playNext} className="text-gray-300 hover:text-white transition-smooth">
                <SkipForward size={28} />
              </button>
              <button onClick={cycleRepeat} className={cn(repeat !== "off" ? "text-purple-400" : "text-gray-500 hover:text-white", "transition-smooth")}>
                {repeat === "one" ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 mb-4">
              <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-smooth">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
